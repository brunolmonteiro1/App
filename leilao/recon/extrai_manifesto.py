#!/usr/bin/env python3
"""Reconhecimento: extrai o manifesto item-a-item de um PDF de anexo do Superbid.

Este script NÃO é o produto — é a prova de conceito que validou as premissas do
plano (ver ../docs/01-reconhecimento.md). O extrator de texto aqui é caseiro e
funciona apenas nos PDFs de manifesto, que usam fonte com encoding padrão. O
Edital do evento usa fonte com subset sem /ToUnicode e sai ilegível daqui — por
isso o produto vai usar pdfjs-dist, que reconstrói o mapeamento a partir do
programa de fonte embutido.

Uso:
    python3 extrai_manifesto.py fixtures/manifesto-lote3-SB0032812.pdf

Saída esperada para o lote 3 (é o teste de regressão do plano):
    itens=71  soma=304  refs={'SB0032812'}
"""

import re
import sys
import zlib

# Cada linha da tabela termina com esta frase padrão. Serve como delimitador de
# registro — dividir por ela ANTES de aplicar regex é o que evita backtracking
# catastrófico (um regex lazy global com DOTALL travou o processo no recon).
DELIMITADOR = "Somente os itens citados"

# Fragmentos do boilerplate que sobram na descrição depois do split e precisam
# sair explicitamente. Sem isso, a descrição vira "na descrição fazem parte do
# lote Itens não testados, podendo apresentar...".
RUIDO = [
    "na descrição fazem parte do lote",
    "Detalhes produtos",
    "Descrição Quantidade Referência Observações Vencimento Desmontado Incompleto Marca Frases Padrões",
]

RX_CABECALHO = re.compile(r"Condição do bem.*?informado", re.S)
RX_FOTOS = re.compile(r"\(Fotos meramente ilustrativas\)")
RX_TESTADOS = re.compile(r"Itens não testados.*?componentes", re.S)
# Ancorado no FIM do registro: "<descrição> <quantidade> <referência>"
RX_QTD_REF = re.compile(r"(\d+)\s+(SB\d+)\s*$")


def _desescapa(s: bytes) -> bytes:
    s = re.sub(rb"\\([0-7]{1,3})", lambda m: bytes([int(m.group(1), 8) & 0xFF]), s)
    return s.replace(rb"\(", b"(").replace(rb"\)", b")").replace(rb"\\", b"\\")


def paginas(caminho: str) -> list[str]:
    """Texto por página, lido dos operadores Tj/TJ dos streams de conteúdo."""
    raw = open(caminho, "rb").read()
    saida = []
    for stream in re.findall(rb"stream\r?\n(.*?)\r?\nendstream", raw, re.S):
        try:
            corpo = zlib.decompress(stream)
        except zlib.error:
            continue  # streams de imagem e afins
        if b"BT" not in corpo:
            continue
        partes = []
        for m in re.finditer(
            rb"\((?:[^()\\]|\\.)*\)\s*Tj|\[(?:[^\[\]\\]|\\.)*\]\s*TJ", corpo
        ):
            partes.append(
                "".join(
                    _desescapa(x[1:-1]).decode("latin-1")
                    for x in re.findall(rb"\((?:[^()\\]|\\.)*\)", m.group(0))
                )
            )
        if partes:
            saida.append(" ".join(partes))
    return saida


def itens(caminho: str) -> list[tuple[int, str, str]]:
    """Lista de (quantidade, descrição, referência) do manifesto."""
    corpo = " ".join(paginas(caminho))
    resultado = []
    # O último pedaço vem depois do delimitador final e não é um registro.
    for pedaco in corpo.split(DELIMITADOR)[:-1]:
        pedaco = RX_CABECALHO.sub("", pedaco)
        pedaco = RX_FOTOS.sub("", pedaco)
        pedaco = RX_TESTADOS.sub("", pedaco)
        pedaco = pedaco.replace("<br>", " ")
        for ruido in RUIDO:
            pedaco = pedaco.replace(ruido, "")
        pedaco = " ".join(pedaco.split())
        m = RX_QTD_REF.search(pedaco)
        if not m:
            continue
        descricao = pedaco[: m.start()].strip(" .-")
        resultado.append((int(m.group(1)), descricao, m.group(2)))
    return resultado


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    caminho = sys.argv[1]
    lista = itens(caminho)
    refs = {r for _, _, r in lista}
    soma = sum(q for q, _, _ in lista)
    print(f"paginas={len(paginas(caminho))} itens={len(lista)} soma={soma} refs={refs}")
    for q, d, _ in lista:
        print(f"  {q:>4}x  {d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
