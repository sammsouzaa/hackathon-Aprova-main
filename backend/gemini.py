"""Chamadas ao Gemini com fallback entre modelos, retry, timeout e limite de concorrência."""
import asyncio
import os
from typing import Sequence

from google import genai
from google.genai import types

import config
from log import aviso

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY or API_KEY == "sua_chave_aqui":
    raise SystemExit("Defina GEMINI_API_KEY no arquivo backend/.env")

client = genai.Client(api_key=API_KEY)

# Evita rajadas de chamadas simultâneas (que geram 429/503)
_limite = asyncio.Semaphore(config.MAX_CHAMADAS_SIMULTANEAS)


async def gerar(
    modelos: Sequence[str],
    contents: list,
    cfg: types.GenerateContentConfig,
    timeout: float,
    rotulo: str,
    rodadas: int = 2,
) -> tuple[str, str]:
    """Tenta cada modelo em ordem; se todos falharem, espera e tenta mais uma rodada.
    Retorna (texto_da_resposta, modelo_usado). Lança RuntimeError se tudo falhar."""
    ultimo_erro = "nenhum modelo configurado"
    for rodada in range(rodadas):
        for modelo in modelos:
            try:
                async with _limite:
                    resp = await asyncio.wait_for(
                        client.aio.models.generate_content(model=modelo, contents=contents, config=cfg),
                        timeout=timeout,
                    )
                return (resp.text or ""), modelo
            except asyncio.TimeoutError:
                ultimo_erro = f"{modelo}: timeout {timeout:.0f}s"
            except Exception as e:
                codigo = getattr(e, "code", None) or type(e).__name__
                ultimo_erro = f"{modelo}: {codigo}"
            aviso(f"{rotulo} {ultimo_erro}, tentando outro modelo")
        if rodada < rodadas - 1:
            await asyncio.sleep(2)
    raise RuntimeError(ultimo_erro)


async def gerar_stream(
    modelos: Sequence[str],
    contents: list,
    cfg: types.GenerateContentConfig,
    timeout: float,
    rotulo: str,
):
    """Como gerar(), mas devolve o texto em pedaços (async generator de str).
    O fallback entre modelos só acontece até o primeiro pedaço chegar; depois disso, um erro encerra o stream."""
    ultimo_erro = "nenhum modelo configurado"
    for modelo in modelos:
        try:
            async with _limite:
                stream = await asyncio.wait_for(
                    client.aio.models.generate_content_stream(model=modelo, contents=contents, config=cfg),
                    timeout=timeout,
                )
                pedacos = stream.__aiter__()
                primeiro = await asyncio.wait_for(pedacos.__anext__(), timeout=timeout)
                if primeiro.text:
                    yield primeiro.text
                try:
                    async for pedaco in pedacos:
                        if pedaco.text:
                            yield pedaco.text
                except Exception as e:
                    aviso(f"{rotulo} {modelo}: stream interrompido ({type(e).__name__})")
                return
        except StopAsyncIteration:
            return
        except asyncio.TimeoutError:
            ultimo_erro = f"{modelo}: timeout {timeout:.0f}s"
        except Exception as e:
            codigo = getattr(e, "code", None) or type(e).__name__
            ultimo_erro = f"{modelo}: {codigo}"
        aviso(f"{rotulo} {ultimo_erro}, tentando outro modelo")
    raise RuntimeError(ultimo_erro)


async def enviar_arquivo(caminho, mime: str, espera_max_s: float = 120):
    """Sobe um arquivo grande pela File API e espera ficar pronto para uso."""
    arq = await client.aio.files.upload(file=caminho, config={"mime_type": mime})
    for _ in range(int(espera_max_s / 2)):
        estado = str(getattr(arq.state, "name", arq.state) or "")
        if "PROCESSING" not in estado:
            break
        await asyncio.sleep(2)
        arq = await client.aio.files.get(name=arq.name)
    if "FAILED" in str(getattr(arq.state, "name", arq.state) or ""):
        raise RuntimeError(f"Gemini não conseguiu processar {caminho}")
    return arq
