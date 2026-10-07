param([string]$Voice = 'Microsoft Zira Desktop')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$narrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
$narrator.SelectVoice($Voice)
$narrator.Rate = 0
$narrator.Volume = 100
$outputDirectory = Join-Path $PSScriptRoot '../tmp/video'
$chapters = Get-ChildItem -LiteralPath $outputDirectory -Filter 'narration-*.txt' | Sort-Object Name
foreach ($chapter in $chapters) {
  $wavePath = Join-Path $outputDirectory ($chapter.BaseName + '.wav')
  $narrator.SetOutputToWaveFile($wavePath)
  $narrator.Speak((Get-Content -LiteralPath $chapter.FullName -Raw -Encoding utf8))
  $narrator.SetOutputToNull()
  Write-Output ('Created ' + $chapter.BaseName)
}
$narrator.Dispose()
