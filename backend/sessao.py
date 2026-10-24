"""Sessão de reunião.

Fonte da verdade: sessoes/<id>/segmentos.jsonl (append-only, um segmento por linha).
A partir dele são gerados transcricao.txt, analise.md/json e ata.md.
Também ficam na pasta: sessao.json (contexto ligado), checklist.json (estado das perguntas),
anotacoes.jsonl (anotações manuais) e chat.jsonl (perguntas feitas ao copiloto).
Se o backend reiniciar no meio da reunião, a sessão é recarregada do disco.
"""
import asyncio
import json
import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from google.genai import types

import config
import gemini
import prompts
from contexto import Contexto, _gravar_json, _ler_json, novo_item, obter_contexto
from log import aviso, erro, info
from prompts import Analise

PASTA_SESSOES = Path(__file__).parent / "sessoes"

STATUS_CHECKLIST = ("pendente", "parcial", "respondida", "ignorada")
# gravacao: transcreve e guarda tudo | sem_guardar: transcreve, nunca grava áudio em disco | notas: sem captura de voz
MODOS = ("gravacao", "sem_guardar", "notas")


class ModoNaoPermite(Exception):
    pass


@dataclass
class Segmento:
    seq: int
    inicio_ms: int          # quando o trecho começou a ser gravado (relógio do navegador)
    duracao_ms: int
    texto: str = ""
    status: str = "ok"      # ok | silencio | falha
    modelo: str = ""

    @property
    def hora(self) -> str:
        return datetime.fromtimestamp(self.inicio_ms / 1000).strftime("%H:%M:%S")


# ---------- utilitários de texto ----------

def _normalizar(palavra: str) -> str:
    return re.sub(r"[^\w]", "", palavra.lower())


def limpar_transcricao(texto: str) -> str:
    t = texto.strip().strip('"').strip()
    if not t or re.fullmatch(r"\[?\s*sil[eê]ncio\s*\]?\.?", t, re.IGNORECASE):
        return ""
    return t


def remover_sobreposicao(anterior: str, novo: str) -> str:
    """Remove do início de `novo` palavras que repetem o fim de `anterior`
    (eco do contexto), e descarta `novo` se ele for só uma repetição."""
    a, n = anterior.split(), novo.split()
    if not a or not n:
        return novo
    na, nn = [_normalizar(w) for w in a], [_normalizar(w) for w in n]

    # trecho inteiro já está no fim do texto anterior => eco
    if len(nn) >= 4 and " ".join(nn) in " ".join(na[-60:]):
        return ""

    for k in range(min(len(na), len(nn), 15), 1, -1):
        if na[-k:] == nn[:k]:
            return " ".join(n[k:])
    return novo


def id_seguro(sessao_id: str) -> str:
    return re.sub(r"[^\w\-]", "_", sessao_id or "")[:64] or "avulsa"


def _agora() -> str:
    return datetime.now().strftime("%H:%M:%S")


# ---------- sessão ----------

class Sessao:
    def __init__(self, sessao_id: str):
        self.id = sessao_id
        self.pasta = PASTA_SESSOES / sessao_id
        self.pasta_falhas = self.pasta / "falhas"
        self.pasta_audio = self.pasta / "audio"
        self.pasta.mkdir(parents=True, exist_ok=True)

        self.arq_meta = self.pasta / "sessao.json"
        self.arq_jsonl = self.pasta / "segmentos.jsonl"
        self.arq_txt = self.pasta / "transcricao.txt"
        self.arq_analise_json = self.pasta / "analise.json"
        self.arq_analise_md = self.pasta / "analise.md"
        self.arq_ata = self.pasta / "ata.md"
        self.arq_checklist = self.pasta / "checklist.json"
        self.arq_anotacoes = self.pasta / "anotacoes.jsonl"
        self.arq_chat = self.pasta / "chat.jsonl"

        self.meta: dict = {}
        self.segmentos: dict[int, Segmento] = {}
        self.analise: Optional[Analise] = None
        self.checklist: list[dict] = []
        self.anotacoes: list[dict] = []
        self.ms_fala_desde_analise = 0
        self._tarefa_analise: Optional[asyncio.Task] = None
        self._reanalisar = False
        self._tarefas: set[asyncio.Task] = set()
        self._ouvintes: set[asyncio.Queue] = set()

        self._carregar()

    # ----- persistência -----

    def _carregar(self) -> None:
        self.meta = _ler_json(self.arq_meta, {})
        self.checklist = _ler_json(self.arq_checklist, [])
        if self.arq_jsonl.exists():
            for linha in self.arq_jsonl.read_text(encoding="utf-8").splitlines():
                if linha.strip():
                    seg = Segmento(**json.loads(linha))
                    self.segmentos[seg.seq] = seg  # última versão vence (reprocessamentos)
            info(f"sessão {self.id} recarregada do disco: {len(self.segmentos)} segmentos")
        if self.arq_anotacoes.exists():
            self.anotacoes = [json.loads(l) for l in self.arq_anotacoes.read_text(encoding="utf-8").splitlines()
                              if l.strip()]
        if self.arq_analise_json.exists():
            try:
                self.analise = Analise.model_validate_json(self.arq_analise_json.read_text(encoding="utf-8"))
            except Exception:
                pass  # formato antigo: a próxima análise regera

    def configurar(self, contexto_id: Optional[str], titulo: str = "", modo: str = "gravacao",
                   horario: str = "") -> None:
        """Liga a sessão a um contexto e copia o checklist dele (só na primeira vez)."""
        if modo not in MODOS:
            raise ValueError(f"modo deve ser um de {MODOS}")
        self.meta = {
            **self.meta,
            "contexto_id": contexto_id or self.meta.get("contexto_id"),
            "titulo": titulo or self.meta.get("titulo", ""),
            "horario": horario or self.meta.get("horario") or datetime.now().strftime("%H:%M"),
            "modo": modo,
            "estado": self.meta.get("estado", "preparando"),
            "aviso_confirmado": self.meta.get("aviso_confirmado", False),
            "criado_em": self.meta.get("criado_em") or datetime.now().isoformat(timespec="seconds"),
        }
        _gravar_json(self.arq_meta, self.meta)
        ctx = self.contexto
        if ctx and not self.checklist:
            self.checklist = [self._item_da_sessao(item) for item in ctx.checklist]
            self._salvar_checklist()

    @staticmethod
    def _item_da_sessao(item: dict) -> dict:
        confirmado = item.get("confirmado_no_contexto")
        return {
            **item,
            "status": "respondida" if confirmado else "pendente",
            "resposta": (item.get("resposta_contexto") or "") if confirmado else "",
            "fonte": "contexto" if confirmado else None,   # contexto | conversa | manual
            "diverge": False,
            "trecho": "",
            "hora": None,
            "manual": False,
        }

    @property
    def modo(self) -> str:
        return self.meta.get("modo", "gravacao")

    def mudar_meta(self, **campos) -> dict:
        if "modo" in campos and campos["modo"] not in MODOS:
            raise ValueError(f"modo deve ser um de {MODOS}")
        self.meta.update({k: v for k, v in campos.items() if v is not None})
        _gravar_json(self.arq_meta, self.meta)
        self._publicar("copiloto", self.copiloto())
        return self.meta

    def iniciar(self, aviso_confirmado: bool) -> dict:
        if self.modo != "notas" and not aviso_confirmado:
            raise ModoNaoPermite("confirme que os participantes foram informados antes de iniciar a escuta")
        return self.mudar_meta(estado="ouvindo", aviso_confirmado=aviso_confirmado,
                               iniciado_em=datetime.now().isoformat(timespec="seconds"))

    def preparacao(self) -> dict:
        """Card 'Preparação da sessão' + mensagem de abertura do Prumo."""
        ctx = self.contexto
        p = self.progresso()
        confirmados = p["confirmados_contexto"]
        faltam = p["total"] - p["respondida"] - p["ignorada"]
        titulo = self.meta.get("titulo") or (ctx.meta.get("nome") if ctx else "Reunião")
        return {
            "titulo": titulo,
            "horario": self.meta.get("horario"),
            "contexto": {"id": ctx.id, "nome": ctx.meta.get("nome", ctx.id)} if ctx else None,
            "total": p["total"],
            "confirmados_contexto": confirmados,
            "a_perguntar": faltam,
            "modo": self.modo,
            "modos": list(MODOS),
            "aviso_confirmado": self.meta.get("aviso_confirmado", False),
            "estado": self.meta.get("estado", "preparando"),
            "mensagem": (f"Reunião de hoje, {self.meta.get('horario')}: {titulo}. "
                         f"O checklist tem {p['total']} itens: {confirmados} já estão confirmados pelo "
                         f"contexto do cliente e {faltam} faltam perguntar."),
        }

    @property
    def contexto(self) -> Optional[Contexto]:
        return obter_contexto(self.meta.get("contexto_id"))

    def _salvar_checklist(self) -> None:
        _gravar_json(self.arq_checklist, self.checklist)

    def _gravar(self, seg: Segmento) -> None:
        self.segmentos[seg.seq] = seg
        with self.arq_jsonl.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(seg), ensure_ascii=False) + "\n")
        self._renderizar_txt()
        self._publicar("transcricao", {"seq": seg.seq, "hora": seg.hora, "status": seg.status, "texto": seg.texto})

        if seg.status == "ok":
            self.ms_fala_desde_analise += seg.duracao_ms
            if self.ms_fala_desde_analise >= config.ANALISAR_A_CADA_S * 1000:
                self.disparar_analise()

    def _ordenados(self) -> list[Segmento]:
        return [self.segmentos[k] for k in sorted(self.segmentos)]

    def _renderizar_txt(self) -> None:
        """Regera o .txt inteiro em ordem de seq. Chunks atrasados entram no lugar certo."""
        segs = self._ordenados()
        inicio = datetime.fromtimestamp(segs[0].inicio_ms / 1000) if segs else datetime.now()
        linhas = [f"Transcrição da reunião - sessão {self.id}", f"Início: {inicio:%d/%m/%Y %H:%M:%S}", ""]
        for s in segs:
            if s.status == "ok":
                linhas.append(f"[{s.hora}] {s.texto}")
            elif s.status == "falha":
                linhas.append(f"[{s.hora}] (trecho #{s.seq} não transcrito - tentando novamente)")
        tmp = self.arq_txt.with_suffix(".tmp")
        tmp.write_text("\n".join(linhas) + "\n", encoding="utf-8")
        tmp.replace(self.arq_txt)  # escrita atômica: nunca fica um txt pela metade

    def texto_corrido(self, ate_seq: Optional[int] = None) -> str:
        return " ".join(
            s.texto for s in self._ordenados()
            if s.status == "ok" and (ate_seq is None or s.seq < ate_seq)
        )

    def transcricao_com_horario(self) -> str:
        return "\n".join(f"[{s.hora}] {s.texto}" for s in self._ordenados() if s.status == "ok")

    # ----- textos que vão para os prompts -----

    def _texto_contexto(self) -> str:
        ctx = self.contexto
        if not ctx or not ctx.texto:
            return "(nenhum contexto carregado)"
        # O consolidado resume; as extrações trazem o detalhe de cada documento
        extracoes = ctx.texto_extracoes()
        texto = ctx.texto + (f"\n\n# Documentos (extração de cada arquivo)\n{extracoes}" if extracoes else "")
        return texto[: config.CONTEXTO_ANALISE_CHARS]

    def _texto_checklist(self) -> str:
        if not self.checklist:
            return "(sem checklist)"
        return "\n".join(
            f"{i['id']} | {i['status']}{' (obrigatória)' if i.get('obrigatoria') else ''} | {i['pergunta']}"
            f" | {i.get('valor_referencia') or '-'} | {i.get('resposta') or '-'}"
            for i in self.checklist
        )

    def _texto_anotacoes(self) -> str:
        return "\n".join(f"[{a['hora']}] {a['texto']}" for a in self.anotacoes) or "(nenhuma)"

    def _glossario(self) -> str:
        ctx = self.contexto
        termos = ctx.glossario[: config.GLOSSARIO_MAX_TERMOS] if ctx else []
        return prompts.GLOSSARIO_TRANSCRICAO.format(termos=", ".join(termos)) if termos else ""

    # ----- transcrição -----

    async def _transcrever(self, seq: int, audio: bytes, mime: str) -> tuple[str, str]:
        anterior = self.texto_corrido(ate_seq=seq)
        ctx = anterior[-config.CONTEXTO_CHARS:]
        contexto = f'\nContexto (fim do trecho anterior, NÃO repita): "...{ctx}"' if ctx else ""
        texto, modelo = await gemini.gerar(
            config.MODELOS_TRANSCRICAO,
            [prompts.TRANSCRICAO.format(glossario=self._glossario(), contexto=contexto),
             types.Part.from_bytes(data=audio, mime_type=mime)],
            prompts.CONFIG_TRANSCRICAO,
            timeout=config.TIMEOUT_TRANSCRICAO_S,
            rotulo=f"#{seq}",
        )
        texto = limpar_transcricao(texto)
        # Recalcula o anterior: outros chunks podem ter chegado enquanto esperávamos
        texto = remover_sobreposicao(self.texto_corrido(ate_seq=seq), texto)
        return texto, modelo

    async def processar(self, seq: int, audio: bytes, mime: str, inicio_ms: int, duracao_ms: int) -> Segmento:
        if self.modo == "notas":
            raise ModoNaoPermite("sessão em modo notas não recebe áudio")
        if self.meta.get("estado", "preparando") == "preparando":
            # cliente que não chama /iniciar (ex.: extensão do Chrome): começa no primeiro áudio
            self.mudar_meta(estado="ouvindo")
        guardar_audio = self.modo == "gravacao"
        seg = Segmento(seq=seq, inicio_ms=inicio_ms, duracao_ms=duracao_ms)

        if len(audio) < config.TAMANHO_MINIMO_BYTES:
            seg.status = "silencio"
            self._gravar(seg)
            return seg

        if config.SALVAR_AUDIO and guardar_audio:
            self.pasta_audio.mkdir(exist_ok=True)
            (self.pasta_audio / f"{seq:05d}.{_extensao(mime)}").write_bytes(audio)

        t0 = time.time()
        try:
            seg.texto, seg.modelo = await self._transcrever(seq, audio, mime)
            seg.status = "ok" if seg.texto else "silencio"
            info(f"#{seq:<4} {time.time() - t0:4.1f}s {seg.modelo:<24} | {seg.texto or '(sem fala)'}")
        except Exception as e:
            seg.status = "falha"
            erro(f"#{seq} falhou em todos os modelos ({e}); vai ser reprocessado")
            if guardar_audio:  # em "sem_guardar" o retry usa só a cópia em memória
                self._guardar_falha(seq, audio, mime)
            self._em_segundo_plano(self._reprocessar(seq, audio, mime))

        self._gravar(seg)
        return seg

    # ----- falhas e reprocessamento -----

    def _guardar_falha(self, seq: int, audio: bytes, mime: str) -> None:
        self.pasta_falhas.mkdir(exist_ok=True)
        (self.pasta_falhas / f"{seq:05d}.{_extensao(mime)}").write_bytes(audio)

    async def _reprocessar(self, seq: int, audio: bytes, mime: str) -> bool:
        for espera in config.ESPERAS_REPROCESSAR_S:
            await asyncio.sleep(espera)
            if self.segmentos.get(seq) and self.segmentos[seq].status != "falha":
                return True  # já resolvido por outra via
            try:
                texto, modelo = await self._transcrever(seq, audio, mime)
            except Exception:
                aviso(f"#{seq} reprocessamento falhou, nova tentativa em breve")
                continue
            antigo = self.segmentos[seq]
            novo = Segmento(seq, antigo.inicio_ms, antigo.duracao_ms, texto, "ok" if texto else "silencio", modelo)
            self._gravar(novo)
            for arq in self.pasta_falhas.glob(f"{seq:05d}.*"):
                arq.unlink(missing_ok=True)
            info(f"#{seq:<4} reprocessado com sucesso | {texto or '(sem fala)'}")
            return True
        erro(f"#{seq} desistindo após {len(config.ESPERAS_REPROCESSAR_S)} tentativas; áudio em {self.pasta_falhas}")
        return False

    async def reprocessar_falhas(self) -> dict:
        """Reprocessa manualmente tudo que está em falhas/ (ex.: depois de reiniciar o backend)."""
        if not self.pasta_falhas.exists():
            return {"reprocessados": 0, "restantes": 0}
        ok = 0
        for arq in sorted(self.pasta_falhas.iterdir()):
            seq = int(arq.stem)
            mime = "audio/wav" if arq.suffix == ".wav" else "audio/webm"
            try:
                texto, modelo = await self._transcrever(seq, arq.read_bytes(), mime)
            except Exception as e:
                aviso(f"#{seq} ainda falhando: {e}")
                continue
            antigo = self.segmentos.get(seq) or Segmento(seq, int(arq.stat().st_mtime * 1000), 0)
            self._gravar(Segmento(seq, antigo.inicio_ms, antigo.duracao_ms, texto,
                                  "ok" if texto else "silencio", modelo))
            arq.unlink()
            ok += 1
        restantes = len(list(self.pasta_falhas.iterdir()))
        return {"reprocessados": ok, "restantes": restantes}

    # ----- análise acumulada -----

    def disparar_analise(self) -> None:
        self.ms_fala_desde_analise = 0
        if self._tarefa_analise and not self._tarefa_analise.done():
            self._reanalisar = True  # roda de novo quando a atual terminar
            return
        self._tarefa_analise = self._em_segundo_plano(self._loop_analise())

    async def _loop_analise(self) -> None:
        while True:
            self._reanalisar = False
            await self.analisar()
            if not self._reanalisar:
                break

    async def analisar(self) -> Optional[Analise]:
        transcricao = self.transcricao_com_horario()[-config.JANELA_ANALISE_CHARS:]
        if not transcricao:
            return self.analise
        anterior = self.analise.model_dump_json(indent=2, exclude={"checklist"}) if self.analise else "(nenhuma)"
        try:
            texto, modelo = await gemini.gerar(
                config.MODELOS_ANALISE,
                [prompts.ANALISE.format(
                    contexto=self._texto_contexto(),
                    checklist=self._texto_checklist(),
                    anotacoes=self._texto_anotacoes(),
                    anterior=anterior,
                    transcricao=transcricao,
                )],
                prompts.CONFIG_ANALISE,
                timeout=config.TIMEOUT_ANALISE_S,
                rotulo="analise",
            )
            self.analise = Analise.model_validate_json(texto)
        except Exception as e:
            erro(f"análise falhou: {e}")
            return self.analise

        mudancas = self._aplicar_checklist(self.analise)
        self._salvar_analise()
        info(f"analise ({modelo}): {len(self.analise.regras_negocio)} regras, "
             f"{len(self.analise.pendencias)} pendências, {mudancas} itens do checklist atualizados")
        if self.analise.sugestao_pergunta_imediata:
            info(f"  pergunta sugerida: {self.analise.sugestao_pergunta_imediata}")
        self._publicar("copiloto", self.copiloto())
        return self.analise

    def _aplicar_checklist(self, analise: Analise) -> int:
        """Aplica as mudanças sugeridas pela IA. Itens marcados à mão não são tocados."""
        por_id = {i["id"]: i for i in self.checklist}
        mudancas = 0
        for m in analise.checklist:
            item = por_id.get(m.id.strip())
            status = m.status.strip().lower()
            if not item or item.get("manual") or status not in ("parcial", "respondida"):
                continue
            # não rebaixa respondida -> parcial
            if item["status"] == "respondida" and status == "parcial":
                continue
            item.update(status=status, resposta=m.resposta, trecho=m.trecho, hora=m.hora,
                        fonte="conversa", diverge=m.diverge)
            mudancas += 1
        if mudancas:
            self._salvar_checklist()
        return mudancas

    def _salvar_analise(self) -> None:
        a = self.analise
        self.arq_analise_json.write_text(a.model_dump_json(indent=2), encoding="utf-8")

        def lista(itens):
            return "\n".join(f"- {i}" for i in itens) if itens else "_(nenhum)_"

        marca = {"pendente": "[ ]", "parcial": "[~]", "respondida": "[x]", "ignorada": "[-]"}
        checklist = "\n".join(
            f"- {marca.get(i['status'], '[ ]')} {i['pergunta']}" + (f" — {i['resposta']}" if i.get("resposta") else "")
            for i in self.checklist
        ) or "_(sem checklist)_"

        self.arq_analise_md.write_text(
            f"# Análise da reunião - {self.id}\n\n"
            f"_Atualizado em {datetime.now():%d/%m/%Y %H:%M:%S}_\n\n"
            f"## Resumo\n{a.resumo}\n\n"
            f"## Checklist\n{checklist}\n\n"
            f"## Regras de negócio\n{lista(a.regras_negocio)}\n\n"
            f"## Pendências\n{lista(a.pendencias)}\n\n"
            f"## Resolvidos\n{lista(a.resolvidos)}\n\n"
            f"## Anotações\n{lista(a.anotacoes + [n['texto'] for n in self.anotacoes])}\n\n"
            f"## Perguntas sugeridas\n{lista(a.perguntas_sugeridas)}\n\n"
            f"## Próxima pergunta\n{a.sugestao_pergunta_imediata or '_(nenhuma)_'}\n",
            encoding="utf-8",
        )

    # ----- checklist, anotações e chat (ações do implantador) -----

    def atualizar_item(self, item_id: str, status: Optional[str] = None, resposta: Optional[str] = None) -> dict:
        item = next((i for i in self.checklist if i["id"] == item_id), None)
        if not item:
            raise KeyError(item_id)
        if status is not None:
            if status not in STATUS_CHECKLIST:
                raise ValueError(f"status deve ser um de {STATUS_CHECKLIST}")
            item["status"] = status
            item["hora"] = item.get("hora") or _agora()
        if resposta is not None:
            item["resposta"] = resposta
        item["fonte"] = "manual" if item["status"] != "pendente" else None
        # "pendente" devolve o item para a IA; qualquer outra marcação manual tem prioridade
        item["manual"] = item["status"] != "pendente"
        self._salvar_checklist()
        self._publicar("copiloto", self.copiloto())
        return item

    def adicionar_item(self, pergunta: str, categoria: str = "", obrigatoria: bool = False) -> dict:
        item = self._item_da_sessao(novo_item(pergunta, categoria, obrigatoria))
        item["codigo"] = f"CHK-{len(self.checklist) + 1:02d}"
        self.checklist.append(item)
        self._salvar_checklist()
        self._publicar("copiloto", self.copiloto())
        return item

    def adicionar_anotacao(self, texto: str) -> dict:
        nota = {"hora": _agora(), "texto": texto.strip()}
        self.anotacoes.append(nota)
        with self.arq_anotacoes.open("a", encoding="utf-8") as f:
            f.write(json.dumps(nota, ensure_ascii=False) + "\n")
        self._publicar("copiloto", self.copiloto())
        return nota

    async def perguntar(self, pergunta: str) -> dict:
        texto, modelo = await gemini.gerar(
            config.MODELOS_ANALISE,
            [prompts.PERGUNTA.format(
                contexto=self._texto_contexto(),
                checklist=self._texto_checklist(),
                anotacoes=self._texto_anotacoes(),
                transcricao=self.transcricao_com_horario()[-40000:] or "(ainda sem transcrição)",
                pergunta=pergunta,
            )],
            prompts.CONFIG_PERGUNTA,
            timeout=config.TIMEOUT_ANALISE_S,
            rotulo="pergunta",
        )
        registro = {"hora": _agora(), "pergunta": pergunta, "resposta": texto.strip(), "modelo": modelo}
        with self.arq_chat.open("a", encoding="utf-8") as f:
            f.write(json.dumps(registro, ensure_ascii=False) + "\n")
        return registro

    # ----- finalização -----

    async def finalizar(self) -> dict:
        if self._tarefa_analise and not self._tarefa_analise.done():
            await self._tarefa_analise
        analise = await self.analisar()

        ata_ok = False
        transcricao = self.transcricao_com_horario()
        if transcricao:
            segs = self._ordenados()
            data = datetime.fromtimestamp(segs[0].inicio_ms / 1000).strftime("%d/%m/%Y %H:%M")
            anotacoes = "\n".join(
                [f"- {n}" for n in (analise.anotacoes if analise else [])]
                + [f"- [{n['hora']}] {n['texto']}" for n in self.anotacoes]
            ) or "(nenhuma)"
            try:
                texto, _ = await gemini.gerar(
                    config.MODELOS_ANALISE,
                    [prompts.ATA.format(data=data, checklist=self._texto_checklist(), anotacoes=anotacoes,
                                        transcricao=transcricao[-60000:])],
                    prompts.CONFIG_ATA,
                    timeout=90,
                    rotulo="ata",
                )
                self.arq_ata.write_text(texto.strip() + "\n", encoding="utf-8")
                ata_ok = True
            except Exception as e:
                erro(f"ata falhou: {e}")

        falhas = sum(1 for s in self.segmentos.values() if s.status == "falha")
        self.mudar_meta(estado="finalizada")
        info(f"sessão {self.id} finalizada: {self.resumo_status()}" + (f", {falhas} falhas pendentes" if falhas else ""))
        self._publicar("finalizado", {"ata": ata_ok})
        return {
            "pasta": str(self.pasta),
            "ata": ata_ok,
            "falhas_pendentes": falhas,
            "analise": analise.model_dump() if analise else None,
            "copiloto": self.copiloto(),
        }

    # ----- eventos (SSE) -----

    def assinar(self) -> asyncio.Queue:
        fila: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._ouvintes.add(fila)
        return fila

    def cancelar(self, fila: asyncio.Queue) -> None:
        self._ouvintes.discard(fila)

    def _publicar(self, tipo: str, dados: dict) -> None:
        for fila in list(self._ouvintes):
            try:
                fila.put_nowait((tipo, dados))
            except asyncio.QueueFull:
                pass  # ouvinte travado: perde o evento, mas o próximo /copiloto traz tudo

    # ----- estado / resposta -----

    def resumo_status(self) -> str:
        c = {"ok": 0, "silencio": 0, "falha": 0}
        for s in self.segmentos.values():
            c[s.status] = c.get(s.status, 0) + 1
        return f"{c['ok']} com fala, {c['silencio']} silêncio, {c['falha']} falhas"

    def progresso(self) -> dict:
        c = {s: 0 for s in STATUS_CHECKLIST}
        for i in self.checklist:
            c[i["status"]] = c.get(i["status"], 0) + 1
        obrig = [i for i in self.checklist if i.get("obrigatoria")]
        total = len(self.checklist)
        return {**c, "total": total,
                "percentual": round(100 * c["respondida"] / total) if total else 0,
                "confirmados_contexto": sum(1 for i in self.checklist if i.get("fonte") == "contexto"),
                "obrigatorias_pendentes": sum(1 for i in obrig if i["status"] in ("pendente", "parcial"))}

    def ultima_fala(self) -> Optional[dict]:
        for s in reversed(self._ordenados()):
            if s.status == "ok":
                return {"seq": s.seq, "hora": s.hora, "texto": s.texto}
        return None

    def copiloto(self) -> dict:
        """Tudo que a tela do copiloto precisa mostrar agora."""
        a = self.analise
        ctx = self.contexto
        return {
            "sessao": self.id,
            "estado": self.meta.get("estado", "preparando"),
            "modo": self.modo,
            "contexto": {"id": ctx.id, "nome": ctx.meta.get("nome", ctx.id)} if ctx else None,
            "atualizado_em": _agora(),
            "ultima_fala": self.ultima_fala(),
            "perguntas_rapidas": ctx.perguntas_rapidas if ctx else [],
            "resumo": a.resumo if a else "",
            "sugestao_pergunta_imediata": a.sugestao_pergunta_imediata if a else None,
            "perguntas_sugeridas": a.perguntas_sugeridas if a else [],
            "checklist": self.checklist,
            "progresso": self.progresso(),
            "anotacoes": {"ia": a.anotacoes if a else [], "manuais": self.anotacoes},
            "regras_negocio": a.regras_negocio if a else [],
            "pendencias": a.pendencias if a else [],
            "resolvidos": a.resolvidos if a else [],
        }

    def estado(self) -> dict:
        return {
            "id": self.id,
            "pasta": str(self.pasta),
            **self.meta,
            "segmentos": len(self.segmentos),
            "status": self.resumo_status(),
            "progresso": self.progresso(),
            "analise": self.analise.model_dump() if self.analise else None,
        }

    def resposta(self, seg: Segmento) -> dict:
        """Formato antigo do /processar-audio (transcrição + análise na mesma resposta)."""
        a = self.analise
        return {
            "seq": seg.seq,
            "status": seg.status,
            "transcricao": seg.texto,
            "regras_identificadas": a.regras_negocio if a else [],
            "sugestao_pergunta_imediata": a.sugestao_pergunta_imediata if a else None,
            "duvidas_resolvidas": a.resolvidos if a else [],
            "pendencias": a.pendencias if a else [],
            "resumo": a.resumo if a else "",
        }

    def _em_segundo_plano(self, coro) -> asyncio.Task:
        t = asyncio.create_task(coro)
        self._tarefas.add(t)  # mantém referência (senão o GC pode cancelar a task)
        t.add_done_callback(self._tarefas.discard)
        return t


def _extensao(mime: str) -> str:
    return {"audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "audio/mpeg": "mp3"}.get(mime, "webm")


_sessoes: dict[str, Sessao] = {}


def obter_sessao(sessao_id: str, criar: bool = True) -> Optional[Sessao]:
    sid = id_seguro(sessao_id)
    if sid not in _sessoes:
        if not criar and not (PASTA_SESSOES / sid).exists():
            return None
        _sessoes[sid] = Sessao(sid)
        info(f"sessão {sid} -> {_sessoes[sid].pasta}")
    return _sessoes[sid]
