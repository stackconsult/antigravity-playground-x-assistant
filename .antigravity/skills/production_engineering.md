---
name: Production Engineering Standards (Fix Code Skill)
description: A formalized skill for fixing code issues with production-grade rigor.
version: 1.0.2
---

# Production Engineering Standards: Code Fix Protocol

This skill details the procedure an Antigravity Agent must follow when
resolving code issues, bugs, or lint errors.

**Goal:** Zero-regression fixes with verified stability.

## Phase 1: Introspection & Analysis (Before Editing)

1. **Analyze the Failure**:
    * Read the exact error message (e.g., exit code 1, `TypeError`, etc.).
    * Identify the root cause (initialization order, missing dep, etc.).
    * *Do not guess.* If the error is ambiguous, add logging and re-run.

2. **Verify State**:
    * Is `package.json` accurate? Do I need a new dependency?
    * Are lint rules being violated? (Check `eslint.config.js`).
    * What side effects might this fix have?

## Phase 2: The Fix Strategy (Planning)

1. **Dependency Check**:
    * If adding a library, **check package.json first**.
    * If missing, **install it** using `npm install <package>`.
    * *Never* require a package that isn't in `package.json`.

2. **Code implementation**:
    * Write the fix.
    * **Lint Check**: Run `npm run lint` or check for IDE feedback.
    * **Format**: Run `npm run format` immediately after editing.

3. **Order of Operations**:
    * **Initialization**: Ensure properties are initialized *before* usage.
    * **Environment**: Ensure Env Vars are loaded *before* config usage.
    * **Automatic Formatting**: Run `npm run format` (or equivalent)
        immediately after *any* file edit to ensure zero lint regressions.

## Phase 3: Verification (The "Double-Check")

1. **Runtime Verification**:
    * Run the code: `node src/index.js` (or relevant entry point).
    * **Do not assume it works.** You must see a success message.

2. **Test Verification**:
    * Run `npm test`.
    * If no test covers the fix, **create a reproduction script** and
        verify it passes.

## Phase 4: Comitting

1. **Stage**: `git add .`
2. **Commit**: `git commit -m "fix(scope): <clear description of fix>"`
3. **Push**: `git push origin <branch>`
