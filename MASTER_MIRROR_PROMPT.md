# Master Repo Mirror Prompt

You are a senior migration engineer. Execute a strict repo mirror migration with one approved exception.

## Variables (edit these first)
- SOURCE_REPO_URL: https://github.com/sayurihanki/jenhankib2bapple.git
- TARGET_REPO_URL: https://github.com/sayurihanki/jenhankib2bbodea.git
- SOURCE_REPO_NAME: jenhankib2bapple
- TARGET_REPO_NAME: jenhankib2bbodea
- GITHUB_OWNER: sayurihanki
- DA_REMAP_FROM: content.da.live/sayurihanki/jenhankib2bapple
- DA_REMAP_TO: content.da.live/sayurihanki/jenhankib2bbodea
- WORK_ROOT: /tmp/repo-mirror-work
- TARGET_BRANCH_NAME: codex/mirror-apple-into-bodea

## Goal
Make TARGET_REPO an exact code/config mirror of SOURCE_REPO, except rewrite DA.live references from DA_REMAP_FROM to DA_REMAP_TO.

## Hard constraints
1. Mirror mode is strict: add missing files, replace changed files, delete TARGET-only files.
2. Only exception to exact mirror is DA remap in:
- fstab.yaml
- blocks-library-cleaned.csv (if present)
3. Do not modify history. Do all work on TARGET_BRANCH_NAME.
4. Produce machine-verifiable evidence after each phase.

## Required execution phases
1. Clone both repos into WORK_ROOT and capture source SHA.
2. Create/switch target branch TARGET_BRANCH_NAME.
3. Preflight inventory:
- git status --short --branch
- file counts
- rsync dry-run summary
- add/update/delete counts
4. Apply strict mirror:
- rsync -a --delete --exclude='.git/' SOURCE->TARGET
5. Apply DA remap:
- replace DA_REMAP_FROM -> DA_REMAP_TO in fstab.yaml and blocks-library-cleaned.csv (if exists)
6. Consistency checks:
- rg for SOURCE_REPO_NAME in target (must be zero unintended matches)
- verify fstab mount points to DA_REMAP_TO
- verify blocks-library-cleaned.csv uses DA_REMAP_TO
7. Build/test checks:
- npm ci
- npm run lint
- npm test (if missing script, report explicitly)
- npm run test:integration (if missing script, report explicitly)
8. Parity check:
- create expected baseline = SOURCE + same DA remap
- rsync dry-run expected->target must show no content diffs (timestamps acceptable)
9. Commit strategy:
- Commit 1: chore: mirror {SOURCE_REPO_NAME} into {TARGET_REPO_NAME}
- Commit 2: chore: remap DA content and block-library URLs to {TARGET_REPO_NAME}
10. Final report:
- source SHA
- exact file operation counts
- list of all modified/deleted/added top-level areas
- test results
- residual risks
- next action command to push branch and open PR

## Command requirements
Use shell commands directly. Prefer:
- rg for search
- rsync for mirror/parity
- git non-interactive commands only

## Output format
Return:
1. “Execution Log” (phase-by-phase, commands run, outcomes)
2. “Verification Matrix” (pass/fail for each required check)
3. “Commit Summary”
4. “PR Description Draft” including:
- source SHA
- strict mirror + DA exception statement
- evidence summary
