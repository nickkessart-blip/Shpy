# SHPY — AI handoff (2026-11-25)

> Прочитать `AGENTS.md`, `docs/GIT_WORKFLOW.md`, `.ai/skills/README.md`, релевантные skills, `docs/GAME_BIBLE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` и нужные технические/gameplay specs. Это существующий проект; не начинать заново и не менять канон молча.

## Активное состояние GitHub

- Репозиторий: `nickkessart-blip/Shpy` (public), default branch: `main`.
- PR #15: [hybrid mobile controls](https://github.com/nickkessart-blip/Shpy/pull/15), Draft, base `main`, head `feature/shpy-0.9-hybrid-mobile-controls`.
- PR #16: [visual polish](https://github.com/nickkessart-blip/Shpy/pull/16), Draft, base `feature/shpy-0.9-hybrid-mobile-controls`, head `feature/shpy-0.9-visual-polish`.
- Это stacked PR chain, а не отдельные ветки ПК и Android. #16 зависит от #15. Текущие сравнения: #15 — 14 commits ahead of main; #16 — ещё 62 commits ahead of mobile-controls.
- Обе ветки mergeable по последнему ответу GitHub API, но остаются Draft и не слиты.
- Не считай Draft самостоятельной блокировкой. При прямом поручении пользователя на завершение/релиз перевести PR в Ready и слить после CI и интеграции родительской ветки.
- Ветка для новых изменений: `feature/shpy-0.9-visual-polish`. Перед записью обязательно получить её свежий HEAD и использовать expected SHA/fast-forward.

## Что исправлено в workflow этим коммитом

- Добавлен `docs/GIT_WORKFLOW.md` с аудитом веток, причинами торможения, правилами ветвления, binary-transfer boundary и границей source vs deployment.
- CI переписан: PR-trigger больше не ограничен base=`main`; concurrency изолирован по PR/ref; публикация `prototype-build` возможна только на push в `main`; write permission вынесен из проверки.
- AGENTS, skill index, README и decision log синхронизированы с единым Git-процессом.
- Проверь GitHub Actions после push: этот handoff не является доказательством успешного CI.

## Основные реализованные системы

- Сглаженный рендеринг, FPS-style отдача и три procedural-плана параллакса для вида из окон «Восточного экспресса».
- Существующий Kenney CC0 `muzzle-flare.png` подключён к выстрелу; существующий impact smoke используется при попадании.
- Декоративные SVG-рамки HP/ammo и кодовые сегменты динамических значений.
- Процедурные реакции врагов (idle bob/breathing, наклон при прицеливании, импульс атаки, hit flash/tint) не меняют боевые координаты и хитбоксы.
- Готовый атлас врагов находится в Library: `SHPY_enemy_animation_atlas.webp`, RGBA WebP 384×1024, сетка 3×4, кадр 128×256, baseline y=248, SHA-256 `27893c782fb375ea892f53ed0ca9d256fffd23ec2ad7cfdac2fa6cc8632faf04`. Новое изображение не создавалось.
- Слот, spritesheet loader 128×256 и переключение кадров по типу/боевому состоянию закоммичены. **Сам бинарный WebP пока не находится в ветке**, поэтому в runtime всё ещё fallback на Kenney CC0/SVG.
- `scripts/verify-enemy-atlas.mjs` и `npm run verify:enemy-atlas` проверяют WebP signature, alpha, 384×1024, сетку 3×4, byte size и SHA-256. Локальная проверка подготовленного файла из Library прошла; это проверка целостности источника, не runtime-тест Phaser.
- GitHub connector `create_blob` принимает Base64; `create_file/update_file` — только UTF-8. `files__materialize` кладёт байты в контейнер, но инструменты-коннекторы не имеют прямого filesystem bridge; `files__read(mode=image_file)` для этого WebP сообщил, что native pixels недоступны. Это ограничение передачи байтов в инструментах, **не public/private репозитория**. См. точную границу и порядок обхода в `docs/GIT_WORKFLOW.md`.

## CI и проверки

- До исправления CI запускался на PR только с target `main`, поэтому PR #16 без PR-triggered run. Глобальный concurrency key мог отменять чужие проверки. Публикация build могла выполняться из same-repo PR и перезаписывать `prototype-build`.
- PR #15 получил успешный workflow run `CI` на его head. У PR #16 на прежнем head PR workflow run отсутствовал.
- Branch listing показывает `protected:false` для известных веток, а rulesets endpoint вернул пустой список. Классический protection endpoint connector прочитать не смог (403); не придумывать статусы protection.
- Результат коммита workflow пока нужно проверить после запуска Actions. Не утверждать успешный CI, типизацию, тесты или production build без результата текущего SHA.
- Физическая проверка Android не проведена. Проверить touch/drag/multitouch, чувствительность, ориентацию, камеру, HUD и смену поз врагов на реальном устройстве.

## Следующие задачи

1. Проверить, что CI реально запустился для PR #16 после изменения trigger/concurrency. При ошибке диагностировать и исправить, не оставлять Draft вместо расследования.
2. Довести бинарный atlas upload через документированную Git Data API цепочку; после загрузки проверить размер и SHA Git blob, затем `npm run verify:enemy-atlas` и Phaser loader.
3. После интеграции #15 в `main` перенаправить/перебазировать visual work на `main`, проверить diff и затем интегрировать #16. Не сохранять ненужную stacked topology.
4. Продолжить mobile-first проверку HUD и управления; друг может проверить desktop. Не заявлять физический тест без фактического запуска.

## Пользовательские ограничения

- Пользователь преимущественно работает с Android; приоритет mobile-first. Друг может запускать desktop.
- Не просить подключить Git или вручную делать routine GitHub operations.
- Не генерировать и не редактировать изображения без прямой просьбы пользователя в текущем запросе. Сначала искать готовые ассеты в репозитории, чатах и Library.
- Сначала доводить главный deliverable, а не делать серию вспомогательных коммитов, пока главное остаётся заблокированным.
- Предпочитать завершённые логические блоки длинным дампам и цепочкам мелких исправлений.


## Merge authorization rule
Do not interpret Draft as an absolute prohibition. A direct instruction from the user to integrate/merge/release authorizes converting the relevant PR to Ready and merging after checks pass and dependency order is satisfied. No repeated confirmation is required.
