# SHPY — Git, branches, CI and release workflow

Last audited: 2026-11-25. This document exists to prevent branch and tooling friction from silently blocking delivery.

## Current facts

- Repository: `nickkessart-blip/Shpy`; default branch: `main`.
- Repository visibility is **public**. GitHub API reports the connected account has admin/push access.
- The branch listing reports `protected: false` for the listed branches; the repository rulesets endpoint returned an empty list. The connector could not read the classic branch-protection endpoint (403), so do not infer additional protection rules.
- GitHub Pages is enabled and publishes the Web build from `main`; `prototype-build` is a build-output branch, not a source-development branch.
- Public visibility exposes the source. It is a separate privacy/release-design issue, not the reason a binary asset could not be transferred to GitHub.

## Branch topology found during this audit

The current work is one shared game, not separate PC and Android projects:

- `main` — integration/default branch.
- `feature/shpy-0.9-hybrid-mobile-controls` — PR #15, based on `main`; 14 commits ahead, 10 changed files.
- `feature/shpy-0.9-visual-polish` — PR #16, based on the mobile-controls branch; 62 additional commits ahead, 22 changed files.

Therefore the actual chain is `main → mobile-controls → visual-polish`. PR #16 is a stacked/dependent PR, not a PC-only branch. The same Phaser/TypeScript scenes and assets serve desktop and mobile; mobile-specific controls and viewport behaviour are implemented inside the shared codebase.

This stack is not being developed in parallel: the visual branch depends on the mobile-controls branch. It requires parent-first integration and adds unnecessary release coordination for a single-agent workflow.

## CI problems found and corrected in this branch

Previous `.github/workflows/ci.yml` had three defects:

1. `pull_request.branches: [main]` meant PRs targeting a feature branch received no CI run. PR #16 targeted `feature/shpy-0.9-hybrid-mobile-controls`, and its head had no PR-triggered workflow run.
2. A constant concurrency group based on repository name cancelled any other in-progress SHPY CI run, even when it belonged to another branch/PR.
3. The build-publish step could run on a same-repository pull request and force-push its unmerged output to `prototype-build`.

The revised workflow in this branch:
- runs verification on pull requests targeting any branch;
- uses a concurrency key per PR or ref;
- limits source-repository write permission to the publish job;
- publishes `prototype-build` only after a successful `push` to `main`;
- does not publish a PR preview over the live downloadable build.

A successful API write is not CI evidence. Confirm the actual Actions run for the current commit before reporting validation.

## Rules going forward

1. Keep one shared source tree for Web, Android and desktop. Do not split work into long-lived PC/mobile branches.
2. For normal sequential development, create one feature branch from `main` and keep one active integration PR targeting `main`.
3. Create additional branches only for genuinely independent concurrent work. If a stacked PR is unavoidable, state its parent branch, dependency, target and merge order in the PR description and handoff.
4. After merging a parent PR, retarget or rebase its child onto `main`, refresh the comparison, and check that already-merged commits are not duplicated.
5. Draft is a review-state label, not a technical blocker. Continue committing and validating on a Draft PR. When the user asks to finish/release/merge, mark it ready and merge after required checks pass and all parent dependencies are integrated. Do not ask the user to approve routine Git operations. Never silently bypass a failed required check.
6. Never leave a PR Draft solely because CI did not run. Inspect trigger filters and concurrency first; fix the workflow and rerun.
7. Only a successful push to `main` may update `prototype-build` or trigger GitHub Pages deployment. Feature branches and PRs must never replace the published build.
8. After each coherent task, update PR description, roadmap/decision records where relevant, `docs/AI_HANDOFF.md`, and commit to GitHub in the same session.

## Binary asset transfer: actual tool boundary

The public/private setting is not the cause of the enemy-atlas upload blockage.

Observed capabilities in this environment:
- `files__materialize` can copy a Library asset to a local container path.
- The GitHub connector can create a binary Git blob only when its `create_blob` action receives the bytes as Base64 text.
- `create_file`/`update_file` accept UTF-8 text only.
- The connector's `fetch` action is GET-only and does not upload files.
- `functions.exec` can call connectors but has no filesystem access; the container can read the materialized file but has no GitHub credentials. `files__read(mode=image_file)` did not expose native pixels for this WebP.
- No direct file-to-GitHub upload action is exposed in the current tool set.

Do not waste time changing repository visibility or repeating `files__read`/text-file APIs. For a binary asset, use the first viable route in this order:
1. A local Git push through an already authenticated Git credential, if one is available.
2. Git Data API: obtain the exact bytes as Base64 in the same execution path that calls `create_blob`, then `create_tree → create_commit → update_ref`; verify committed blob size and SHA-256.
3. A dedicated authenticated binary-transfer action, if one becomes available.
4. Only after the first three routes are genuinely unavailable, ask for one narrowly scoped unblock (not a generic request to connect Git).

Never mark the asset integrated until the committed blob is verified and the runtime loader is exercised.

## Public source vs private source

Changing this repository to private is not a binary-upload workaround. The current Pages setup depends on the public repository, and the existing decision log records the risk that changing visibility can disrupt Pages. If source confidentiality becomes a requirement, plan a separate migration: private source repository plus a public deployment-only repository containing only built files. Do not flip visibility in place as an experiment.


## Draft status and explicit integration instructions
Draft is a workflow label, not a safety boundary. An explicit user instruction to merge/integrate/release authorizes the agent to mark the PR ready and merge it after required checks pass and dependent PRs are integrated. Do not ask for repeated approval. Without such an instruction, keep the PR unmerged and continue development.
