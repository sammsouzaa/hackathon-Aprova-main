import asyncio
import json
import os
import time
from typing import List, Optional

from dotenv import load_dotenv

# Precisa vir antes de importar config/gemini/sessao (lêem o .env na importação)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel

import config
from contexto import PASTA_CONTEXTOS, Contexto, id_contexto, listar_contextos, obter_contexto
from log import info
from sessao import PASTA_SESSOES, ModoNaoPermite, id_seguro, obter_sessao

app = FastAPI(title="GovTech Audio Copilot")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- corpos das requisições ----------

class NovoContexto(BaseModel):
    nome: str
    descricao: str = ""
    id: Optional[str] = None


class TextoContexto(BaseModel):
    texto: str


class ItemChecklist(BaseModel):
    pergunta: str
    titulo: str = ""
    categoria: str = ""
    obrigatoria: bool = False
    valor_referencia: Optional[str] = None
    confirmado_no_contexto: bool = False
    resposta_contexto: Optional[str] = None
    id: Optional[str] = None
    origem: str = "manual"


class PerguntasRapidas(BaseModel):
    perguntas: List[str]


class Glossario(BaseModel):
    termos: List[str]


class NovaSessao(BaseModel):
    contexto_id: Optional[str] = None
    titulo: str = ""
    horario: str = ""                 # "14:00"; padrão = agora
    modo: str = "gravacao"            # gravacao | sem_guardar | notas
    id: Optional[str] = None


class MudancaSessao(BaseModel):
    modo: Optional[str] = None
    titulo: Optional[str] = None
    horario: Optional[str] = None
    aviso_confirmado: Optional[bool] = None


class Inicio(BaseModel):
    aviso_confirmado: bool = False


class MudancaItem(BaseModel):
    status: Optional[str] = None
    resposta: Optional[str] = None


class Texto(BaseModel):
    texto: str


class PerguntaContexto(BaseModel):
    texto: str
    historico: List[dict] = []  # [{pergunta, resposta}] das últimas trocas


def _sessao_existente(sessao_id: str):
    s = obter_sessao(sessao_id, criar=False)
    if not s:
        raise HTTPException(404, "sessão não encontrada")
    return s


def _contexto_existente(contexto_id: str) -> Contexto:
    ctx = obter_contexto(contexto_id)
    if not ctx:
        raise HTTPException(404, "contexto não encontrado")
    return ctx


@app.get("/")
def health():
    return {
        "status": "online",
        "modelos_transcricao": config.MODELOS_TRANSCRICAO,
        "modelos_analise": config.MODELOS_ANALISE,
        "analisar_a_cada_s": config.ANALISAR_A_CADA_S,
    }


# ---------- contextos (antes da reunião) ----------

@app.get("/contextos")
def contextos():
    return listar_contextos()


@app.post("/contextos")
def criar_contexto(corpo: NovoContexto):
    cid = id_contexto(corpo.id or corpo.nome)
    ctx = Contexto(cid)
    if ctx.pasta.exists():
        raise HTTPException(409, f"já existe um contexto com id '{cid}'")
    ctx.criar(corpo.nome, corpo.descricao)
    info(f"contexto {cid} criado -> {ctx.pasta}")
    return ctx.completo()


@app.get("/contextos/{contexto_id}")
def ler_contexto(contexto_id: str):
    return _contexto_existente(contexto_id).completo()


@app.post("/contextos/{contexto_id}/arquivos")
async def enviar_arquivos(contexto_id: str, arquivos: List[UploadFile] = File(...)):
    ctx = _contexto_existente(contexto_id)
    salvos = [ctx.salvar_arquivo(a.filename, await a.read()) for a in arquivos]
    return {"salvos": salvos, "arquivos": ctx.arquivos(),
            "aviso": "chame POST /contextos/{id}/processar para analisar os arquivos novos"}


@app.get("/contextos/{contexto_id}/arquivos/{nome}")
def ler_arquivo(contexto_id: str, nome: str):
    arq = _contexto_existente(contexto_id).ler_arquivo(nome)
    if not arq:
        raise HTTPException(404, "arquivo não encontrado")
    return arq


@app.delete("/contextos/{contexto_id}/arquivos/{nome}")
def remover_arquivo(contexto_id: str, nome: str):
    if not _contexto_existente(contexto_id).remover_arquivo(nome):
        raise HTTPException(404, "arquivo não encontrado")
    return {"removido": nome}


@app.post("/contextos/{contexto_id}/processar")
async def processar_contexto(contexto_id: str, forcar: bool = False):
    """Extrai só os arquivos novos/alterados (forcar=true refaz todos) e reconsolida."""
    return await _contexto_existente(contexto_id).processar(forcar=forcar)


@app.get("/contextos/{contexto_id}/contexto", response_class=PlainTextResponse)
def ler_texto_contexto(contexto_id: str):
    return _contexto_existente(contexto_id).texto


@app.put("/contextos/{contexto_id}/contexto")
def editar_texto_contexto(contexto_id: str, corpo: TextoContexto):
    _contexto_existente(contexto_id).salvar_texto(corpo.texto)
    return {"ok": True}


@app.put("/contextos/{contexto_id}/glossario")
def editar_glossario(contexto_id: str, corpo: Glossario):
    ctx = _contexto_existente(contexto_id)
    ctx.salvar_glossario(corpo.termos)
    return ctx.glossario


@app.get("/contextos/{contexto_id}/checklist")
def ler_checklist(contexto_id: str):
    return _contexto_existente(contexto_id).checklist


@app.put("/contextos/{contexto_id}/checklist")
def substituir_checklist(contexto_id: str, itens: List[ItemChecklist]):
    return _contexto_existente(contexto_id).salvar_checklist([i.model_dump() for i in itens])


@app.post("/contextos/{contexto_id}/checklist")
def adicionar_ao_checklist(contexto_id: str, item: ItemChecklist):
    ctx = _contexto_existente(contexto_id)
    return ctx.salvar_checklist(ctx.checklist + [item.model_dump()])


@app.put("/contextos/{contexto_id}/perguntas-rapidas")
def editar_perguntas_rapidas(contexto_id: str, corpo: PerguntasRapidas):
    ctx = _contexto_existente(contexto_id)
    ctx.salvar_perguntas_rapidas(corpo.perguntas)
    return ctx.perguntas_rapidas


@app.post("/contextos/{contexto_id}/perguntar")
async def perguntar_contexto(contexto_id: str, corpo: PerguntaContexto):
    if not corpo.texto.strip():
        raise HTTPException(422, "pergunta vazia")
    try:
        return await _contexto_existente(contexto_id).perguntar(corpo.texto.strip(), corpo.historico)
    except RuntimeError as e:
        raise HTTPException(503, f"Gemini indisponível: {e}")


@app.post("/contextos/{contexto_id}/perguntar/stream")
async def perguntar_contexto_stream(contexto_id: str, corpo: PerguntaContexto):
    """Mesma resposta de /perguntar, em texto puro chegando aos pedaços.
    Começa com a etiqueta [confirmado|pendente|nao_consta] e cita arquivos como [[nome]]."""
    if not corpo.texto.strip():
        raise HTTPException(422, "pergunta vazia")
    pedacos = _contexto_existente(contexto_id).perguntar_stream(corpo.texto.strip(), corpo.historico)
    try:
        primeiro = await pedacos.__anext__()  # erro do Gemini ainda vira 503 aqui
    except StopAsyncIteration:
        primeiro = ""
    except RuntimeError as e:
        raise HTTPException(503, f"Gemini indisponível: {e}")

    async def corpo_stream():
        yield primeiro
        async for pedaco in pedacos:
            yield pedaco

    return StreamingResponse(corpo_stream(), media_type="text/plain; charset=utf-8",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ---------- sessões (durante a reunião) ----------

@app.get("/sessoes")
def listar_sessoes():
    if not PASTA_SESSOES.exists():
        return []
    return sorted((p.name for p in PASTA_SESSOES.iterdir() if p.is_dir()), reverse=True)


@app.post("/sessoes")
def criar_sessao(corpo: NovaSessao):
    if corpo.contexto_id:
        _contexto_existente(corpo.contexto_id)
    sid = id_seguro(corpo.id or time.strftime("%Y-%m-%d_%H-%M-%S"))
    s = obter_sessao(sid)
    try:
        s.configurar(corpo.contexto_id, corpo.titulo, corpo.modo, corpo.horario)
    except ValueError as e:
        raise HTTPException(422, str(e))
    return {**s.estado(), "preparacao": s.preparacao()}


@app.get("/sessoes/{sessao_id}")
def estado_sessao(sessao_id: str):
    return _sessao_existente(sessao_id).estado()


@app.patch("/sessoes/{sessao_id}")
def mudar_sessao(sessao_id: str, corpo: MudancaSessao):
    s = _sessao_existente(sessao_id)
    if s.meta.get("estado") != "preparando" and corpo.modo:
        raise HTTPException(409, "o modo só pode mudar antes de iniciar a reunião")
    try:
        s.mudar_meta(**corpo.model_dump())
    except ValueError as e:
        raise HTTPException(422, str(e))
    return s.preparacao()


@app.get("/sessoes/{sessao_id}/preparacao")
def preparacao(sessao_id: str):
    return _sessao_existente(sessao_id).preparacao()


@app.post("/sessoes/{sessao_id}/iniciar")
def iniciar(sessao_id: str, corpo: Inicio):
    s = _sessao_existente(sessao_id)
    try:
        s.iniciar(corpo.aviso_confirmado)
    except ModoNaoPermite as e:
        raise HTTPException(409, str(e))
    return s.preparacao()


async def _receber_audio(sessao_id: str, audio_chunk: UploadFile, seq, inicio_ms, duracao_ms):
    audio = await audio_chunk.read()
    if len(audio) > config.TAMANHO_MAXIMO_BYTES:
        raise HTTPException(413, "chunk de áudio grande demais")

    # Gemini não aceita parâmetros de codec ("audio/webm;codecs=opus")
    mime = (audio_chunk.content_type or "audio/webm").split(";")[0]
    agora_ms = int(time.time() * 1000)

    s = obter_sessao(sessao_id)
    seq = seq if seq is not None else (max(s.segmentos, default=0) + 1)
    try:
        seg = await s.processar(
            seq=seq,
            audio=audio,
            mime=mime,
            inicio_ms=inicio_ms or agora_ms,
            duracao_ms=duracao_ms or 0,
        )
    except ModoNaoPermite as e:
        raise HTTPException(409, str(e))
    return s, seg


@app.post("/sessoes/{sessao_id}/audio")
async def transcrever_audio(
    sessao_id: str,
    audio_chunk: UploadFile = File(...),
    seq: int = Form(None),
    inicio_ms: int = Form(None),
    duracao_ms: int = Form(None),
):
    """Só transcreve. A análise roda em segundo plano e chega por /copiloto ou /eventos."""
    _, seg = await _receber_audio(sessao_id, audio_chunk, seq, inicio_ms, duracao_ms)
    resp = {"seq": seg.seq, "hora": seg.hora, "status": seg.status, "texto": seg.texto}
    if seg.status == "falha":
        resp["aviso"] = "transcrição falhou, reprocessando em segundo plano"
    return resp


@app.post("/processar-audio")
async def processar_audio(
    audio_chunk: UploadFile = File(...),
    sessao: str = Form(None),
    seq: int = Form(None),
    inicio_ms: int = Form(None),
    duracao_ms: int = Form(None),
):
    """Rota antiga (transcrição + última análise na mesma resposta)."""
    s, seg = await _receber_audio(sessao or time.strftime("avulsa_%Y-%m-%d"), audio_chunk, seq, inicio_ms, duracao_ms)
    if seg.status == "falha":
        return {**s.resposta(seg), "aviso": "transcrição falhou, reprocessando em segundo plano"}
    return s.resposta(seg)


@app.get("/sessoes/{sessao_id}/copiloto")
def copiloto(sessao_id: str):
    return _sessao_existente(sessao_id).copiloto()


@app.get("/sessoes/{sessao_id}/eventos")
async def eventos(sessao_id: str, request: Request):
    """Server-Sent Events: 'transcricao' a cada trecho, 'copiloto' a cada análise/mudança, 'finalizado'."""
    s = _sessao_existente(sessao_id)
    fila = s.assinar()

    def sse(tipo: str, dados) -> str:
        return f"event: {tipo}\ndata: {json.dumps(dados, ensure_ascii=False)}\n\n"

    async def gerar():
        try:
            yield sse("copiloto", s.copiloto())
            while not await request.is_disconnected():
                try:
                    tipo, dados = await asyncio.wait_for(fila.get(), timeout=15)
                    yield sse(tipo, dados)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"  # mantém a conexão viva
        finally:
            s.cancelar(fila)

    return StreamingResponse(gerar(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.patch("/sessoes/{sessao_id}/checklist/{item_id}")
def mudar_item(sessao_id: str, item_id: str, corpo: MudancaItem):
    try:
        return _sessao_existente(sessao_id).atualizar_item(item_id, corpo.status, corpo.resposta)
    except KeyError:
        raise HTTPException(404, "item não encontrado")
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/sessoes/{sessao_id}/checklist")
def novo_item_sessao(sessao_id: str, item: ItemChecklist):
    return _sessao_existente(sessao_id).adicionar_item(item.pergunta, item.categoria, item.obrigatoria)


@app.get("/sessoes/{sessao_id}/anotacoes")
def ler_anotacoes(sessao_id: str):
    return _sessao_existente(sessao_id).copiloto()["anotacoes"]


@app.post("/sessoes/{sessao_id}/anotacoes")
def anotar(sessao_id: str, corpo: Texto):
    if not corpo.texto.strip():
        raise HTTPException(422, "anotação vazia")
    return _sessao_existente(sessao_id).adicionar_anotacao(corpo.texto)


@app.post("/sessoes/{sessao_id}/perguntar")
async def perguntar(sessao_id: str, corpo: Texto):
    if not corpo.texto.strip():
        raise HTTPException(422, "pergunta vazia")
    try:
        return await _sessao_existente(sessao_id).perguntar(corpo.texto.strip())
    except RuntimeError as e:
        raise HTTPException(503, f"Gemini indisponível: {e}")


@app.get("/sessoes/{sessao_id}/transcricao", response_class=PlainTextResponse)
def ler_transcricao(sessao_id: str):
    arq = PASTA_SESSOES / id_seguro(sessao_id) / "transcricao.txt"
    if not arq.exists():
        raise HTTPException(404, "sessão não encontrada")
    return arq.read_text(encoding="utf-8")


@app.get("/sessoes/{sessao_id}/ata", response_class=PlainTextResponse)
def ler_ata(sessao_id: str):
    arq = PASTA_SESSOES / id_seguro(sessao_id) / "ata.md"
    if not arq.exists():
        raise HTTPException(404, "ata ainda não gerada (finalize a sessão)")
    return arq.read_text(encoding="utf-8")


@app.post("/sessoes/{sessao_id}/analisar")
async def analisar_agora(sessao_id: str):
    s = _sessao_existente(sessao_id)
    await s.analisar()
    return s.copiloto()


@app.post("/sessoes/{sessao_id}/reprocessar")
async def reprocessar(sessao_id: str):
    return await _sessao_existente(sessao_id).reprocessar_falhas()


@app.post("/sessoes/{sessao_id}/finalizar")
async def finalizar(sessao_id: str):
    return await _sessao_existente(sessao_id).finalizar()


if __name__ == "__main__":
    import uvicorn

    info(f"backend em http://localhost:{config.PORTA}  |  sessões em {PASTA_SESSOES}  |  contextos em {PASTA_CONTEXTOS}")
    info(f"transcrição: {', '.join(config.MODELOS_TRANSCRICAO)}")
    uvicorn.run(app, host="0.0.0.0", port=config.PORTA, log_level="warning")
