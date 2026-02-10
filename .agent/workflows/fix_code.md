---
description: Formal process for fixing code issues with production-grade rigor.
---

# Antigravity Workflow: Fix Code Protocol

This workflow implements the `production_engineering` skill for resolving code issues.

## Phase 1: Analysis & Reproduction

1. **Analyze Failure**: Read the error message (e.g., `TypeError`, `Module Not Found`).
2. **Locate Source**: Use `grep` or file search (`view_file`) to pinpoint the line.
3. **Check Dependencies**: verifying if `package.json` contains required dependencies (e.g., `dotenv` for environment).

## Phase 2: Plan & Execute

1. **Plan Fix**: Determine the root cause (e.g., initialization order).
2. **Apply Fix**: Edit the file using `replace_file_content`.
3. **Lint Check**: Run `npm run lint` (or check IDE feedback).
4. **Format Check**: Run `npm run format`.

## Phase 3: Verification

1. **Runtime Check**: Run the entry point (e.g., `node src/index.js`) to verify the fix works.
2. **Test Check**: Run `npm test` to ensure no regressions.
3. **Reproduction Check**: If the issue was specific, run the reproduction script.

## Phase 4: Commit

1. **Stage**: `git add .`
2. **Commit**: `git commit -m "fix(component): detailed description of fix"`
3. **Push**: `git push origin <branch>`

**Success Criteria:**

* Zero lint errors.
* Zero runtime crashes.
* Zero regression in tests.
