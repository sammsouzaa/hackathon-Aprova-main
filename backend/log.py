"""Log simples e limpo no terminal (sem emojis)."""
import sys
from datetime import datetime

# Acentos no console do Windows (cp1252) sem derrubar a requisição
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def _agora() -> str:
    return datetime.now().strftime("%H:%M:%S")


def info(msg: str) -> None:
    print(f"{_agora()}  {msg}", flush=True)


def aviso(msg: str) -> None:
    print(f"{_agora()}  [aviso] {msg}", flush=True)


def erro(msg: str) -> None:
    print(f"{_agora()}  [erro]  {msg}", flush=True)
