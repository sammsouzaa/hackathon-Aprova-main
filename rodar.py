"""Sobe o backend (FastAPI, porta 8000) e o front (Vite, porta 3000) juntos.

Uso:  python rodar.py
Ctrl+C encerra os dois. Na primeira vez cria o venv do backend, instala as dependências do front
e carrega o contexto de exemplo do MeuLab (precisa da GEMINI_API_KEY em backend/.env).
"""
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).parent
BACKEND = RAIZ / "backend"
FRONT = RAIZ / "frontend"
API = "http://localhost:8000"
CONTEXTO = "meulab-ifpr-cascavel"
WIN = os.name == "nt"


def python_do_venv() -> str:
    venv = BACKEND / "venv"
    py = venv / ("Scripts/python.exe" if WIN else "bin/python")
    if py.exists():
        return str(py)
    # Python atual já tem as dependências? Usa ele mesmo.
    if subprocess.call([sys.executable, "-c", "import fastapi, uvicorn, dotenv, google.genai"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
        return sys.executable
    print("[rodar] criando venv do backend...")
    subprocess.check_call([sys.executable, "-m", "venv", str(venv)])
    subprocess.check_call([str(py), "-m", "pip", "install", "-q", "-r", str(BACKEND / "requirements.txt")])
    return str(py)


def backend_no_ar(timeout=1) -> bool:
    try:
        urllib.request.urlopen(API + "/", timeout=timeout)
        return True
    except Exception:
        return False


def contexto_existe() -> bool:
    """Contexto criado e completo (consolidado e com checklist); se parou no meio, recarrega."""
    try:
        with urllib.request.urlopen(f"{API}/contextos/{CONTEXTO}", timeout=3) as r:
            ctx = json.load(r)
        return bool(ctx.get("contexto")) and bool(ctx.get("checklist"))
    except Exception:
        return False


def liberar_porta(porta: int) -> None:
    """Encerra o que estiver escutando na porta (ex.: um rodar.py anterior que ficou aberto)."""
    if WIN:
        cmd = (f"Get-NetTCPConnection -LocalPort {porta} -State Listen -ErrorAction SilentlyContinue | "
               "ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }")
        subprocess.call(["powershell", "-NoProfile", "-Command", cmd],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        subprocess.call(f"lsof -ti tcp:{porta} -sTCP:LISTEN | xargs -r kill -9", shell=True,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    npm = shutil.which("npm")
    if not npm:
        sys.exit("npm não encontrado no PATH. Instale o Node.js.")

    py = python_do_venv()
    if not (FRONT / "node_modules").exists():
        print("[rodar] instalando dependências do front...")
        subprocess.check_call([npm, "install"], cwd=FRONT)

    liberar_porta(8000)
    liberar_porta(3000)
    time.sleep(1)

    procs = []
    print("[rodar] subindo backend em", API)
    procs.append(subprocess.Popen([py, "main.py"], cwd=BACKEND))

    for _ in range(60):
        if procs[0].poll() is not None:
            sys.exit("[rodar] o backend encerrou ao iniciar (veja o erro acima; a GEMINI_API_KEY está no .env?)")
        if backend_no_ar():
            break
        time.sleep(0.5)

    if not contexto_existe():
        print("[rodar] contexto do MeuLab não existe, carregando exemplo (1-2 min)...")
        subprocess.call([py, "exemplos/carregar_exemplo.py", API], cwd=BACKEND)

    print("[rodar] subindo front em http://localhost:3000")
    # Sem VITE_API_URL: o front chama a API no mesmo host em que foi aberto (funciona de outro PC na rede)
    env = {**os.environ, "VITE_CONTEXTO_ID": CONTEXTO}
    procs.append(subprocess.Popen([npm, "run", "dev"], cwd=FRONT, env=env))

    try:
        while all(p.poll() is None for p in procs):
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        print("\n[rodar] encerrando...")
        for p in procs:
            if p.poll() is None:
                if WIN:
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()


if __name__ == "__main__":
    main()
