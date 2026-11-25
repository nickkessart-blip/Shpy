# Instructions for AI coding agents

This repository is an active game project. Before changing anything, read these files in order:

1. `README.md`
2. `docs/GIT_WORKFLOW.md` — branch topology, PR policy, CI and deployment boundaries.
3. `docs/GAME_BIBLE.md` — canonical game intent; do not silently change canon.
4. `docs/DECISIONS.md` — accepted decisions and constraints.
5. `docs/ROADMAP.md` — current priorities and deferred work.
6. `docs/TECHNICAL_ARCHITECTURE.md`, `docs/GAME_DESIGN.md`, `docs/COMBAT_SPEC.md`, `docs/CAMPAIGN_AND_LOCATIONS.md`, `docs/AUTOMATION_DESIGN.md`, `docs/UI_UX_SPEC.md` and `docs/MVP_SCOPE.md` as relevant to the task.
7. `.ai/skills/README.md`, then every skill relevant to the task.
8. `docs/ASSET_CATALOG.md`, `docs/ASSET_RESEARCH.md`, and `src/assets/README.md` before asset work.

## Image generation and existing assets

- **Never generate or edit images unless the user explicitly asks for image creation/editing in the current request.** A general request to improve game visuals, integrate art or continue development is not permission to generate images.
- Before searching for visual assets, inspect existing repository assets, current conversation attachments and the user's Library for prepared originals, crops and atlases. Prefer already approved/prepared files.
- Do not ask the user to upload an asset that is already available in the repository, conversation or Library. Do not replace a prepared asset with a newly generated one without explicit instruction.
- Record provenance and integration state of every reused asset. A Library/conversation copy is not a repository/runtime integration.

## Mandatory repository workflow

- Work directly on the active GitHub branch. Do not ask the user to connect Git, push, commit, create a PR, upload routine files or perform other routine repository operations.
- Finish the actual requested deliverable first. Do not substitute documentation-only commits for a blocked code/asset integration and then report the task as complete.
- After changing code, commit code, tests, assets and relevant documentation in the same work session. Update the active PR description and this handoff after each coherent task.
- Read the existing implementation before editing. Preserve working behaviour and avoid broad rewrites for narrow tasks.
- Keep desktop, mobile and web as targets of one shared game codebase. Do not create long-lived platform branches. Platform differences belong in responsive layouts, input adapters and runtime capability checks.
- Follow `docs/GIT_WORKFLOW.md`: normally use one active feature branch and one PR targeting `main`. Stack PRs only for genuine parallel work and document the dependency chain and merge order.
- A PR being marked Draft is not, by itself, a reason to stop work. Do not ask the user for permission for routine Git operations. When the user asks to finish/release/merge a change, mark the PR ready and merge after required checks pass and dependencies are satisfied. Do not silently bypass a failed required check or claim a check passed when it did not.
- If a check does not run because of workflow configuration, fix the workflow. Do not leave the PR in Draft indefinitely as a substitute for diagnosis.
- Never claim a feature, test, CI run, Android check, or asset integration is complete without evidence.
- If GitHub connector and local file tools cannot exchange binary bytes, inspect every available transfer route once, record the exact boundary, and use the documented fallback. Do not repeatedly retry an impossible text-only route.
- Update relevant docs, roadmap checkboxes, asset catalog, release notes and decision log when implementation status or project rules change.

## Art and asset pipeline

- Inspect every generated/reference sheet visually before slicing. Never assume a regular grid unless guides and cell bounds are verified.
- Keep transparent alpha. Remove stray panels and marks; do not use hard matte backgrounds.
- Every animation frame for one actor must share canvas dimensions, baseline, pivot and character scale. Do not independently crop poses.
- Record frame dimensions, row/column mapping, animation timing, source, license and integration state in docs.
- A prepared asset is not runtime-integrated until it is committed, registered, loaded, referenced by gameplay code and validated.
- Prefer SVG for scalable UI ornaments; render dynamic values (health, ammo, cooldowns, counters) from game state, not baked into images.
- Preserve third-party licenses and distinguish generated/original assets from external packs.

## Testing and reporting

- Run the narrowest relevant tests first, then typecheck, lint, tests and production build when tools permit.
- CI must run for every PR target branch and independently per PR/ref. Publishing is allowed only after a successful push to `main`.
- For visual animation, verify equal frame bounds, stable baseline and no pose popping. For mobile, include a real-device test checklist.
- End each task with: changed files, commit/branch/PR, checks actually run, known limitations and next concrete step.


## Draft PR is not a hard stop
A Draft label is a review-status signal, not a permanent prohibition. When the user explicitly instructs the agent to merge/integrate/release, that instruction authorizes converting the relevant PR from Draft to Ready for review and proceeding once required checks pass and dependencies are integrated. Do not ask the user again for the same authorization. Without an explicit integration instruction, leave the PR unmerged.
