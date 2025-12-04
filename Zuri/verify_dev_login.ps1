$uri='http://localhost:5000'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ username='devtester'; role='Administrator' } | ConvertTo-Json

try {
  $login = Invoke-RestMethod -Uri "$uri/api/auth/dev-login" -Method Post -Body $body -ContentType 'application/json' -WebSession $session -ErrorAction Stop
  $login | ConvertTo-Json -Depth 5 | Out-File tmp_devlogin_response.json -Encoding utf8
  Write-Host "DEV-LOGIN-SUCCESS"
} catch {
  Write-Host "DEV-LOGIN-ERROR"
  $_ | Out-File tmp_devlogin_error.txt -Encoding utf8
}

try {
  $me = Invoke-RestMethod -Uri "$uri/me" -Method Get -WebSession $session -ErrorAction Stop
  $me | ConvertTo-Json -Depth 5 | Out-File tmp_me_response.json -Encoding utf8
  Write-Host "ME-SUCCESS-/me"
} catch {
  Write-Host "ME-ERROR-/me, trying /api/me"
  try {
    $me = Invoke-RestMethod -Uri "$uri/api/me" -Method Get -WebSession $session -ErrorAction Stop
    $me | ConvertTo-Json -Depth 5 | Out-File tmp_me_response.json -Encoding utf8
    Write-Host "ME-SUCCESS-/api/me"
  } catch {
    Write-Host "ME-ERROR-/api/me"
    $_ | Out-File tmp_me_error.txt -Encoding utf8
  }
}

Write-Host "DONE"
