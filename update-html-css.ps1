$cssLinksToAdd = @"
    <!-- UiTM Design System -->
    <link rel="stylesheet" href="../assets/css/uitm-glassmorphism.css">
    <link rel="stylesheet" href="../assets/css/uitm-animations.css">
    <link rel="stylesheet" href="../assets/css/role-based-styles.css">
    <link rel="stylesheet" href="../assets/css/icon-enhancements.css">
"@

# Files in pages directory that need updating
$files = @(
    "pages\profile.html",
    "pages\chat.html",
    "pages\book-details.html",
    "pages\payment.html",
    "pages\receipt.html",
    "pages\feedback.html",
    "pages\login.html",
    "pages\signup.html",
    "pages\verify-email.html",
    "launch.html"
)

foreach ($file in $files) {
    Write-Host "Processing $file..." -ForegroundColor Cyan
    
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Find the position to insert (before Font Awesome link)
    $pattern = '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/'
    
    if ($content -match [regex]::Escape($pattern)) {
        # Insert our CSS links before FontAwesome
        $newContent = $content -replace [regex]::Escape($pattern), "$cssLinksToAdd`r`n$pattern"
        Set-Content -Path $file -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Updated $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Pattern not found in $file" -ForegroundColor Yellow
    }
}

Write-Host "`nAll files processed!" -ForegroundColor Green
