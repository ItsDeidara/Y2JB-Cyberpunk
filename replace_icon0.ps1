param(
    [string]$ThemeFolder,
    [string]$SourceImage
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

if (-not $ThemeFolder) {
    $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $folderDialog.Description = 'Select the Y2JB theme/update folder that contains icon0.png'
    $folderDialog.ShowNewFolderButton = $false

    if ($folderDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host 'No folder selected. Aborted.'
        exit 1
    }

    $ThemeFolder = $folderDialog.SelectedPath
}

$themeFolder = [System.IO.Path]::GetFullPath($ThemeFolder)
$target = Join-Path $themeFolder 'icon0.png'

if (-not (Test-Path -LiteralPath $target)) {
    [System.Windows.Forms.MessageBox]::Show(
        'The selected folder does not contain icon0.png.',
        'Y2JB Icon Replacer',
        'OK',
        'Error'
    ) | Out-Null
    throw 'Missing icon0.png'
}

if (-not $SourceImage) {
    $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $fileDialog.Title = 'Select replacement icon image'
    $fileDialog.Filter = 'Image files (*.png;*.jpg;*.jpeg)|*.png;*.jpg;*.jpeg|PNG (*.png)|*.png|JPEG (*.jpg;*.jpeg)|*.jpg;*.jpeg'
    $fileDialog.Multiselect = $false

    if ($fileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host 'No image selected. Aborted.'
        exit 1
    }

    $SourceImage = $fileDialog.FileName
}

$source = [System.IO.Path]::GetFullPath($SourceImage)
$old = [System.Drawing.Image]::FromFile($target)
try {
    $width = $old.Width
    $height = $old.Height
} finally {
    $old.Dispose()
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $themeFolder ('icon0.backup-' + $stamp + '.png')
Copy-Item -LiteralPath $target -Destination $backup -Force

$src = [System.Drawing.Image]::FromFile($source)
try {
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.DrawImage($src, 0, 0, $width, $height)
        } finally {
            $graphics.Dispose()
        }

        $tmp = Join-Path $themeFolder ('icon0.new-' + $stamp + '.png')
        $bitmap.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
        Move-Item -LiteralPath $tmp -Destination $target -Force
    } finally {
        $bitmap.Dispose()
    }
} finally {
    $src.Dispose()
}

$new = [System.Drawing.Image]::FromFile($target)
try {
    Write-Host ('Replaced icon0.png: ' + $new.Width + 'x' + $new.Height)
    Write-Host ('Backup: ' + $backup)
} finally {
    $new.Dispose()
}

[System.Windows.Forms.MessageBox]::Show(
    ('icon0.png replaced at ' + $width + 'x' + $height + '. Backup created: ' + $backup),
    'Y2JB Icon Replacer',
    'OK',
    'Information'
) | Out-Null
