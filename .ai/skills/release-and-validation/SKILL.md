# Skill: release and validation

- Inspect branch head and PR base/head before writing. Keep all work on the active feature branch unless the user explicitly requests another branch.
- Commit code, tests, assets and documentation to GitHub as part of the task. Update the open PR title/body when scope or validation status changes.
- Run available checks in this order: focused tests, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- If tools cannot execute commands or CI has not run, report checks as pending/not run. Empty workflow/status results are not success.
- Never merge a Draft PR or bypass checks.
- For mobile touch/render/audio changes, record an Android device checklist and clearly distinguish emulator/browser checks from physical-device validation.
- Update `docs/ROADMAP.md`, `docs/RELEASE_NOTES.md` and asset docs when relevant. Maintain a handoff note with exact next actions.
