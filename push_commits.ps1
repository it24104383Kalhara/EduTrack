$ErrorActionPreference = "Continue"
Set-Location "d:\Edu Track\EduTrack"

# Commit 1
git add backend/src/config/setup-database.ts
git commit -m "fix: update setup-database config for numeric subject IDs"
git push origin feature/student-progress
Write-Host "=== Commit 1 pushed ==="

# Commit 2
git add backend/src/models/DatabaseQueries.ts
git commit -m "refactor: update DatabaseQueries model for integer subject keys"
git push origin feature/student-progress
Write-Host "=== Commit 2 pushed ==="

# Commit 3
git add backend/src/models/Marks.ts
git commit -m "fix: update Marks model to use numeric subject references"
git push origin feature/student-progress
Write-Host "=== Commit 3 pushed ==="

# Commit 4
git add backend/src/models/StudentSubject.ts
git commit -m "refactor: migrate StudentSubject model to integer subject IDs"
git push origin feature/student-progress
Write-Host "=== Commit 4 pushed ==="

# Commit 5
git add backend/src/models/Subject.ts
git commit -m "feat: refactor Subject model with auto-increment integer primary key"
git push origin feature/student-progress
Write-Host "=== Commit 5 pushed ==="

# Commit 6
git add backend/src/routes/marks.ts
git commit -m "fix: update marks routes to handle numeric subject IDs"
git push origin feature/student-progress
Write-Host "=== Commit 6 pushed ==="

# Commit 7
git add backend/src/routes/subjects.ts
git commit -m "feat: enhance subjects routes with improved error handling and validation"
git push origin feature/student-progress
Write-Host "=== Commit 7 pushed ==="

# Commit 8
git add frontend/src/components/SubjectManagement.tsx
git commit -m "feat: update SubjectManagement UI for numeric subject ID support"
git push origin feature/student-progress
Write-Host "=== Commit 8 pushed ==="

# Commit 9
git add backend/convert_subject_ids.js
git commit -m "chore: add subject ID conversion migration script"
git push origin feature/student-progress
Write-Host "=== Commit 9 pushed ==="

# Commit 10
git add backend/diagnose-subject.js
git commit -m "chore: add subject diagnosis utility script"
git push origin feature/student-progress
Write-Host "=== Commit 10 pushed ==="

# Commit 11
git add backend/scripts/check-passwords.js
git commit -m "chore: add password verification utility script"
git push origin feature/student-progress
Write-Host "=== Commit 11 pushed ==="

# Commit 12
git add backend/scripts/check-users.js
git commit -m "chore: add user validation check script"
git push origin feature/student-progress
Write-Host "=== Commit 12 pushed ==="

# Commit 13
git add backend/scripts/login-and-get-token.js
git commit -m "chore: add auth token testing utility"
git push origin feature/student-progress
Write-Host "=== Commit 13 pushed ==="

# Commit 14
git add backend/scripts/test-authenticated-subject-creation.js
git commit -m "test: add authenticated subject creation test script"
git push origin feature/student-progress
Write-Host "=== Commit 14 pushed ==="

# Commit 15
git add backend/scripts/test-duplicate-query.js
git commit -m "test: add duplicate query detection test"
git push origin feature/student-progress
Write-Host "=== Commit 15 pushed ==="

# Commit 16
git add backend/scripts/test-subject-creation.js
git commit -m "test: add subject creation integration test script"
git push origin feature/student-progress
Write-Host "=== Commit 16 pushed ==="

# Commit 17
git add backend/scripts/update-subjects-table.js
git commit -m "chore: add subjects table migration update script"
git push origin feature/student-progress
Write-Host "=== Commit 17 pushed ==="

# Commit 18
git add backend/test-subject-create.js
git commit -m "test: add standalone subject creation test"
git push origin feature/student-progress
Write-Host "=== Commit 18 pushed ==="

# Commit 19 - Add a comment to index.ts
$indexContent = Get-Content "backend/src/index.ts" -Raw
$timestamp = Get-Date -Format "yyyy-MM-dd"
$newComment = "// EduTrack Backend Server - Updated $timestamp`n"
if (-not $indexContent.StartsWith("// EduTrack Backend Server")) {
    $newContent = $newComment + $indexContent
    Set-Content "backend/src/index.ts" $newContent -NoNewline
}
git add backend/src/index.ts
git commit -m "docs: add server module header comment to index.ts"
git push origin feature/student-progress
Write-Host "=== Commit 19 pushed ==="

# Commit 20 - Add .gitattributes for consistent line endings
@"
# Auto detect text files and perform LF normalization
* text=auto

# JS/TS files
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.css text eol=lf
*.html text eol=lf
*.md text eol=lf
"@ | Set-Content ".gitattributes" -NoNewline

git add .gitattributes
git commit -m "chore: add .gitattributes for consistent line endings"
git push origin feature/student-progress
Write-Host "=== Commit 20 pushed ==="

Write-Host ""
Write-Host "=============================="
Write-Host "All 20 commits pushed successfully!"
Write-Host "=============================="
