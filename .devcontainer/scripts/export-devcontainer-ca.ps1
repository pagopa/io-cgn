param(
    [string]$OutputDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) "certs"),
    [string[]]$ProbeUrls = @(
        "https://github.com/",
        "https://ghcr.io/",
        "https://pypi.org/simple/"
    )
)

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

function ConvertTo-Pem {
    param(
        [System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate
    )

    $base64 = [System.Convert]::ToBase64String($Certificate.RawData)
    $lines = $base64 -split '(.{1,64})' | Where-Object { $_ }
    return (@(
        "-----BEGIN CERTIFICATE-----"
        $lines
        "-----END CERTIFICATE-----"
        ""
    ) -join [Environment]::NewLine)
}

function Export-Certificate {
    param(
        [System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate,
        [string]$Source
    )

    if ($script:SeenThumbprints.ContainsKey($Certificate.Thumbprint)) {
        return
    }

    $script:SeenThumbprints[$Certificate.Thumbprint] = $true

    $filePath = Join-Path $OutputDirectory ("auto-{0}.crt" -f $Certificate.Thumbprint)
    $pem = ConvertTo-Pem -Certificate $Certificate
    Set-Content -Path $filePath -Value $pem -Encoding ascii

    Write-Host ("Exported {0} ({1}) from {2}" -f $Certificate.Subject, $Certificate.Thumbprint, $Source)
}

function Probe-CertificateChain {
    param(
        [string]$ProbeUrl
    )

    try {
        $request = [System.Net.HttpWebRequest]::Create($ProbeUrl)
        $request.Method = "HEAD"
        $request.AllowAutoRedirect = $true
        $request.Timeout = 15000
        $request.ReadWriteTimeout = 15000

        if ([System.Net.WebRequest]::DefaultWebProxy) {
            $request.Proxy = [System.Net.WebRequest]::DefaultWebProxy
            $request.Proxy.Credentials = [System.Net.CredentialCache]::DefaultCredentials
        }

        $response = $request.GetResponse()
        $response.Close()
    } catch {
        if (-not $request -or -not $request.ServicePoint -or -not $request.ServicePoint.Certificate) {
            Write-Warning ("Failed to probe {0}: {1}" -f $ProbeUrl, $_.Exception.Message)
            return
        }
    }

    if (-not $request.ServicePoint.Certificate) {
        Write-Warning ("No certificate was captured while probing {0}" -f $ProbeUrl)
        return
    }

    $leafCertificate = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 -ArgumentList $request.ServicePoint.Certificate
    $chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
    $chain.ChainPolicy.RevocationMode = [System.Security.Cryptography.X509Certificates.X509RevocationMode]::NoCheck
    [void]$chain.Build($leafCertificate)

    if ($chain.ChainElements.Count -le 1) {
        Write-Warning ("The TLS chain for {0} did not expose issuer certificates to export." -f $ProbeUrl)
        return
    }

    for ($index = 1; $index -lt $chain.ChainElements.Count; $index++) {
        $chainCertificate = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 -ArgumentList (,$chain.ChainElements[$index].Certificate.RawData)
        Export-Certificate -Certificate $chainCertificate -Source $ProbeUrl
    }
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
Get-ChildItem -Path $OutputDirectory -Filter "auto-*.crt" -File -ErrorAction SilentlyContinue | Remove-Item -Force

$script:SeenThumbprints = @{}

foreach ($probeUrl in $ProbeUrls) {
    Probe-CertificateChain -ProbeUrl $probeUrl
}

$exportedCount = (Get-ChildItem -Path $OutputDirectory -Filter "auto-*.crt" -File -ErrorAction SilentlyContinue | Measure-Object).Count

if ($exportedCount -eq 0) {
    Write-Warning "No issuer certificates were exported. If the DevContainer still fails with exit code 60, export the corporate root CA manually into .devcontainer/certs/."
    exit 0
}

Write-Host ("Exported {0} certificate file(s) into {1}" -f $exportedCount, $OutputDirectory)
