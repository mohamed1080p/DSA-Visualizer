try {
    Write-Output "== Begin Workspace Checks =="

    # Readiness
    try {
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5258/health/ready' -UseBasicParsing -Method GET -ErrorAction Stop
        Write-Output "HEALTH_READY_STATUS:$($r.StatusCode)"
        Write-Output $r.Content
    } catch {
        Write-Output "HEALTH_READY_ERROR: $($_.Exception.Message)"
    }

    # SignalR negotiate
    try {
        $n = Invoke-WebRequest -Uri 'http://127.0.0.1:5258/hubs/community/negotiate' -UseBasicParsing -Method POST -ErrorAction Stop
        Write-Output "NEGOTIATE_STATUS:$($n.StatusCode)"
        Write-Output $n.Content
    } catch {
        Write-Output "NEGOTIATE_ERROR: $($_.Exception.Message)"
    }

    # Login
    try {
        $loginBody = @{ Email = 'copilot-test@example.com'; Password = 'P@ssw0rd123!' } | ConvertTo-Json
        $login = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5258/api/Auth/login' -ContentType 'application/json' -Body $loginBody -ErrorAction Stop
        Write-Output "LOGIN_OK"
        Write-Output ('ACCESS_TOKEN:' + $login.AccessToken)
        $token = $login.AccessToken
    } catch {
        Write-Output "LOGIN_ERROR: $($_.Exception.Message)"
        exit 1
    }

    # Chatbot request
    try {
        $chatBody = @{ Messages = @( @{ Role = 'User'; Content = 'Explain Dijkstra in 3 concise bullet points.' } ) } | ConvertTo-Json -Depth 5
        $resp = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5258/api/Chatbot/message' -ContentType 'application/json' -Body $chatBody -Headers @{ Authorization = ('Bearer ' + $token) } -ErrorAction Stop
        Write-Output "CHAT_RESPONSE:"
        $resp | ConvertTo-Json -Depth 5 | Write-Output
    } catch {
        Write-Output "CHAT_ERROR: $($_.Exception.Message)"
    }

    Write-Output "== End Workspace Checks =="
} catch {
    Write-Output "SCRIPT_ERROR: $($_.Exception.Message)"
    exit 2
}