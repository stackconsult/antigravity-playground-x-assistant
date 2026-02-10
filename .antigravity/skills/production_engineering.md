---
name: Production Engineering Standards (Fix Code Skill)
description: A formalized skill for fixing code issues with production-grade rigor.
version: 1.0.0
---

# Production Engineering Standards: Code Fix Protocol

This skill details the exact procedure an Antigravity Agent must follow when resolving code issues, bugs, or lint errors.

**Goal:** Zero-regression fixes with verified stability.

## Phase 1: Introspection & Analysis (Before Editing)

1. **Analyze the Failure**:
    * Read the exact error message (e.g., exit code 1, `TypeError`, etc.).
    * Identify the root cause (e.g., initialization order, missing dependency, typo).
    * *Do not guess.* If the error is ambiguous, add logging and re-run.

2. **Verify State**:
    * Is `package.json` accurate? Do I need a new dependency (e.g., `dotenv`)?
    * Are lint rules being violated? (Check `eslint.config.js`).
    * What side effects might this fix have?

## Phase 2: The Fix Strategy (Planning)

1. **Dependency Check**:
    * If adding a library (e.g., `dotenv`), **check package.json first**.
    * If missing, **install it** using `npm install <package>`.
    * *Never* require a package that isn't in `package.json`.

2. **Code implementation**:
    * Write the fix.
    * **Lint Check**: Run `npm run lint` or check for IDE feedback immediately after editing.
    * **Format**: Run `npm run format` to ensure style compliance.

3. **Order of Operations**:
    * For Classes/Kernels: Ensure properties (`this.plugins = []`) are initialized *before* usage.
    * For Configs: Ensure Environment Variables are loaded *before* config usage.

## Phase 3: Verification (The "Double-Check")

1. **Runtime Verification**:
    * Run the code: `node src/index.js` (or relevant entry point).
    * **Do not assume it works.** You must see a success message (e.g., `[KERNEL] System Online`).

2. **Test Verification**:
    * Run `npm test`.
    * If no test covers the fix, **create a reproduction script** (e.g., `tests/repro_issue.js`) and verify it passes.

## Phase 4: Comitting

1. **Stage**: `git add .`
2. **Commit**: `git commit -m "fix(scope): <clear description of fix>"`
3. **Push**: `git push origin <branch>`

## Example Scenario: Fixing a Kernel Crash

* **Error**: `TypeError: Cannot read properties of undefined (reading 'push')`
* **Analysis**: `this.plugins` is used before definition.
* **Fix**: Move `this.plugins = []` to top of constructor.
* **Verify**: Run `node src/index.js` -> Success.
* **Commit**: `fix(kernel): initialize plugins array before usage`.
