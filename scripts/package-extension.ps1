$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "apps\extension\dist"
$manifestPath = Join-Path $dist "manifest.json"
$releaseDir = Join-Path $root "release"
$zipPath = Join-Path $releaseDir "bluedev-marketplace-keyword-radar-cws-0.1.0.zip"

if (!(Test-Path -LiteralPath $manifestPath)) {
  throw "Extension manifest was not found. Run pnpm --filter @bluedev/extension build first."
}

$manifestText = Get-Content -LiteralPath $manifestPath -Raw
$manifest = $manifestText | ConvertFrom-Json

$allowedHostMatches = @(
  "https://amazon.com.tr/*",
  "https://www.amazon.com.tr/*",
  "https://trendyol.com/*",
  "https://www.trendyol.com/*",
  "https://n11.com/*",
  "https://www.n11.com/*",
  "https://hepsiburada.com/*",
  "https://www.hepsiburada.com/*"
)

$forbiddenFragments = @(
  "https://www.amazon.com/*",
  "https://www.amazon.co.uk/*",
  "https://www.amazon.de/*",
  "https://www.amazon.fr/*",
  "https://www.amazon.it/*",
  "https://www.amazon.es/*",
  "alibaba",
  "aliexpress",
  "ebay",
  "etsy",
  "temu",
  "walmart",
  "localhost",
  "127.0.0.1",
  "<all_urls>"
)

foreach ($fragment in $forbiddenFragments) {
  if ($manifestText.Contains($fragment)) {
    throw "Forbidden CWS manifest fragment found: $fragment"
  }
}

foreach ($hostPermission in $manifest.host_permissions) {
  if ($allowedHostMatches -notcontains $hostPermission) {
    throw "Unexpected host permission found: $hostPermission"
  }
}

foreach ($contentScript in $manifest.content_scripts) {
  foreach ($match in $contentScript.matches) {
    if ($allowedHostMatches -notcontains $match) {
      throw "Unexpected content script match found: $match"
    }
  }
}

foreach ($resource in $manifest.web_accessible_resources) {
  foreach ($match in $resource.matches) {
    if ($allowedHostMatches -notcontains $match) {
      throw "Unexpected web accessible resource match found: $match"
    }
  }
}

if (!(Test-Path -LiteralPath $releaseDir)) {
  New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $dist "*") -DestinationPath $zipPath -Force

Write-Host "Created $zipPath"
