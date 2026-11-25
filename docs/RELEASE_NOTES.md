# SHPY — Release notes

## 2026-11-25 — Combat visual recovery (first release)
- Rebuilt the Casino main room and bar as detailed four-layer vector environments.
- First-person combat uses the individual 720×1240 rasterized SVG weapon illustrations instead of enlarging the low-resolution weapon atlas.
- Mobile weapon viewmodel now rotates toward the world-space reticle and the muzzle follows its direction.
- Enemy SVGs rasterize at 2× source resolution; runtime state atlas cells are now 192×384.
- This is a first art-quality recovery pass. Full enemy animation cycles, additional location art and visual QA on a physical Android device remain outstanding.

## 2026-11-25 — Mobile combat controls recovery
- Fixed the touch-control overlay so it follows the actual Phaser canvas under Scale.FIT, including resize and orientation changes.
- Aim-stick movement now uses a controllable response speed; the previous default moved the reticle at roughly 2,430 px/s at full deflection.
- The aim pointer is tracked independently at window level, so a second finger pressing fire does not cancel aim tracking.
- The mobile weapon viewmodel now rotates toward the reticle and its muzzle position follows the same transform.
- Physical Android QA is still required; successful CI and Pages publication do not prove device behavior.

## 2026-11-25 — Batch operative report collection
- Added an inbox action to claim all completed operative reports at once.
- The AgentService snapshots only completed run IDs and processes them through the existing collectMission flow, preserving component rewards, failure results and operative XP.
- Unfinished assignments are not touched; an empty batch produces a clear message.
- Added deterministic coverage for multiple completed reports and the not-yet-completed boundary.

## 2026-11-25 — Assisted operative auto-dispatch
- Added an explicit auto-dispatch action to the Agency Computer.
- The dispatcher evaluates unlocked side operations and legal combinations of available operatives, then chooses the assignment with the best expected Components per minute using current intelligence and logistics research.
- Dispatch still uses the existing AgentService validation, chance calculation, assignment timers and save flow; no combat or reward rules are bypassed.
- Added deterministic tests for recommendation and the no-eligible-team case.
- This is a first assisted-automation step, not persistent background autonomy. Automatic report collection, configurable doctrine and autonomous main operations remain future work.

# SHPY — Release Notes

## 2026-11-25 — First Casino rail timeline slice
- Added a renderer-independent deterministic route clock with bounded distance/progress, reset and independent wrapped layer offsets.
- Split the original Casino and Royale Bar SVGs into eight transparent, same-canvas base/far/mid/near planes and registered them in AssetCatalog.
- Wired the route clock into MissionScene; the route advances only during active play, resets per mission segment, scrolls authored Casino planes independently and displays route progress. The original full-scene SVGs remain as fallback.
- Kept reticle, weapon rig, HUD and authoritative enemy hit coordinates independent from decorative layer offsets.
- This is the first bounded route-motion slice, not the completed rail-shooter. Enemy route lanes, spawn director, physical cover occlusion, projectile feedback and the Casino signature event remain open.

## 2026-11-25 — Approved game design rebaseline
- Re-centered SHPY on its approved spy-parody rail-shooter identity and protagonist progression.
- Defined the first campaign's narrative frame, five location signature mechanics and the layered operation-modifier model.
- Defined mission-bound manual, assisted and fully autonomous combat; endgame autonomous missions are watched after preparation and launch.
- Specified the distinction between player-agent and recruited operatives, including support availability.
- Documented the UI/HQ/Settings/Armory/Mission Preparation expectations and contextual prologue/tutorial.
- Rebased MVP scope and roadmap. This was a documentation-only change: no gameplay behaviour, numeric balance, save schema or assets were changed.

## 2026-11-25 — Reuse existing muzzle-flare artwork
- Connected the existing Kenney CC0 muzzle-flare texture to the mission firing effect. The sprite follows the weapon muzzle and aim direction, uses additive blending and fades with the shot flash.
- Scale is uniform and derived from the source frame bounds to preserve the artwork's aspect ratio; the procedural tracer/flash remains as fallback.

## 2026-11-25 — Enemy atlas reuse and loader preparation
- Located and inspected the existing 384×1024 RGBA WebP atlas in the user's Library; no image generation was performed.
- Added the spritesheet asset slot, 128×256 Phaser loader path and combat-state frame selection scaffolding. The binary atlas itself is not yet in the branch, so the runtime continues using Kenney CC0/SVG fallbacks.
- Clarified the AI rule: never generate or edit images without an explicit user request; search existing repo/chat/Library materials first.
- Binary repository integration, runtime visual checks on desktop/Android and current CI results remain pending.

## 2026-11-25 — Agent handoff audit
- Added `docs/AI_HANDOFF.md` with the exact active branch/PR/head, implemented systems, asset integration truth, validation evidence and ordered next steps.
- Audited enemy state timing: `updateEnemies(dt)` decrements `enemy.timer`; `Attacking` transitions through the existing state machine. Tint/pose feedback is visual-only.
- Confirmed that PR #16 head had no workflow run or combined status entries at audit time; this is pending, not a pass. Physical Android validation remains pending.


## 2026-11-25 — Visual polish follow-up
- Added original SVG decorative frames for health and ammunition HUD panels.
- Replaced continuous health and ammo fills with segmented code-rendered meters.
- Added restrained state-based enemy pose feedback (idle breathing, aim lean, attack kick and hit flash) without moving combat hitboxes.
- Added `AGENTS.md` and `.ai/skills/` to make future AI handoffs follow the project canon, asset pipeline and release checks.
- Generated enemy animation atlas remains a prepared, not yet runtime-integrated asset; see `docs/ENEMY_ANIMATION_ATLAS.md`.

# SHPY 0.6 — Управление, настройки и аудиовизуальная полировка

## Основные изменения
- Два Android-профиля управления: тап по полю для прицеливания/выстрела или виртуальный aim-stick с отдельной кнопкой удержания огня.
- Чувствительность джойстика с настройкой 0.5×–2.5×, радиальная мёртвая зона и ускоряющаяся кривая отклика.
- Исправлено разделение multi-touch по pointerId: палец прицеливания не отменяет палец удержания огня.
- Добавлен экран настроек с качеством графики, громкостью музыки и эффектов, схемой управления, чувствительностью, вибрацией, параллаксом и тряской камеры.
- Настройки сохраняются в отдельном `shpy_settings_v1`; сохранение игрового прогресса v5 не изменяется.
- Добавлена локальная CC0-музыка и SFX: три варианта пистолетного выстрела, tail, UI click/confirmation, звук механизма перезарядки, попадание и взрыв.
- Добавлены различные шаблоны вибрации для боя, урона, предметов и результата операции (при поддержке Vibration API).
- Усилен HUD: тёмная панель, индикатор здоровья, уточнённая компоновка текста.
- Добавлены лёгкие процедурные планы глубины, параллакс и небольшая idle-анимация врагов.
- Добавлен документ происхождения аудио: `src/assets/audio/LICENSES.md`.

## Проверки и ограничения
Проверки TypeScript, тестов, линтера и production build должны быть пройдены GitHub Actions до слияния. Физическая проверка на Android не выполнялась автоматически и остаётся обязательным этапом после публикации. Полные спрайтовые анимации персонажей и финальная перерисовка всех локаций не входят в этот проход.

## Источники
Аудио: CC0 1.0, источники и конкретные файлы перечислены в `src/assets/audio/LICENSES.md`. Детали схем ввода и состояния графического пайплайна — в `docs/ASSET_RESEARCH.md` и `docs/COMBAT_SPEC.md`.

---

# SHPY 0.4 — Предмиссионное снаряжение

## Основные изменения

- Добавлен отдельный экран подготовки перед каждой операцией.
- Сохранение выбранного комплекта в локальном профиле игрока.
- Четыре вида оружия: служебный пистолет, компактный ПП, тактический дробовик и штурмовая винтовка.
- Отдельные характеристики оружия: урон, темп стрельбы, магазин, резервный боезапас и перезарядка.
- Смена оружия во время боя: клавиши 1–3 на ПК и кнопка «ОРУЖИЕ» на сенсорных устройствах.
- Тактический слот с двумя гранатами открывается на 700 XP.
- Активный слот с одной аптечкой открывается на 1800 XP.
- Граната наносит 5.5 урона противникам в радиусе 245 игровых пикселей.
- Аптечка восстанавливает до 40% максимального здоровья.
- Во время перехода между секторами боезапас пополняется для каждого взятого оружия.

## Прогрессия

| Разблокировка | Порог накопленной репутации |
|---|---:|
| Второй оружейный слот | 350 XP |
| Компактный ПП | 350 XP |
| Гранаты | 700 XP |
| Тактический дробовик | 850 XP |
| Третий оружейный слот | 1200 XP |
| Штурмовая винтовка | 1400 XP |
| Аптечка | 1800 XP |

Разблокировки не расходуют накопленную репутацию.

## Управление

- ПК: 1, 2, 3 — смена оружия; R — перезарядка; G — граната; Q — аптечка; Esc — пауза.
- Android: экранные кнопки смены оружия, перезарядки, огня, гранаты, аптечки и паузы.

## Сохранения

Схема сохранения повышена до v3. Старые сохранения v1/v2 мигрируют без потери репутации и улучшений. Существующий профиль начинает с одним служебным пистолетом; новые слоты и предметы открываются по накопленной репутации.


## SHPY 0.5 — Раздельная экономика и метапрогрессия

- Репутация заменена двумя независимыми показателями: доллары и опыт аккаунта.
- Доллары начисляются за убийства, зачистку волн, босса и успешное завершение операции.
- Доллары расходуются при покупке уровней шести постоянных веток улучшений.
- Account XP не тратится; из него вычисляется уровень аккаунта и ранг.
- Добавлена 15-уровневая шкала рангов с прогрессивными порогами XP.
- Слоты оружия, оружие, гранаты, аптечка, ветки и продвинутые тиры перков открываются по уровню аккаунта.
- Стоимость улучшений и требования к рангам разделены и вынесены в конфигурацию баланса.
- Сохранения v1/v2/v3 мигрируют в v4. Старая репутация конвертируется одновременно в account XP и равный стартовый баланс долларов, чтобы сохранить разблокировки и прежнюю экономическую ценность.


---

# SHPY 0.7 — Combat feel, distinct weapons and graphical HUD

## Основные изменения
- Исправлено движение прицела на низком FPS: input delta больше не режется общим лимитом шага симуляции 50 мс.
- Переработана кривая стика: меньше мёртвая зона, быстрый отклик на небольшие движения, чувствительность 0.5×–4×, новая рекомендация по умолчанию 1.8×.
- Рука/оружие напрямую следует за прицелом по положению и углу; сглаживающая tween-задержка не используется.
- Оружие получило разные механики: одиночный выстрел, автоматический огонь, помповый дробовик с семью дробинами; разные разброс, отдачу, скорострельность и урон.
- Перерисованы четыре собственных SVG-силуэта оружия.
- HUD разделён на графические блоки здоровья/миссии и оружия/магазина, добавлены пиктограммы и индикатор патронов.
- В оружейном шкафу добавлены шкалы урона, темпа, магазина и точности; уровни перков получили визуальные пипы/эмблемы.
- Android-кнопки получили графические символы и компактные подписи; смена оружия доступна и в tap-профиле.
- Production-сборка не публикует source maps; добавлен COPYRIGHT.md.

## Ограничения
Сборка остаётся Web-игрой. Проверки CI не заменяют физический плейтест на Android. Полные спрайтовые анимации героя и врагов, 2.5D-камера по рельсам и следующая сюжетная операция остаются следующим этапом.

## 2026-11-25 — Seeded enemy spawn and physical cover slice
- Added a Phaser-independent seeded SpawnDirector with authored-lane candidates, bounded lane generation, cover clearance, minimum separation and reproducible entrance ordering.
- Preserved each wave's authored enemy-role roster; only lane assignment, order and entrance timing vary by run. This avoids silently changing combat balance while removing identical spawn silhouettes.
- Added staggered enemy entry cues with a visible, fading lane marker.
- Enemies taking cover are now rendered behind the cover layer instead of being hidden by a state toggle. Shot resolution checks the muzzle-to-hitbox segment against the same cover rectangles, so covered targets cannot be hit through the prop.
- Enemies assigned to the same cover use different peek offsets to reduce stacked silhouettes.
- Added focused SpawnDirector determinism, spacing, bounds, cover-clearance and composition tests, plus cover line-of-sight tests.
- Continuous route-lane movement, dynamic role composition, full cover destruction and browser/Android visual validation remain open.

- Extended the spawn plan into visible route-lane entrances: guards, assault units and armored enemies enter from alternating route edges with different travel durations, while stagger timing remains seed-driven. A pulsing marker previews each assigned lane before arrival.
- Added a pure eased-entry sampler and tests for start/end positions, clamping and invalid duration. Bosses preserve their authored entrance point.
