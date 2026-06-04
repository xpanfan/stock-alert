$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (Test-Path $bundledNode) {
  & $bundledNode (Join-Path $projectRoot "src\jobs\listWatchlist.js")
  exit $LASTEXITCODE
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($null -eq $nodeCommand) {
  Write-Error "Node.js is not installed. Please install Node.js LTS, then run this script again."
  exit 1
}

& node (Join-Path $projectRoot "src\jobs\listWatchlist.js")
exit $LASTEXITCODE
