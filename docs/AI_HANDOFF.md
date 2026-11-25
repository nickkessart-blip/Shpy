# SHPY — AI handoff (2026-11-25)

> Прочитать `AGENTS.md`, `docs/GIT_WORKFLOW.md`, `.ai/skills/README.md`, релевантные skills, `docs/GAME_BIBLE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` и нужные технические/gameplay specs. Это существующий проект; не начинать заново и не менять канон молча.

## Активное состояние GitHub

- Репозиторий: `nickkessart-blip/Shpy`, default branch: `main`.
- PR #15 (hybrid mobile controls) **слит** в main: `129d701842ed0f773eacad8912736eca4b05390a`.
- PR #16 (visual polish) **слит** напрямую в main: `120efbddaff7b5b7943b87782ca44ba9d80f5463`.
- Обе задачи теперь в одной интегрированной версии main. Отдельных source-веток ПК и Android нет.
- Старые feature branches являются историей изменений; новые задачи начинать от актуального main и направлять одним PR в main. Не создавать stacked PR без реальной зависимости.
- PR #16 был переподготовлен как один commit поверх нового main, чтобы после squash-интеграции PR #15 не дублировать мобильные изменения в diff.
- CI на integration head PR #16: workflow run `45520971687`, проверки typecheck, tests, lint, production build завершились успешно.
- CI для main после PR #15: run `45520916259`, успешно; публикация downloadable `prototype-build` успешно завершена.
- GitHub Pages после PR #15: run `45520916130`, успешно; после PR #16 проверь новый Pages deployment на актуальном main.
- Физический Android-плейтест не выполнен и остаётся обязательным. Не выдавать CI за проверку реального сенсорного устройства.
- Enemy state atlas is integrated in main: AssetCatalog.ensureEnemyAnimationAtlas() builds a deterministic 384×1024 Phaser CanvasTexture from four committed SVGs; MissionScene selects frames 0–11 for aim/fire/hit. This is a state atlas, not hand-drawn frame animation. See docs/ENEMY_ANIMATION_ATLAS.md.
- Следующая рабочая ветка должна быть создана от актуального main, когда появится новая задача. Перед записью получать свежий HEAD и использовать expected SHA/fast-forward.

## Основные реализованные системы

- Сглаженный рендеринг, FPS-style отдача и три procedural-плана параллакса для вида из окон «Восточного экспресса».
- Существующий Kenney CC0 `muzzle-flare.png` подключён к выстрелу; существующий impact smoke используется при попадании.
- Декоративные SVG-рамки HP/ammo и кодовые сегменты динамических значений.
- Процедурные реакции врагов (idle bob/breathing, наклон при прицеливании, импульс атаки, hit flash/tint) не меняют боевые координаты и хитбоксы.
- Подготовленный Library WebP `SHPY_enemy_animation_atlas.webp` не включён в runtime и остаётся необязательным источником для будущей замены; текущая игра использует CanvasTexture из четырёх SVG.
- Слот, процедурная CanvasTexture 128×256 и переключение кадров по типу/боевому состоянию интегрированы в main. Fallback Kenney CC0/SVG остаётся только для ошибок создания атласа или отсутствующих исходных SVG.
- `scripts/verify-enemy-atlas.mjs` и `npm run verify:enemy-atlas` проверяют отдельный подготовленный WebP, но не runtime CanvasTexture. Runtime path описан в `docs/ENEMY_ANIMATION_ATLAS.md`.
- Прежняя проблема передачи Library WebP больше не блокирует разработку: runtime atlas воспроизводимо строится из SVG, без бинарной загрузки, внешних запросов или изменения исходных ассетов.

## CI и проверки

- До исправления CI запускался на PR только с target `main`, поэтому PR #16 без PR-triggered run. Глобальный concurrency key мог отменять чужие проверки. Публикация build могла выполняться из same-repo PR и перезаписывать `prototype-build`.
- PR #15 получил успешный workflow run `CI` на его head. У PR #16 на прежнем head PR workflow run отсутствовал.
- Branch listing показывает `protected:false` для известных веток, а rulesets endpoint вернул пустой список. Классический protection endpoint connector прочитать не смог (403); не придумывать статусы protection.
- Результат коммита workflow пока нужно проверить после запуска Actions. Не утверждать успешный CI, типизацию, тесты или production build без результата текущего SHA.
- Физическая проверка Android не проведена. Проверить touch/drag/multitouch, чувствительность, ориентацию, камеру, HUD и смену поз врагов на реальном устройстве.

## Enemy state atlas resolution (2026-11-25)

- Replaced the blocked Library-binary transfer dependency with a reproducible runtime CanvasTexture built from already committed SHPY enemy SVGs. No generated image or third-party asset was introduced.
- Uses Phaser's documented CanvasTexture API; missing source textures/canvas failure preserve Kenney/SVG fallbacks, and a loaded authored atlas is never overwritten.
- Geometry: 384×1024, 3×4, 128×256; row-major guard/armored/assault/boss × aim/fire/hit; baseline y=248.
- docs/ENEMY_ANIMATION_ATLAS.md records implementation, limitations, fallback policy and replacement procedure.
- GitHub Actions CI run #45523076355 passed on commit 7a80199c2577a3d9e83329e746ff5f08612d2f28: typecheck, tests, lint and production build all succeeded. Physical Android visual validation remains pending.

## Canon rebaseline — 2026-11-25

A user-approved design rebaseline is now documented on branch `docs/shpy-canon-rebaseline-2026-11-25`:
- `docs/GAME_BIBLE.md` is version 2.0 and is the current canon.
- `docs/GAME_DESIGN.md` and `docs/COMBAT_SPEC.md` now describe a moving rail-shooter model; older static-scene-only descriptions are superseded.
- `docs/CAMPAIGN_AND_LOCATIONS.md` defines the story framing, five persistent locations and their signature mechanics/modifier direction.
- `docs/AUTOMATION_DESIGN.md` defines manual, assisted and full autonomous operations. In endgame spectator mode the player prepares and launches; the game performs all combat actions and the player watches.
- `docs/UI_UX_SPEC.md` captures the feedback on menu, settings, HQ, map, armory, agency computer and onboarding.
- `docs/MVP_SCOPE.md` and `docs/ROADMAP.md` reset production priorities and identify what is implemented versus what still needs real validation.
- `docs/DECISIONS.md` contains decisions D-009 through D-020 and separates open content/balance details from approved canon.
- `docs/TECHNICAL_ARCHITECTURE.md` describes the future rail timeline, location event, modifier, combat controller and autonomy boundaries.

No gameplay code, save schema, balance values, images or audio were changed in this documentation task. The existing `accountXp` save field remains the persisted representation of Reputation; do not rename it without a tested migration. The current game still contains prototype implementations whose reported quality problems are not fixed by this documentation change.

## Next production work

1. Before coding, read the new canon docs and the relevant skills in `.ai/skills/`.
2. Start P0 from `docs/ROADMAP.md`: make the Casino route a reliable moving rail-shooter slice. Prioritize coordinate correctness, layered parallax, cover occlusion, spawn spacing, enemy behaviour, attack feedback and visible first-person hands/weapon.
3. Add deterministic tests for rail events, pointer/world transforms, valid spawn spacing and cover/line-of-sight.
4. Do not attempt all five locations or full autonomy in one change. Prove one end-to-end Casino route and its permanent lighting signature first.
5. After the combat foundation, work through UI/HQ, tutorial/story, economy and the autonomy ladder in the documented order.
6. Keep desktop visual QA and physical Android validation separate from CI evidence.

1. Провести desktop/browser visual QA текущей main-версии: стартовый экран, штаб, вход в миссию, стрельба, попадания, смена aim/fire/hit кадров, HUD, resize/fullscreen и консоль браузера.
2. По результатам desktop QA исправить визуальные/функциональные дефекты отдельными логическими PR.
3. После desktop QA проверить mobile touch/multitouch, ориентацию и чувствительность на физическом Android.
4. Полноценные циклические анимации героя/врагов остаются отдельной задачей; текущий atlas даёт state-based aim/fire/hit feedback.

## Пользовательские ограничения

- Пользователь преимущественно работает с Android; приоритет mobile-first. Друг может запускать desktop.
- Не просить подключить Git или вручную делать routine GitHub operations.
- Не генерировать и не редактировать изображения без прямой просьбы пользователя в текущем запросе. Сначала искать готовые ассеты в репозитории, чатах и Library.
- Сначала доводить главный deliverable, а не делать серию вспомогательных коммитов, пока главное остаётся заблокированным.
- Предпочитать завершённые логические блоки длинным дампам и цепочкам мелких исправлений.


## Merge authorization rule
Do not interpret Draft as an absolute prohibition. A direct instruction from the user to integrate/merge/release authorizes converting the relevant PR to Ready and merging after checks pass and dependency order is satisfied. No repeated confirmation is required.
