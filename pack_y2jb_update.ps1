param(
    [string]$Source,
    [string]$Destination
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not $Destination) {
    $Destination = Join-Path $PSScriptRoot 'y2jb_update.zip'
}

if (-not $Source) {
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Select the folder whose CONTENTS should be packed as y2jb_update.zip'
    $dialog.ShowNewFolderButton = $false

    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host 'No folder selected. Aborted.'
        exit 1
    }

    $Source = $dialog.SelectedPath
}

$sourceRoot = [System.IO.Path]::GetFullPath($Source)
$dest = [System.IO.Path]::GetFullPath($Destination)
$scriptPath = [System.IO.Path]::GetFullPath($PSCommandPath)
$backup = $null

$skipNames = @(
    'y2jb_update.zip',
    'pack_y2jb_update.bat',
    'pack_y2jb_update.ps1',
    'replace_icon0.bat',
    'replace_icon0.ps1',
    'ARCHITECTURE.md',
    'update-info.txt',
    'cybercore.css',
    'cybercore.ps5.css'
)
$skipDirs = @('y2Preview', '.git', '.github')

if (
    -not (Test-Path -LiteralPath (Join-Path $sourceRoot 'splash.html')) -or
    -not (Test-Path -LiteralPath (Join-Path $sourceRoot 'main.js'))
) {
    $answer = [System.Windows.Forms.MessageBox]::Show(
        'The selected folder does not contain splash.html and main.js. Pack it anyway?',
        'Y2JB Update Packager',
        'YesNo',
        'Warning'
    )

    if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) {
        Write-Host 'Aborted.'
        exit 1
    }
}

if (Test-Path -LiteralPath $dest) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backup = Join-Path ([System.IO.Path]::GetDirectoryName($dest)) ('y2jb_update.backup-' + $stamp + '.zip')
    Move-Item -LiteralPath $dest -Destination $backup -Force
    Write-Host ('Existing y2jb_update.zip backed up to ' + $backup)
}

$items = New-Object System.Collections.Generic.List[object]

Get-ChildItem -LiteralPath $sourceRoot -Recurse -File | ForEach-Object {
    $file = [System.IO.Path]::GetFullPath($_.FullName)
    $name = [System.IO.Path]::GetFileName($file)

    if ($file -ieq $dest -or $file -ieq $scriptPath) {
        return
    }

    if ($backup -and $file -ieq ([System.IO.Path]::GetFullPath($backup))) {
        return
    }

    if ($skipNames -contains $name) {
        return
    }

    if ($name -like 'icon0.backup-*.png') {
        return
    }

    $relativePath = $file.Substring($sourceRoot.Length).TrimStart('\', '/')
    $parts = $relativePath -split '[\\/]'
    if (($parts | Where-Object { $skipDirs -contains $_ }).Count -gt 0) {
        return
    }

    $relative = $relativePath.Replace('\', '/')
    $items.Add([pscustomobject]@{
        FullName = $file
        Relative = $relative
        Length = $_.Length
    }) | Out-Null
}

$manifest = ($items | Sort-Object Relative | ForEach-Object { $_.Relative + '|' + $_.Length }) -join "`n"

$tmp = $dest + '.tmp'
if (Test-Path -LiteralPath $tmp) {
    Remove-Item -LiteralPath $tmp -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($tmp, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($item in $items) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip,
            $item.FullName,
            $item.Relative,
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }

    $entry = $zip.CreateEntry('update-info.txt', [System.IO.Compression.CompressionLevel]::Optimal)
    $stream = $entry.Open()
    try {
        $writer = New-Object System.IO.StreamWriter($stream, [System.Text.UTF8Encoding]::new($false))
        $writer.Write($manifest)
        $writer.Flush()
    } finally {
        if ($writer) {
            $writer.Dispose()
        } else {
            $stream.Dispose()
        }
    }
} finally {
    $zip.Dispose()
}

Move-Item -LiteralPath $tmp -Destination $dest -Force

$reader = [System.IO.Compression.ZipFile]::OpenRead($dest)
try {
    $entries = @{}
    foreach ($entry in $reader.Entries) {
        $entries[$entry.FullName] = $entry.Length
    }

    $manifestEntry = $reader.GetEntry('update-info.txt')
    if (-not $manifestEntry) {
        throw 'Missing update-info.txt'
    }

    $stream = $manifestEntry.Open()
    try {
        $manifestReader = New-Object System.IO.StreamReader($stream, [System.Text.UTF8Encoding]::new($false))
        $lines = ($manifestReader.ReadToEnd() -split "`n") | Where-Object { $_.Trim().Length -gt 0 }
    } finally {
        if ($manifestReader) {
            $manifestReader.Dispose()
        } else {
            $stream.Dispose()
        }
    }

    foreach ($line in $lines) {
        $parts = $line.Split('|')
        if ($parts.Count -ne 2 -or -not $entries.ContainsKey($parts[0]) -or [int64]$parts[1] -ne [int64]$entries[$parts[0]]) {
            throw ('Manifest mismatch: ' + $line)
        }
    }

    Write-Host ('Packed ' + $entries.Count + ' entries into ' + $dest)
    Write-Host ('Generated update-info.txt with ' + $lines.Count + ' file entries.')
    Write-Host 'Manifest OK.'
} finally {
    $reader.Dispose()
}
