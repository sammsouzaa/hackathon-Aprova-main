"""Contexto de um cliente/projeto: material de apoio analisado antes da reunião.

contextos/<id>/
  meta.json          nome, descrição
  arquivos/          originais (txt, md, pdf, png, jpg, docx, mp3...). Pode copiar direto para cá.
  extracoes/         uma extração por arquivo (feita UMA vez, enquanto o arquivo não mudar)
  processados.json   hash de cada arquivo já extraído
  contexto.md        tudo consolidado; é o que vai para o copiloto (editável à mão)
  glossario.json     termos com a grafia certa; vai para o prompt da transcrição
  checklist.json     perguntas a cobrir na reunião
"""
import hashlib
import json
import re
import uuid
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from google.genai import types

import config
import gemini
import prompts
from log import aviso, erro, info

PASTA_CONTEXTOS = Path(__file__).parent / "contextos"

MIMES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
}
TEXTO = {".txt", ".md", ".csv", ".json", ".log", ".html", ".xml"}

# Respostas do chat do contexto, por pergunta + versão do contexto (só em memória)
_CACHE_RESPOSTAS: dict[str, str] = {}
MAX_HISTORICO = 8


def _ler_json(arq: Path, padrao):
    try:
        return json.loads(arq.read_text(encoding="utf-8"))
    except Exception:
        return padrao


def _gravar_json(arq: Path, dados) -> None:
    tmp = arq.with_suffix(".tmp")
    tmp.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(arq)


def _ler_texto(arq: Path) -> str:
    dados = arq.read_bytes()
    for cod in ("utf-8", "cp1252"):
        try:
            return dados.decode(cod)
        except UnicodeDecodeError:
            continue
    return dados.decode("utf-8", errors="replace")


def _ler_docx(arq: Path) -> str:
    with zipfile.ZipFile(arq) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="replace")
    xml = re.sub(r"</w:p>", "\n", xml)
    return re.sub(r"<[^>]+>", "", xml)


def nome_seguro(nome: str) -> str:
    nome = Path(nome or "arquivo").name
    return re.sub(r"[^\w.\- ]", "_", nome).strip()[:120] or "arquivo"


def _hash(arq: Path) -> str:
    return hashlib.sha256(arq.read_bytes()).hexdigest()


def _normalizar(texto: str) -> str:
    return re.sub(r"\W+", " ", texto.lower()).strip()


def novo_item(pergunta: str, categoria: str = "", obrigatoria: bool = False, origem: str = "manual",
              titulo: str = "", valor_referencia: Optional[str] = None,
              confirmado_no_contexto: bool = False, resposta_contexto: Optional[str] = None) -> dict:
    return {
        "id": uuid.uuid4().hex[:8],
        "codigo": "",  # CHK-01, CHK-02... numerado ao salvar
        "titulo": (titulo or pergunta).strip(),
        "pergunta": pergunta.strip(),
        "categoria": (categoria or "").strip(),
        "obrigatoria": bool(obrigatoria),
        "origem": origem,
        "valor_referencia": valor_referencia or None,
        "confirmado_no_contexto": bool(confirmado_no_contexto),
        "resposta_contexto": resposta_contexto or None,
    }


def numerar(itens: list[dict]) -> list[dict]:
    for n, item in enumerate(itens, 1):
        item["codigo"] = f"CHK-{n:02d}"
    return itens


class Contexto:
    def __init__(self, contexto_id: str):
        self.id = contexto_id
        self.pasta = PASTA_CONTEXTOS / contexto_id
        self.pasta_arquivos = self.pasta / "arquivos"
        self.pasta_extracoes = self.pasta / "extracoes"
        self.arq_meta = self.pasta / "meta.json"
        self.arq_processados = self.pasta / "processados.json"
        self.arq_contexto = self.pasta / "contexto.md"
        self.arq_glossario = self.pasta / "glossario.json"
        self.arq_checklist = self.pasta / "checklist.json"
        self.arq_rapidas = self.pasta / "perguntas_rapidas.json"

    # ----- leitura -----

    @property
    def meta(self) -> dict:
        return _ler_json(self.arq_meta, {"nome": self.id, "descricao": ""})

    @property
    def texto(self) -> str:
        return self.arq_contexto.read_text(encoding="utf-8") if self.arq_contexto.exists() else ""

    @property
    def glossario(self) -> list[str]:
        return _ler_json(self.arq_glossario, [])

    @property
    def checklist(self) -> list[dict]:
        return _ler_json(self.arq_checklist, [])

    @property
    def perguntas_rapidas(self) -> list[str]:
        return _ler_json(self.arq_rapidas, [])

    def salvar_perguntas_rapidas(self, perguntas: list[str]) -> None:
        _gravar_json(self.arq_rapidas, [p.strip() for p in perguntas if p.strip()])

    def arquivos(self) -> list[dict]:
        if not self.pasta_arquivos.exists():
            return []
        processados = _ler_json(self.arq_processados, {})
        saida = []
        for arq in sorted(self.pasta_arquivos.iterdir()):
            if not arq.is_file():
                continue
            p = processados.get(arq.name)
            saida.append({
                "nome": arq.name,
                "bytes": arq.stat().st_size,
                "processado_em": p["processado_em"] if p and p["hash"] == _hash(arq) else None,
                "erro": p.get("erro") if p else None,
            })
        return saida

    def resumo(self) -> dict:
        return {"id": self.id, **self.meta, "itens_checklist": len(self.checklist),
                "tem_contexto": self.arq_contexto.exists()}

    def completo(self) -> dict:
        return {
            **self.resumo(),
            "arquivos": self.arquivos(),
            "contexto": self.texto,
            "glossario": self.glossario,
            "checklist": self.checklist,
            "perguntas_rapidas": self.perguntas_rapidas,
        }

    # ----- escrita -----

    def criar(self, nome: str, descricao: str = "") -> None:
        self.pasta_arquivos.mkdir(parents=True, exist_ok=True)
        _gravar_json(self.arq_meta, {"nome": nome, "descricao": descricao,
                                     "criado_em": datetime.now().isoformat(timespec="seconds")})

    def salvar_arquivo(self, nome: str, dados: bytes) -> str:
        self.pasta_arquivos.mkdir(parents=True, exist_ok=True)
        nome = nome_seguro(nome)
        (self.pasta_arquivos / nome).write_bytes(dados)
        return nome

    def remover_arquivo(self, nome: str) -> bool:
        arq = self.pasta_arquivos / nome_seguro(nome)
        if not arq.exists():
            return False
        arq.unlink()
        (self.pasta_extracoes / f"{arq.name}.json").unlink(missing_ok=True)
        processados = _ler_json(self.arq_processados, {})
        processados.pop(arq.name, None)
        _gravar_json(self.arq_processados, processados)
        return True

    def ler_arquivo(self, nome: str) -> Optional[dict]:
        """Conteúdo de um arquivo do contexto (texto, se for legível) e a extração dele."""
        arq = self.pasta_arquivos / nome_seguro(nome)
        if not arq.is_file():
            return None
        ext = arq.suffix.lower()
        texto = _ler_texto(arq) if ext in TEXTO else _ler_docx(arq) if ext == ".docx" else None
        extracao = _ler_json(self.pasta_extracoes / f"{arq.name}.json", {}).get("conteudo")
        return {"nome": arq.name, "bytes": arq.stat().st_size, "texto": texto, "extracao": extracao}

    def texto_extracoes(self, max_chars: int = 40000) -> str:
        """Extração de cada documento: o contexto.md consolidado resume, aqui vai o detalhe.
        Cada bloco começa com "### <nome do arquivo>", que é o nome que a IA usa nas citações [[...]]."""
        partes = []
        for arq in sorted(self.pasta_extracoes.glob("*.json")) if self.pasta_extracoes.exists() else []:
            conteudo = _ler_json(arq, {}).get("conteudo")
            if conteudo:
                partes.append(f"### {arq.stem}\n{conteudo}")
        return "\n\n".join(partes)[:max_chars]

    def _prompt_pergunta(self, pergunta: str, historico: list[dict]) -> str:
        checklist = "\n".join(
            f"- {i['codigo']} {i['titulo']}: "
            + (f"confirmado ({i['resposta_contexto']})" if i["confirmado_no_contexto"]
               else f"pendente (referência: {i['valor_referencia'] or '-'})")
            for i in self.checklist)
        conversa = "\n".join(
            f"Implantador: {h.get('pergunta', '')}\nAssistente: {h.get('resposta', '')}"
            for h in historico[-MAX_HISTORICO:])
        return prompts.PERGUNTA_CONTEXTO.format(
            contexto=self.texto or "(sem contexto)",
            documentos=self.texto_extracoes() or "(nenhum)",
            checklist=checklist or "(vazio)",
            historico=conversa or "(início da conversa)",
            pergunta=pergunta,
        )

    def _chave_cache(self, pergunta: str) -> str:
        """Muda sempre que o contexto, o checklist ou as extrações mudarem."""
        base = json.dumps([self.id, self.texto, self.checklist, self.texto_extracoes(), _normalizar(pergunta)],
                          ensure_ascii=False)
        return hashlib.sha256(base.encode()).hexdigest()

    async def perguntar_stream(self, pergunta: str, historico: Optional[list[dict]] = None):
        """Resposta em pedaços. Sem histórico, a mesma pergunta sobre o mesmo contexto sai do cache, na hora."""
        historico = historico or []
        chave = None if historico else self._chave_cache(pergunta)
        if chave and chave in _CACHE_RESPOSTAS:
            yield _CACHE_RESPOSTAS[chave]
            return
        partes = []
        async for pedaco in gemini.gerar_stream(
            config.MODELOS_ANALISE,
            [self._prompt_pergunta(pergunta, historico)],
            prompts.CONFIG_PERGUNTA,
            timeout=config.TIMEOUT_ANALISE_S,
            rotulo="pergunta contexto",
        ):
            partes.append(pedaco)
            yield pedaco
        if chave and partes:
            _CACHE_RESPOSTAS[chave] = "".join(partes)

    async def perguntar(self, pergunta: str, historico: Optional[list[dict]] = None) -> dict:
        texto = "".join([p async for p in self.perguntar_stream(pergunta, historico)])
        return {"hora": datetime.now().strftime("%H:%M:%S"), "pergunta": pergunta, "resposta": texto.strip()}

    def salvar_texto(self, texto: str) -> None:
        self.arq_contexto.write_text(texto, encoding="utf-8")

    def salvar_glossario(self, termos: list[str]) -> None:
        vistos, limpos = set(), []
        for t in termos:
            t = t.strip()
            if t and _normalizar(t) not in vistos:
                vistos.add(_normalizar(t))
                limpos.append(t)
        _gravar_json(self.arq_glossario, limpos)

    def salvar_checklist(self, itens: list[dict]) -> list[dict]:
        limpos = []
        for i in itens:
            if not (i.get("pergunta") or "").strip():
                continue
            item = novo_item(i["pergunta"], i.get("categoria", ""), i.get("obrigatoria", False),
                             i.get("origem", "manual"), i.get("titulo", ""), i.get("valor_referencia"),
                             i.get("confirmado_no_contexto", False), i.get("resposta_contexto"))
            item["id"] = i.get("id") or item["id"]
            limpos.append(item)
        _gravar_json(self.arq_checklist, numerar(limpos))
        return limpos

    # ----- processamento com o Gemini -----

    async def _extrair(self, arq: Path) -> dict:
        ext = arq.suffix.lower()
        instrucao = prompts.EXTRACAO.format(nome=arq.name)
        if ext in TEXTO or ext == ".docx":
            texto = _ler_docx(arq) if ext == ".docx" else _ler_texto(arq)
            if len(texto) > config.MAX_CHARS_ARQUIVO:
                aviso(f"{arq.name}: texto cortado em {config.MAX_CHARS_ARQUIVO} caracteres")
                texto = texto[: config.MAX_CHARS_ARQUIVO]
            contents = [instrucao, f"CONTEÚDO DO ARQUIVO:\n{texto}"]
        elif ext in MIMES:
            mime = MIMES[ext]
            if arq.stat().st_size > config.TAMANHO_INLINE_BYTES:
                parte = await gemini.enviar_arquivo(arq, mime)
            else:
                parte = types.Part.from_bytes(data=arq.read_bytes(), mime_type=mime)
            contents = [instrucao, parte]
        else:
            raise ValueError(f"tipo de arquivo não suportado: {ext or '(sem extensão)'}")

        texto, modelo = await gemini.gerar(
            config.MODELOS_ANALISE, contents, prompts.CONFIG_EXTRACAO,
            timeout=config.TIMEOUT_CONTEXTO_S, rotulo=f"contexto {arq.name}",
        )
        extracao = prompts.ExtracaoArquivo.model_validate_json(texto)
        info(f"contexto {self.id}: {arq.name} extraído ({modelo}, {len(extracao.conteudo)} caracteres)")
        return {"arquivo": arq.name, **extracao.model_dump()}

    async def processar(self, forcar: bool = False) -> dict:
        """Extrai só os arquivos novos ou alterados e depois reconsolida tudo."""
        self.pasta_extracoes.mkdir(parents=True, exist_ok=True)
        processados = _ler_json(self.arq_processados, {})
        novos, erros = [], {}

        for arq in sorted(self.pasta_arquivos.glob("*")) if self.pasta_arquivos.exists() else []:
            if not arq.is_file():
                continue
            h = _hash(arq)
            anterior = processados.get(arq.name)
            if not forcar and anterior and anterior["hash"] == h and not anterior.get("erro"):
                continue
            try:
                extracao = await self._extrair(arq)
                _gravar_json(self.pasta_extracoes / f"{arq.name}.json", extracao)
                processados[arq.name] = {"hash": h, "processado_em": datetime.now().isoformat(timespec="seconds")}
                novos.append(arq.name)
            except Exception as e:
                erro(f"contexto {self.id}: {arq.name} falhou ({e})")
                processados[arq.name] = {"hash": h, "processado_em": None, "erro": str(e)}
                erros[arq.name] = str(e)
            _gravar_json(self.arq_processados, processados)

        # Extrações de arquivos que foram apagados não entram mais
        existentes = {a.name for a in self.pasta_arquivos.glob("*")} if self.pasta_arquivos.exists() else set()
        for ex in self.pasta_extracoes.glob("*.json"):
            if ex.stem not in existentes:
                ex.unlink()

        consolidado = False
        if novos or forcar or not self.arq_contexto.exists():
            consolidado = await self._consolidar()
        return {"extraidos": novos, "erros": erros, "consolidado": consolidado, **self.resumo()}

    async def _consolidar(self) -> bool:
        extracoes = [_ler_json(ex, None) for ex in sorted(self.pasta_extracoes.glob("*.json"))]
        extracoes = [e for e in extracoes if e]
        if not extracoes:
            return False

        # Arquivos de texto pequenos vão na íntegra: a extração resumida perde nuances
        # como "rascunho", "ainda não confirmado", que decidem o status do checklist
        originais, total = {}, 0
        for e in extracoes:
            arq = self.pasta_arquivos / e["arquivo"]
            if arq.exists() and arq.suffix.lower() in TEXTO | {".docx"}:
                texto = _ler_docx(arq) if arq.suffix.lower() == ".docx" else _ler_texto(arq)
                if total + len(texto) <= config.CONSOLIDACAO_ORIGINAL_CHARS:
                    originais[e["arquivo"]] = texto
                    total += len(texto)

        blocos = "\n\n".join(
            f"### Arquivo: {e['arquivo']}\n"
            + (f"TEXTO ORIGINAL:\n{originais[e['arquivo']]}\n" if e["arquivo"] in originais
               else f"{e['conteudo']}\n")
            + f"Termos: {', '.join(e['termos'])}\nPerguntas em aberto: {'; '.join(e['perguntas'])}"
            for e in extracoes
        )
        checklist = self.checklist
        meta = self.meta
        texto, modelo = await gemini.gerar(
            config.MODELOS_ANALISE,
            [prompts.CONSOLIDACAO.format(
                nome=meta.get("nome", self.id),
                descricao=meta.get("descricao", ""),
                max_chars=config.CONTEXTO_ANALISE_CHARS,
                max_termos=config.GLOSSARIO_MAX_TERMOS,
                checklist_atual="\n".join(f"- {i['pergunta']}" for i in checklist) or "(vazio)",
                extracoes=blocos,
            )],
            prompts.CONFIG_CONSOLIDACAO,
            timeout=config.TIMEOUT_CONTEXTO_S,
            rotulo=f"contexto {self.id} consolidação",
        )
        c = prompts.Consolidacao.model_validate_json(texto)

        self.salvar_texto(c.contexto.strip() + "\n")
        self.salvar_glossario(c.glossario + [t for e in extracoes for t in e["termos"]])

        # Sugestões da IA entram no fim, sem duplicar o que já existe
        existentes = {_normalizar(i["pergunta"]) for i in checklist}
        for s in c.checklist:
            if _normalizar(s.pergunta) not in existentes:
                existentes.add(_normalizar(s.pergunta))
                checklist.append(novo_item(s.pergunta, s.categoria, s.obrigatoria, "ia", s.titulo,
                                           s.valor_referencia, s.confirmado_no_contexto, s.resposta_contexto))
        # Confirmados pelo contexto primeiro, como a tela mostra
        checklist.sort(key=lambda i: not i.get("confirmado_no_contexto"))
        _gravar_json(self.arq_checklist, numerar(checklist))
        _gravar_json(self.arq_rapidas, c.perguntas_rapidas)

        info(f"contexto {self.id} consolidado ({modelo}): {len(c.contexto)} caracteres, "
             f"{len(self.glossario)} termos, {len(checklist)} itens no checklist")
        return True


def id_contexto(texto: str) -> str:
    base = re.sub(r"[^\w\-]+", "-", texto.lower()).strip("-")[:48]
    return base or uuid.uuid4().hex[:8]


def obter_contexto(contexto_id: Optional[str]) -> Optional[Contexto]:
    if not contexto_id:
        return None
    cid = re.sub(r"[^\w\-]", "_", contexto_id)[:64]
    ctx = Contexto(cid)
    return ctx if ctx.pasta.exists() else None


def listar_contextos() -> list[dict]:
    if not PASTA_CONTEXTOS.exists():
        return []
    return [Contexto(p.name).resumo() for p in sorted(PASTA_CONTEXTOS.iterdir()) if p.is_dir()]
