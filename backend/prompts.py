"""Schemas e configs do Gemini. O TEXTO das instruções do agente vive em INSTRUCTIONS/ (raiz do repo):
edite lá para mudar o comportamento do copiloto. Índice e responsabilidades: INSTRUCTIONS/README.md."""
import re
from pathlib import Path
from typing import List, Optional

from google.genai import types
from pydantic import BaseModel

PASTA_INSTRUCOES = Path(__file__).resolve().parent.parent / "INSTRUCTIONS"


def _ler(arquivo: str) -> str:
    """Lê uma instrução de INSTRUCTIONS/, sem o comentário de cabeçalho (documentação)."""
    texto = (PASTA_INSTRUCOES / arquivo).read_text(encoding="utf-8")
    return re.sub(r"\A<!--.*?-->\s*", "", texto, flags=re.S).strip("\n")


# ---------- Transcrição (por chunk, rápida, texto puro) ----------

TRANSCRICAO = _ler("01-transcricao.md")

GLOSSARIO_TRANSCRICAO = "\n" + _ler("02-glossario-transcricao.md") + "\n"

CONFIG_TRANSCRICAO = types.GenerateContentConfig(temperature=0.0)


# ---------- Contexto: extração de cada arquivo (roda uma vez por arquivo) ----------

class ExtracaoArquivo(BaseModel):
    conteudo: str               # markdown com tudo que importa do arquivo
    termos: List[str]           # nomes próprios, siglas, sistemas, órgãos
    perguntas: List[str]        # perguntas que ainda precisam ser feitas


EXTRACAO = _ler("03-extracao-arquivo.md")

CONFIG_EXTRACAO = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=ExtracaoArquivo,
    temperature=0.1,
)


# ---------- Contexto: consolidação de todos os arquivos ----------

class ItemSugerido(BaseModel):
    titulo: str                         # rótulo curto (ex.: "Recuo frontal mínimo na ZR2")
    pergunta: str
    categoria: str
    obrigatoria: bool
    valor_referencia: Optional[str]     # valor que o material indica e precisa ser confirmado (ex.: "4,50 m")
    confirmado_no_contexto: bool        # o material já confirma a resposta de forma definitiva
    resposta_contexto: Optional[str]    # a resposta confirmada, se houver


class Consolidacao(BaseModel):
    contexto: str
    glossario: List[str]
    checklist: List[ItemSugerido]
    perguntas_rapidas: List[str]


CONSOLIDACAO = _ler("04-consolidacao-contexto.md")

CONFIG_CONSOLIDACAO = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=Consolidacao,
    temperature=0.2,
)


# ---------- Análise acumulada (a cada ~30s de fala) ----------

class AtualizacaoChecklist(BaseModel):
    id: str
    status: str                 # pendente | parcial | respondida
    resposta: str               # o que foi respondido, em uma frase
    trecho: str                 # citação curta da transcrição que comprova
    hora: Optional[str]         # [HH:MM:SS] do trecho, se houver
    diverge: bool               # a resposta dada contradiz o valor de referência


class Analise(BaseModel):
    resumo: str
    regras_negocio: List[str]
    pendencias: List[str]
    resolvidos: List[str]
    anotacoes: List[str]
    perguntas_sugeridas: List[str]
    sugestao_pergunta_imediata: Optional[str]
    checklist: List[AtualizacaoChecklist]


ANALISE = _ler("05-analise-ao-vivo.md")

CONFIG_ANALISE = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=Analise,
    temperature=0.2,
)


# ---------- Chat com o copiloto durante a reunião ----------

PERGUNTA = _ler("06-pergunta-na-reuniao.md")

CONFIG_PERGUNTA = types.GenerateContentConfig(temperature=0.2)

# ---------- Chat sobre o contexto (fora da reunião) ----------

PERGUNTA_CONTEXTO = _ler("07-pergunta-sobre-o-contexto.md")


# ---------- Ata final ----------

ATA = _ler("08-ata-final.md")

CONFIG_ATA = types.GenerateContentConfig(temperature=0.2)
