"""Configuração central. Tudo pode ser sobrescrito no arquivo .env."""
import os


def _env(nome: str, padrao, tipo=str):
    valor = os.environ.get(nome, "").strip()
    return tipo(valor) if valor else padrao


def _lista(nome: str, padrao: list[str]) -> list[str]:
    valor = os.environ.get(nome, "").strip()
    return [v.strip() for v in valor.split(",") if v.strip()] if valor else padrao


PORTA = _env("PORTA", 8000, int)

# gemini-3.8-flash / 3.7-flash / flash-latest deram timeout (>25s) nesta conta.
MODELOS_TRANSCRICAO = _lista(
    "MODELOS_TRANSCRICAO", ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
)
MODELOS_ANALISE = _lista(
    "MODELOS_ANALISE", ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
)

TIMEOUT_TRANSCRICAO_S = _env("TIMEOUT_TRANSCRICAO_S", 20.0, float)
TIMEOUT_ANALISE_S = _env("TIMEOUT_ANALISE_S", 45.0, float)
MAX_CHAMADAS_SIMULTANEAS = _env("MAX_CHAMADAS_SIMULTANEAS", 4, int)

# Análise acumulada roda a cada X segundos de áudio com fala
ANALISAR_A_CADA_S = _env("ANALISAR_A_CADA_S", 30.0, float)
CONTEXTO_CHARS = _env("CONTEXTO_CHARS", 300, int)
JANELA_ANALISE_CHARS = _env("JANELA_ANALISE_CHARS", 15000, int)

# Reprocessamento automático de chunks que falharam (segundos de espera entre tentativas)
ESPERAS_REPROCESSAR_S = [int(x) for x in _lista("ESPERAS_REPROCESSAR_S", ["10", "30", "90"])]

# 1 = guarda todo o áudio recebido em sessoes/<id>/audio/
SALVAR_AUDIO = _env("SALVAR_AUDIO", "0") == "1"

TAMANHO_MINIMO_BYTES = 2000            # abaixo disso é só cabeçalho WebM
TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024  # limite de upload inline do Gemini

# ---------- Contextos (material de apoio analisado antes da reunião) ----------

TIMEOUT_CONTEXTO_S = _env("TIMEOUT_CONTEXTO_S", 180.0, float)
# Texto máximo lido de cada arquivo (.txt/.md/.docx...) na extração
MAX_CHARS_ARQUIVO = _env("MAX_CHARS_ARQUIVO", 500000, int)
# Quanto do contexto.md entra no prompt da análise ao vivo e do chat
CONTEXTO_ANALISE_CHARS = _env("CONTEXTO_ANALISE_CHARS", 30000, int)
# Quantos termos do glossário vão para o prompt da transcrição
GLOSSARIO_MAX_TERMOS = _env("GLOSSARIO_MAX_TERMOS", 80, int)
# Acima disso o arquivo vai pela File API do Gemini em vez de inline
TAMANHO_INLINE_BYTES = 18 * 1024 * 1024
# Até esse total, os arquivos de texto entram na íntegra na consolidação (mais fiel que a extração)
CONSOLIDACAO_ORIGINAL_CHARS = _env("CONSOLIDACAO_ORIGINAL_CHARS", 120000, int)
