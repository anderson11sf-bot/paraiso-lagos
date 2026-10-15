#!/usr/bin/env pwsh
# ============================================================================
# otimizar-midia.ps1 — CONVERSÃO DE IMAGENS E VÍDEOS PARA O SITE
# ----------------------------------------------------------------------------
# Lê a pasta de origem que você informar, converte tudo e escreve pronto em
# public/media/. No fim, imprime exatamente o que colar no config.js.
#
# O QUE ELE FAZ
#   Vídeos  → MP4 H.264 com faststart (720p + 1080p) e WebM/VP9
#             + poster AVIF/WebP extraído do próprio vídeo
#   Imagens → AVIF + WebP + JPEG de reserva, em 480/768/1280/1920 px
#             sem metadados EXIF/GPS (privacidade)
#   Frames  → sequências WebP para as cenas de fundo, se você pedir
#
# COMO USAR
#   1. Abra o PowerShell na pasta do projeto.
#   2. Rode (ajuste o caminho de origem):
#
#        pwsh scripts/otimizar-midia.ps1 -Origem "C:\caminho\das\midias"
#
#      Opções:
#        -Origem       pasta com os arquivos originais   (obrigatório)
#        -Alvo         pasta de destino (padrão: public/media)
#        -Frames       também gerar frames de fundo dos vídeos
#        -SemVideo     só imagens
#        -SemImagem    só vídeos
#
# REQUISITOS
#   • ffmpeg e ffprobe no PATH  (winget install Gyan.FFmpeg)
#   • Python com Pillow         (o runtime do projeto já tem)
# ============================================================================

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Origem,
  [string]$Alvo = "public/media",
  [switch]$Frames,
  [switch]$SemVideo,
  [switch]$SemImagem
)

$ErrorActionPreference = "Stop"
$Progresso = @{ ok = 0; pulado = 0; erro = 0; economizado = 0 }

function Escrever($texto, $cor = "Gray") { Write-Host $texto -ForegroundColor $cor }
function Titulo($texto) {
  Write-Host ""
  Write-Host ("=" * 70) -ForegroundColor DarkCyan
  Write-Host " $texto" -ForegroundColor Cyan
  Write-Host ("=" * 70) -ForegroundColor DarkCyan
}

# ---------------------------------------------------------------------------
# Verificações de ambiente
# ---------------------------------------------------------------------------
Titulo "Verificando as ferramentas"

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue
if (-not $SemVideo -and -not $ffmpeg) {
  Escrever "ffmpeg NAO encontrado. Instale com:  winget install Gyan.FFmpeg" "Red"
  Escrever "Dica: rode com -SemVideo para converter apenas as imagens." "Yellow"
  exit 1
}
if ($ffmpeg) { Escrever "  ffmpeg  OK  $($ffmpeg.Source)" "Green" }

# Python: procura o runtime do projeto e, depois, o do sistema
$python = $null
$candidatos = @(
  "C:\Users\$env:USERNAME\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe",
  "$PSScriptRoot\..\..\..\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
)
foreach ($c in $candidatos) { if (Test-Path $c) { $python = $c; break } }
if (-not $python) {
  $p = Get-Command python -ErrorAction SilentlyContinue
  if ($p) { $python = $p.Source }
}
if (-not $SemImagem) {
  if (-not $python) {
    Escrever "Python NAO encontrado. Rode com -SemImagem para converter apenas os videos." "Red"
    exit 1
  }
  $temPillow = & $python -c "import PIL; print('ok')" 2>$null
  if ($temPillow -ne "ok") {
    Escrever "Pillow NAO instalado. Rode:  `"$python`" -m pip install Pillow" "Red"
    exit 1
  }
  Escrever "  python  OK  $python (com Pillow)" "Green"
}

if (-not (Test-Path $Origem)) {
  Escrever "A pasta de origem nao existe: $Origem" "Red"
  exit 1
}
Escrever "  origem  OK  $((Resolve-Path $Origem).Path)" "Green"

# Cria a estrutura de destino
$dirImg = Join-Path $Alvo "img"
$dirVideo = Join-Path $Alvo "video"
$dirFrames = Join-Path $Alvo "frames"
foreach ($d in @($Alvo, $dirImg, $dirVideo)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

# ---------------------------------------------------------------------------
# Nome de arquivo seguro: sem acento, sem espaco, minusculo
# ---------------------------------------------------------------------------
function NomeSeguro([string]$nome) {
  $semExt = [IO.Path]::GetFileNameWithoutExtension($nome)
  $normalizado = $semExt.Normalize([Text.NormalizationForm]::FormD)
  $sb = New-Object Text.StringBuilder
  foreach ($ch in $normalizado.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch) -ne 'NonSpacingMark') {
      [void]$sb.Append($ch)
    }
  }
  $limpo = $sb.ToString().ToLower()
  $limpo = $limpo -replace '[^a-z0-9]+', '-'
  $limpo = $limpo.Trim('-')
  if ([string]::IsNullOrWhiteSpace($limpo)) { $limpo = "arquivo" }
  return $limpo
}

# ---------------------------------------------------------------------------
# IMAGENS
# ---------------------------------------------------------------------------
if (-not $SemImagem) {
  Titulo "Imagens"

  $extensoesImg = @('.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.bmp')
  $imagens = Get-ChildItem -Path $Origem -Recurse -File |
    Where-Object { $extensoesImg -contains $_.Extension.ToLower() }

  if (-not $imagens) {
    Escrever "  Nenhuma imagem encontrada em $Origem" "Yellow"
  } else {
    Escrever "  $($imagens.Count) imagem(ns) encontrada(s)" "White"

    # O trabalho pesado fica no Python (Pillow), que trata AVIF/WebP bem.
    $scriptPy = Join-Path $PSScriptRoot "otimizar-imagens.py"
    $listaArquivos = $imagens | ForEach-Object { $_.FullName }

    # Passa a lista por um arquivo temporário (evita problema de tamanho de linha)
    $listaTmp = [IO.Path]::GetTempFileName()
    $listaArquivos | Set-Content -Path $listaTmp -Encoding UTF8

    & $python $scriptPy --lista $listaTmp --destino $dirImg
    $codigo = $LASTEXITCODE
    Remove-Item $listaTmp -Force -ErrorAction SilentlyContinue

    if ($codigo -ne 0) {
      Escrever "  A conversao de imagens terminou com avisos (codigo $codigo)" "Yellow"
    }
  }
}

# ---------------------------------------------------------------------------
# VÍDEOS
# ---------------------------------------------------------------------------
if (-not $SemVideo) {
  Titulo "Videos"

  $extensoesVideo = @('.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v', '.wmv')
  $videos = Get-ChildItem -Path $Origem -Recurse -File |
    Where-Object { $extensoesVideo -contains $_.Extension.ToLower() }

  if (-not $videos) {
    Escrever "  Nenhum video encontrado em $Origem" "Yellow"
  } else {
    Escrever "  $($videos.Count) video(s) encontrado(s)" "White"

    foreach ($v in $videos) {
      $base = NomeSeguro $v.Name
      $tamanhoMB = [math]::Round($v.Length / 1MB, 1)

      # Descobre a resolução e a duração para decidir o que fazer
      $info = & ffprobe -v error -select_streams v:0 `
        -show_entries stream=width,height,r_frame_rate -show_entries format=duration `
        -of json $v.FullName 2>$null | ConvertFrom-Json

      $largura = [int]$info.streams[0].width
      $altura = [int]$info.streams[0].height
      $duracao = [math]::Round([double]$info.format.duration, 1)
      $vertical = $altura -gt $largura

      Escrever ""
      Escrever "  $($v.Name)" "White"
      Escrever "    ${largura}x${altura}  |  ${duracao}s  |  ${tamanhoMB} MB  |  $(if ($vertical) {'vertical 9:16'} else {'horizontal 16:9'})" "DarkGray"

      # Alvo: 720p e, quando a fonte permitir, 1080p.
      # Vídeos verticais usam a ALTURA como referência (720 e 1080 de altura).
      $alvos = @()
      if ($vertical) {
        if ($altura -ge 1280) { $alvos += 720 }
        if ($altura -ge 1920) { $alvos += 1080 }
        if ($alvos.Count -eq 0) { $alvos += [math]::Min(720, $altura) }
      } else {
        if ($largura -ge 1280) { $alvos += 720 }
        if ($largura -ge 1920) { $alvos += 1080 }
        if ($alvos.Count -eq 0) { $alvos += [math]::Min(720, $largura) }
      }

      foreach ($h in $alvos) {
        $saidaMp4 = Join-Path $dirVideo "$base-$($h)p.mp4"
        if (Test-Path $saidaMp4) { Escrever "    ja existe: $base-$($h)p.mp4" "DarkGray"; continue }

        $filtro = if ($vertical) { "scale=-2:$h" } else { "scale=$h:-2" }

        # H.264: compatível com tudo. faststart = o vídeo começa antes de baixar
        # por inteiro. CRF 26 é um bom equilíbrio para vídeo de venda.
        # -an remove a faixa de áudio nos vídeos de demonstração (pedido do
        # briefing: quanto menos peso, melhor). Para a VSL, use -ComAudio.
        & ffmpeg -y -loglevel error -i $v.FullName `
          -vf $filtro -c:v libx264 -preset slow -crf 26 -profile:v high -level 4.1 `
          -pix_fmt yuv420p -movflags +faststart -an $saidaMp4 2>$null

        if (Test-Path $saidaMp4) {
          $novoMB = [math]::Round((Get-Item $saidaMp4).Length / 1MB, 2)
          $Progresso.ok++
          $Progresso.economizado += ($v.Length - (Get-Item $saidaMp4).Length)
          Escrever "    -> $base-$($h)p.mp4   ${novoMB} MB" "Green"
        } else {
          $Progresso.erro++
          Escrever "    FALHOU: $base-$($h)p.mp4" "Red"
        }
      }

      # WebM/VP9: alternativa aberta, útil para navegadores sem H.264
      $saidaWebm = Join-Path $dirVideo "$base-720.webm"
      if ($alvos -contains 720 -and -not (Test-Path $saidaWebm)) {
        $filtroW = if ($vertical) { "scale=-2:720" } else { "scale=720:-2" }
        & ffmpeg -y -loglevel error -i $v.FullName `
          -vf $filtroW -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -an $saidaWebm 2>$null
        if (Test-Path $saidaWebm) {
          $wMB = [math]::Round((Get-Item $saidaWebm).Length / 1MB, 2)
          Escrever "    -> $base-720.webm  ${wMB} MB" "Green"
        }
      }

      # Poster do vídeo: o primeiro terço costuma ser melhor que o quadro zero
      $posterTmp = Join-Path $dirImg "$base-poster-orig.png"
      $tempoPoster = [math]::Max(1, [math]::Round($duracao / 3, 1))
      & ffmpeg -y -loglevel error -ss $tempoPoster -i $v.FullName -frames:v 1 $posterTmp 2>$null

      if (Test-Path $posterTmp) {
        # Reaproveita o otimizador de imagens para o poster
        $scriptPy = Join-Path $PSScriptRoot "otimizar-imagens.py"
        $listaTmp = [IO.Path]::GetTempFileName()
        @($posterTmp) | Set-Content -Path $listaTmp -Encoding UTF8
        & $python $scriptPy --lista $listaTmp --destino $dirImg --so-poster 2>$null
        Remove-Item $listaTmp -Force -ErrorAction SilentlyContinue
        Remove-Item $posterTmp -Force -ErrorAction SilentlyContinue
        Escrever "    -> poster em AVIF/WebP/JPEG" "Green"
      }

      # Frames para as cenas de fundo (opcional: pesa bastante)
      if ($Frames) {
        if (-not (Test-Path $dirFrames)) { New-Item -ItemType Directory -Force -Path $dirFrames | Out-Null }
        $saidaFrames = Join-Path $dirFrames "$base"
        if (-not (Test-Path $saidaFrames)) { New-Item -ItemType Directory -Force -Path $saidaFrames | Out-Null }
        $filtroF = if ($vertical) { "fps=24,scale=-2:720" } else { "fps=24,scale=720:-2" }
        & ffmpeg -y -loglevel error -i $v.FullName -vf $filtroF `
          -c:v libwebp -q:v 70 (Join-Path $saidaFrames "$base`_%04d.webp") 2>$null
        $qtd = (Get-ChildItem $saidaFrames -File -ErrorAction SilentlyContinue).Count
        if ($qtd -gt 0) {
          $pesoFrames = [math]::Round(((Get-ChildItem $saidaFrames -File | Measure-Object Length -Sum).Sum / 1MB), 2)
          Escrever "    -> $qtd frames WebP em frames/$base  (${pesoFrames} MB)" "Green"
          Escrever "       Se pesar demais, reduza: fps=18 e scale=-2:540" "DarkGray"
        }
      }
    }
  }
}

# ---------------------------------------------------------------------------
# Resumo e o que colar no config.js
# ---------------------------------------------------------------------------
Titulo "Resumo"

$totalBytes = 0
foreach ($d in @($dirImg, $dirVideo)) {
  if (Test-Path $d) {
    $totalBytes += (Get-ChildItem $d -Recurse -File | Measure-Object Length -Sum).Sum
  }
}
$totalMB = [math]::Round($totalBytes / 1MB, 1)
Escrever "  Arquivos convertidos : $($Progresso.ok)" "Green"
Escrever "  Falhas               : $($Progresso.erro)" $(if ($Progresso.erro -gt 0) { "Red" } else { "Green" })
Escrever "  Total em $Alvo  : ${totalMB} MB" "White"

Escrever ""
Escrever "  PASTAS:" "Cyan"
Escrever "    imagens  -> $dirImg"
Escrever "    videos   -> $dirVideo"
if ($Frames) { Escrever "    frames   -> $dirFrames" }

Escrever ""
Escrever "  LISTA DE ARQUIVOS (para conferir antes de colar no config.js):" "Cyan"
Get-ChildItem $dirImg -File -ErrorAction SilentlyContinue |
  Sort-Object Name | ForEach-Object {
    $kb = [math]::Round($_.Length / 1KB)
    Escrever ("    img/{0,-46} {1,6} KB" -f $_.Name, $kb) "DarkGray"
  }
Get-ChildItem $dirVideo -File -ErrorAction SilentlyContinue |
  Sort-Object Name | ForEach-Object {
    $mb = [math]::Round($_.Length / 1MB, 2)
    Escrever ("    video/{0,-44} {1,6} MB" -f $_.Name, $mb) "DarkGray"
  }

Escrever ""
Escrever "  ATENCAO: use a versao -720p dos videos de demonstracao no config.js" "Yellow"
Escrever "  (mobile) e reserve a 1080p para a VSL e telas grandes." "Yellow"
Escrever ""
