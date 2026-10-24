"""Cria o contexto de exemplo "MeuLab · IFPR Cascavel" pela API, processa os arquivos e aplica a curadoria
(checklist, glossário e perguntas rápidas de _curadoria.json).

Uso (com o backend rodando):  python exemplos/carregar_exemplo.py [http://localhost:8000]
"""
import json
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

BACKEND = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/")
PASTA = Path(__file__).parent / "meulab"
CONTEXTO = "meulab-ifpr-cascavel"


def chamar(metodo: str, caminho: str, corpo=None, multipart=None, timeout=300):
    headers, dados = {}, None
    if corpo is not None:
        dados, headers["Content-Type"] = json.dumps(corpo).encode(), "application/json"
    if multipart:
        limite = uuid.uuid4().hex
        partes = []
        for arq in multipart:
            partes.append(f'--{limite}\r\nContent-Disposition: form-data; name="arquivos"; '
                          f'filename="{arq.name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()
                          + arq.read_bytes() + b"\r\n")
        dados = b"".join(partes) + f"--{limite}--\r\n".encode()
        headers["Content-Type"] = f"multipart/form-data; boundary={limite}"
    req = urllib.request.Request(BACKEND + caminho, data=dados, method=metodo, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


try:
    chamar("GET", "/", timeout=5)
except urllib.error.URLError:
    sys.exit(f"Backend não está rodando em {BACKEND}. Inicie antes com: python main.py")

try:
    chamar("POST", "/contextos", {
        "id": CONTEXTO,
        "nome": "MeuLab · IFPR Cascavel",
        "descricao": "Implantação da plataforma MeuLab (agenda de laboratórios, almoxarifado e aprovação de práticas) "
                     "no Instituto Federal do Paraná – Campus Cascavel (dados fictícios). Reunião de alinhamento: 24/10.",
    })
    print("contexto criado")
except urllib.error.HTTPError as e:
    if e.code != 409:
        raise
    print("contexto já existia, só reprocessando")

chamar("POST", f"/contextos/{CONTEXTO}/arquivos", multipart=[a for a in sorted(PASTA.glob("*.*")) if not a.name.startswith("_")])
print("arquivos enviados, processando com o Gemini (pode levar 1-2 min)...")
r = chamar("POST", f"/contextos/{CONTEXTO}/processar")
print(f"extraídos: {r['extraidos']}  erros: {r['erros']}")

cur = json.loads((PASTA / "_curadoria.json").read_text(encoding="utf-8"))
chamar("PUT", f"/contextos/{CONTEXTO}/checklist", cur["checklist"])
chamar("PUT", f"/contextos/{CONTEXTO}/glossario", {"termos": cur["glossario"]})
chamar("PUT", f"/contextos/{CONTEXTO}/perguntas-rapidas", {"perguntas": cur["perguntas_rapidas"]})
print("curadoria aplicada")

ctx = chamar("GET", f"/contextos/{CONTEXTO}")
print(f"\nglossário: {', '.join(ctx['glossario'][:15])}...")
print(f"perguntas rápidas: {ctx['perguntas_rapidas']}\n")
for i in ctx["checklist"]:
    marca = "✔" if i["confirmado_no_contexto"] else "○"
    valor = i["resposta_contexto"] if i["confirmado_no_contexto"] else (i["valor_referencia"] or "-")
    print(f"{marca} {i['codigo']}  {i['titulo']:<45} {valor}")
