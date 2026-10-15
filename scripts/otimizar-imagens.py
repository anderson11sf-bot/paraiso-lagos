#!/usr/bin/env python3
# ============================================================================
# otimizar-imagens.py — CONVERSÃO DE IMAGENS COM PILLOW
# ----------------------------------------------------------------------------
# Chamado pelo otimizar-midia.ps1, mas também funciona sozinho:
#
#   python scripts/otimizar-imagens.py --origem "C:\fotos" --destino public/media/img
#
# O QUE ELE GERA, para cada imagem
#   • AVIF  nas larguras 480, 768, 1280, 1920  (qualidade ~50)
#   • WebP  nas mesmas larguras               (qualidade ~75)
#   • JPEG  nas mesmas larguras (reserva para navegador antigo)
#   • remove EXIF/GPS (privacidade: foto de celular costuma trazer o local)
#   • corrige a orientação (foto tirada de lado fica em pé)
#   • não aumenta imagem pequena (nunca faz upscale)
#
# NOME DOS ARQUIVOS
#   lago-amanhecer.jpg  →  lago-amanhecer-480.avif / -768.webp / -1280.jpg ...
# ============================================================================

from __future__ import annotations

import argparse
import os
import sys
import unicodedata
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    print("ERRO: Pillow nao instalado. Rode:  python -m pip install Pillow")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

LARGURAS = (480, 768, 1280, 1920)

# Qualidades: AVIF aguenta qualidade baixa sem perder nitidez;
# WebP 75 e JPEG 82 são o padrão da indústria para foto.
QUALIDADES = {"avif": 50, "webp": 75, "jpeg": 82}

# Metas de peso (KB) para avisar quando passar
LIMITES_KB = {"avif": 150, "webp": 220, "jpeg": 320}
LIMITE_HERO_KB = 100   # para imagens marcadas como hero

FORMATOS = ("avif", "webp", "jpeg")

# AVIF e WebP dependem do build da biblioteca: checamos uma vez
SUPORTADOS = set()
for fmt, nome_interno in (("avif", "AVIF"), ("webp", "WEBP"), ("jpeg", "JPEG")):
    try:
        if nome_interno in Image.registered_extensions().values() or True:
            SUPORTADOS.add(fmt)
    except Exception:
        pass


def checar_suporte() -> None:
    """Descobre o que esta biblioteca realmente consegue gravar."""
    from io import BytesIO
    globais = []
    testes = {"avif": "AVIF", "webp": "WEBP", "jpeg": "JPEG"}
    for fmt, nome in testes.items():
        try:
            buf = BytesIO()
            Image.new("RGB", (8, 8)).save(buf, format=nome)
            globais.append(fmt)
        except Exception:
            print(f"  aviso: este Pillow nao suporta {nome}; o formato sera pulado")
    return set(globais)


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def nome_seguro(nome: str) -> str:
    """Sem acento, sem espaço, minúsculo, com hífen (regra do projeto)."""
    base = Path(nome).stem
    normalizado = unicodedata.normalize("NFKD", base)
    sem_acento = "".join(c for c in normalizado if not unicodedata.combining(c))
    limpo = "".join(c if c.isalnum() else "-" for c in sem_acento.lower())
    while "--" in limpo:
        limpo = limpo.replace("--", "-")
    return limpo.strip("-") or "arquivo"


def abrir_corrigido(caminho: Path) -> Image.Image:
    """
    Abre, aplica a orientação do EXIF e converte para RGB.
    O `exif_transpose` é o que impede a foto de aparecer deitada — e, ao
    reconstruir a imagem, os metadados (inclusive GPS) ficam para trás.
    """
    with Image.open(caminho) as bruta:
        corrigida = ImageOps.exif_transpose(bruta)
        if corrigida.mode in ("RGBA", "LA", "P"):
            # Fundo claro para PNG com transparência virar JPEG sem borrão preto
            fundo = Image.new("RGB", corrigida.size, (6, 36, 39))
            convertida = corrigida.convert("RGBA")
            fundo.paste(convertida, mask=convertida.split()[-1])
            return fundo
        return corrigida.convert("RGB")


def larguras_uteis(largura_original: int) -> list[int]:
    """Só as larguras menores ou iguais à original (nunca faz upscale)."""
    uteis = [w for w in LARGURAS if w <= largura_original]
    if not uteis:
        # Imagem menor que 480: usa a própria largura, arredondada
        uteis = [largura_original]
    return uteis


def salvar(imagem: Image.Image, destino: Path, formato: str) -> int:
    """Grava num formato e devolve o peso em bytes."""
    kwargs = {"optimize": True}
    if formato == "jpeg":
        kwargs.update({"quality": QUALIDADES["jpeg"], "progressive": True,
                       "subsampling": "4:2:0"})
    elif formato == "webp":
        kwargs.update({"quality": QUALIDADES["webp"], "method": 6})
    elif formato == "avif":
        kwargs.update({"quality": QUALIDADES["avif"], "speed": 4})

    nome_interno = {"jpeg": "JPEG", "webp": "WEBP", "avif": "AVIF"}[formato]
    imagem.save(destino, format=nome_interno, **kwargs)
    return destino.stat().st_size


def processar(caminho: Path, destino_dir: Path, so_poster: bool, suportados: set[str],
              relatar: list[str]) -> None:
    base = nome_seguro(caminho.name)
    try:
        imagem = abrir_corrigido(caminho)
    except Exception as erro:
        relatar.append(f"  FALHOU ao abrir {caminho.name}: {erro}")
        return

    largura_original, altura_original = imagem.size

    # Poster: uma única largura de 1280 (ou a original, se menor)
    if so_poster:
        alvos = [min(1280, largura_original)]
    else:
        alvos = larguras_uteis(largura_original)

    for largura in alvos:
        if largura < largura_original:
            proporcao = largura / largura_original
            nova_altura = max(1, round(altura_original * proporcao))
            redimensionada = imagem.resize((largura, nova_altura), Image.LANCZOS)
        else:
            redimensionada = imagem

        for formato in FORMATOS:
            if formato not in suportados:
                continue
            sufixo = "jpg" if formato == "jpeg" else formato
            arquivo = destino_dir / f"{base}-{largura}.{sufixo}"
            try:
                peso = salvar(redimensionada, arquivo, formato)
            except Exception as erro:
                relatar.append(f"  aviso: {arquivo.name} ({erro})")
                continue

            kb = round(peso / 1024)
            limite = LIMITES_KB[formato]
            alerta = "  <-- acima do ideal" if kb > limite else ""
            relatar.append(f"  {arquivo.name:<48} {kb:>5} KB{alerta}")

    del imagem


# ---------------------------------------------------------------------------
# Ponto de entrada
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Otimiza imagens para o site.")
    parser.add_argument("--lista", help="arquivo com a lista de caminhos (um por linha)")
    parser.add_argument("--origem", help="pasta de origem (alternativa ao --lista)")
    parser.add_argument("--destino", required=True, help="pasta de destino")
    parser.add_argument("--so-poster", action="store_true",
                        help="gera apenas uma largura (para poster de vídeo)")
    args = parser.parse_args()

    destino_dir = Path(args.destino)
    destino_dir.mkdir(parents=True, exist_ok=True)

    # Monta a lista de arquivos
    arquivos: list[Path] = []
    if args.lista:
        for linha in Path(args.lista).read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if linha and Path(linha).is_file():
                arquivos.append(Path(linha))
    elif args.origem:
        origem = Path(args.origem)
        extensoes = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff", ".bmp"}
        arquivos = [p for p in origem.rglob("*") if p.is_file() and p.suffix.lower() in extensoes]
    else:
        print("Informe --lista ou --origem.")
        return 2

    if not arquivos:
        print("Nenhuma imagem para converter.")
        return 0

    print(f"Convertendo {len(arquivos)} imagem(ns) para {destino_dir}")
    suportados = checar_suporte()
    if not suportados:
        print("ERRO: nenhum formato suportado por este Pillow.")
        return 1
    print(f"Formatos disponiveis: {', '.join(sorted(suportados))}")

    relatar: list[str] = []
    for i, arquivo in enumerate(arquivos, 1):
        print(f"[{i}/{len(arquivos)}] {arquivo.name}")
        processar(arquivo, destino_dir, args.so_poster, suportados, relatar)

    print("")
    for linha in relatar:
        print(linha)

    # Aviso final sobre a meta do hero
    grandes = [l for l in relatar if "acima do ideal" in l]
    if grandes:
        print("")
        print("Meta: foto comum abaixo de 150 KB no mobile; hero abaixo de 100 KB.")
        print(f"{len(grandes)} arquivo(s) acima do ideal — considere baixar a qualidade.")
        print("Dica: para o hero, use a versao -768 avif.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
