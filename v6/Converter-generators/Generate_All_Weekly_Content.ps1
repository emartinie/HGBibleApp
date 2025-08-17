param(
    [switch]$Force  # Use -Force to overwrite without prompting
)

[Console]::OutputEncoding = [Text.UTF8Encoding]::new()

# === PATHS ===
$csvFile      = ".\week_data.csv"
$templateDocx = ".\Week 1- In the Beginning B'reisheet (בראשית).docx"
$templateHtml = ".\template.html"

$docsFolder   = ".\docs"
$htmlFolder   = ".\html"
$jsonFolder   = ".\data"

# Ensure folders exist
foreach ($f in @($docsFolder, $htmlFolder, $jsonFolder)) {
    if (-not (Test-Path $f)) { New-Item -ItemType Directory -Path $f | Out-Null }
}

# Load HTML template
$templateHtmlContent = Get-Content $templateHtml -Raw

# Import CSV
$rows = Import-Csv $csvFile

# === Helper Functions ===
function Confirm-Overwrite($filePath) {
    param([string]$filePath)

    if ($Force) { return $true }   # Skip prompt if -Force was used
    if (-not (Test-Path $filePath)) { return $true } # File doesn't exist → create it

    # Prompt user
    Write-Host "⚠️  File already exists: $filePath"
    $response = Read-Host "Overwrite? (Y = Yes / N = No / A = Yes to All)"
    
    switch ($response.ToUpper()) {
        "Y" { return $true }
        "A" { 
            Set-Variable -Scope Script -Name OverwriteAll -Value $true
            return $true
        }
        "N" { return $false }
        default { return (Confirm-Overwrite $filePath) } # Ask again if invalid input
    }
}

# JSON helper
function Parse-JsonField($field) {
    if ([string]::IsNullOrWhiteSpace($field)) { return @() }
    try { return $field | ConvertFrom-Json } catch { return @($field) }
}
function ArrayToList($items) {
    if (-not $items -or $items.Count -eq 0) { return "" }
    return "<ul>" + (($items | ForEach-Object { "<li>$_</li>" }) -join "") + "</ul>"
}

# === Word COM Automation ===
$word = New-Object -ComObject Word.Application
$word.Visible = $false
function Replace-WordText($find, $replace) {
    $selection = $word.Selection
    $selection.Find.ClearFormatting()
    $selection.Find.Text = $find
    $selection.Find.Replacement.ClearFormatting()
    $selection.Find.Replacement.Text = $replace
    $selection.Find.Execute(
        $find, $false, $false, $false, $false, $false,
        $true, 1, $false, $replace, 2
    ) | Out-Null
}

# === MAIN PROCESS ===
foreach ($row in $rows) {
    $weekNum   = [int]$row.Week
    $weekTitle = "Week $weekNum- $($row.English) $($row.Translit) ($($row.Hebrew))"

    # Parse arrays
    $audioPlaylist   = Parse-JsonField $row.AudioPlaylist
    $chapterOutlines = Parse-JsonField $row.ChapterOutlines
    $kidsVideos      = Parse-JsonField $row.KidsVideos
    $psalmsPlan      = Parse-JsonField $row.PsalmsPlan

    # ===================== 1️⃣ DOCX =====================
    $targetDoc = Join-Path $docsFolder "$weekTitle.docx"
    if (-not $OverwriteAll -and -not (Confirm-Overwrite $targetDoc)) {
        Write-Host "⏭ Skipped DOCX for $weekTitle"
    } else {
        Copy-Item $templateDocx $targetDoc -Force
        $doc = $word.Documents.Open($targetDoc)

        $placeholders = @{
            "{{title}}"             = $weekTitle
            "{{theme_text}}"        = $row.ThemeVerseText
            "{{theme_ref}}"         = $row.ThemeVerseRef
            "{{intro_summary}}"     = $row.IntroSummary
            "{{intro_instructions}}"= $row.IntroInstructions
            "{{commentary_quote}}"  = $row.CommentaryQuote
            "{{commentary_content}}"= $row.CommentaryContent
            "{{deeper_learning}}"   = $row.DeeperLearning
            "{{aleph_tav}}"         = $row.AlephTav
            "{{kids_pdf}}"          = $row.KidsPDF
            "{{lang_hebrew}}"       = if ($row.LanguageHebrewWord) { "$($row.LanguageHebrewWord) ($($row.LanguageHebrewText)) - $($row.LanguageHebrewMeaning)" } else { "" }
            "{{lang_greek}}"        = if ($row.LanguageGreekWord) { "$($row.LanguageGreekWord) ($($row.LanguageGreekText)) - $($row.LanguageGreekMeaning)" } else { "" }
            "{{lang_audio}}"        = $row.LanguageAudio
            "{{psalms_plan}}"       = if ($psalmsPlan) { ($psalmsPlan | ForEach-Object { "$($_.day): $_.audio" }) -join "; " } else { "" }
        }
        foreach ($p in $placeholders.Keys) { Replace-WordText $p $placeholders[$p] }

        $doc.Save()
        $doc.Close()
        Write-Host "📄 DOCX created: $targetDoc"
    }

    # ===================== 2️⃣ JSON =====================
    $jsonFile = Join-Path $jsonFolder "$weekTitle.json"
    if (-not $OverwriteAll -and -not (Confirm-Overwrite $jsonFile)) {
        Write-Host "⏭ Skipped JSON for $weekTitle"
    } else {
        $jsonObj = @{
            week   = $weekNum
            title  = "$($row.English) $($row.Translit) ($($row.Hebrew))"
            theme_verse = @{
                text      = $row.ThemeVerseText
                reference = $row.ThemeVerseRef
            }
            intro = @{
                summary      = $row.IntroSummary
                instructions = $row.IntroInstructions
            }
            sections = @{}
        }
        if ($audioPlaylist) { $jsonObj.sections.audio_playlist = $audioPlaylist }
        if ($chapterOutlines) { $jsonObj.sections.chapter_outlines = $chapterOutlines }
        if ($row.CommentaryQuote -or $row.CommentaryContent) {
            $jsonObj.sections.commentary = @{
                quote   = $row.CommentaryQuote
                content = $row.CommentaryContent
            }
        }
        if ($row.DeeperLearning) { $jsonObj.sections.deeper_learning = $row.DeeperLearning }
        if ($row.AlephTav) { $jsonObj.sections.aleph_tav = $row.AlephTav }
        if ($kidsVideos -or $row.KidsPDF) {
            $jsonObj.sections.kids_study = @{
                videos = $kidsVideos
                pdf    = $row.KidsPDF
            }
        }
        if ($row.LanguageHebrewWord -or $row.LanguageGreekWord) {
            $jsonObj.sections.language_learning = @{
                hebrew = @{
                    word    = $row.LanguageHebrewWord
                    text    = $row.LanguageHebrewText
                    meaning = $row.LanguageHebrewMeaning
                }
                greek = @{
                    word    = $row.LanguageGreekWord
                    text    = $row.LanguageGreekText
                    meaning = $row.LanguageGreekMeaning
                }
                audio = $row.LanguageAudio
            }
        }
        if ($psalmsPlan) { $jsonObj.sections.psalms_plan = $psalmsPlan }

        $jsonObj | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 $jsonFile
        Write-Host "🗂 JSON created: $jsonFile"
    }

    # ===================== 3️⃣ HTML =====================
    $htmlFile = Join-Path $htmlFolder "$weekTitle.html"
    if (-not $OverwriteAll -and -not (Confirm-Overwrite $htmlFile)) {
        Write-Host "⏭ Skipped HTML for $weekTitle"
    } else {
        $html = $templateHtmlContent
        foreach ($p in $placeholders.Keys) {
            $html = $html -replace [regex]::Escape($p), [regex]::Escape($placeholders[$p])
        }

        # Insert lists conditionally
        $html = $html -replace "{{audio_playlist}}", (if ($audioPlaylist) { ArrayToList ($audioPlaylist | ForEach-Object { "$($_.label) - $_.src" }) } else { "" })
        $html = $html -replace "{{kids_videos}}", (if ($kidsVideos) { ArrayToList $kidsVideos } else { "" })
        $html = $html -replace "{{psalms_plan}}", (if ($psalmsPlan) { ArrayToList ($psalmsPlan | ForEach-Object { "$($_.day) - $_.audio" }) } else { "" })

        $html | Out-File -Encoding UTF8 $htmlFile
        Write-Host "🌐 HTML created: $htmlFile"
    }
}

$word.Quit()
Write-Host "`n✅ All weekly files generated successfully (Safe Mode active unless -Force is used)!"
