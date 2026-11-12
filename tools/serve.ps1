# Tiny local web server for testing the showroom (no Node/Python needed).
# Usage:  powershell -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 5173]
param([int]$Port = 5173)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json'; '.md' = 'text/plain; charset=utf-8'
  '.glb' = 'model/gltf-binary'; '.gltf' = 'model/gltf+json'; '.bin' = 'application/octet-stream'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'
  '.ktx2' = 'image/ktx2'; '.mp4' = 'video/mp4'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.otf' = 'font/otf'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "X Bikes Showroom -> http://localhost:$Port/   (Ctrl+C or close this window to stop)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '' -or $rel.EndsWith('/')) { $rel += 'index.html' }
      $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
      if ($full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($full)
        $ext = [IO.Path]::GetExtension($full).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
      }
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
