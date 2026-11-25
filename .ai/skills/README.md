# SHPY agent skills

These project-specific skills are mandatory context for AI agents. Read the skill matching the task before editing. If a skill conflicts with `AGENTS.md`, follow `AGENTS.md` and document the conflict.

| Skill | Read when |
|---|---|
| [gameplay-engineering](gameplay-engineering/SKILL.md) | Phaser scenes, controls, combat, enemies, progression, saves |
| [asset-pipeline](asset-pipeline/SKILL.md) | UI, HUD, sprites, atlases, generated/reference images, audio |
| [release-and-validation](release-and-validation/SKILL.md) | tests, CI, PRs, deployment, build/release status |

## Image generation rule

Do not generate or edit images unless the user explicitly requests image creation/editing in the current request. For visual development tasks, first search existing repository assets, conversation attachments and the user's Library, including previously sliced exports. Reuse and integrate those materials; do not invent a new image-generation step.

## Required prompts

Use the following task prompt as the default operating instruction:

> You are continuing an existing SHPY codebase, not starting a new project. Read AGENTS.md, docs/GIT_WORKFLOW.md, this skills index, the relevant skill files, GAME_BIBLE, DECISIONS, ROADMAP, MVP_SCOPE and the relevant GAME_DESIGN, COMBAT_SPEC, CAMPAIGN_AND_LOCATIONS, AUTOMATION_DESIGN, UI_UX_SPEC and TECHNICAL_ARCHITECTURE docs. Inspect the current GitHub topology and latest branch/PR state before editing. Preserve working systems. Make the requested deliverable, not just supporting documentation; add/update tests, assets and docs; commit completed changes directly to the active GitHub feature branch and update its PR description. Never ask the user to connect Git or manually perform routine repository operations. A Draft label is not a blocker. When the user asks for release/merge, complete the checks and merge in dependency order. Never claim validation that was not run. Record exact blockers and next steps so another agent can continue without rediscovery.

## Handoff rule

Every completed task must leave a durable handoff in the repository. The next agent must be able to identify the active branch, latest commit, PR, branch dependencies, changed systems, test evidence, remaining limitations and next task without asking the user or guessing.


### Draft PR handling
Treat Draft as review status, not an absolute prohibition. A direct user instruction to merge/integrate/release authorizes marking the PR ready and merging after required checks and dependency order are satisfied. Never ask the user to repeat that authorization.
