# SHPY — TECHNICAL ARCHITECTURE
Версия 1.0.0 | Базовое техническое решение

## Цели
Единая игровая кодовая база для Web, Android, iOS и Desktop; модульные системы; offline-first; расширяемость; слабые устройства; автоматические проверки.

## Выбранный стек
- Phaser 4.2.1 — 2D-движок (актуальный релиз на дату документа).
- TypeScript 6.0.3 — основной язык игрового кода (не использовать TypeScript 7 вместе с текущей веткой typescript-eslint до появления официальной совместимости).
- Vite 8.3.8 — dev-сервер и production-сборка.
- Vitest 5.1.1 — unit-тесты игровых правил.
- ESLint 10.15.0 + typescript-eslint 8.73.0 + Prettier — качество и форматирование.
- Node.js 26 LTS — среда разработки и CI.
- Capacitor 8.5.2 — мобильные контейнеры Android/iOS (актуальная ветка 8.x на дату документа).
- Tauri 2.12.x — desktop оболочка и установщики (точный patch фиксировать при установке toolchain).
- Rust — нативная оболочка Tauri/платформенные интеграции, не основное игровое ядро.
- GitHub Actions — CI после появления исходников.
Версии Phaser/Vite/TypeScript/Vitest/ESLint закреплены в package.json. После первой успешной установки npm необходимо сохранить package-lock.json в Git и использовать npm ci в CI. Major-версии не обновлять автоматически посреди этапа.

## Почему не Rust для всей игры
Проект — 2D-шутер с простыми игровыми правилами. Основные риски производительности — рендеринг, эффекты, загрузка ресурсов и число объектов. Rust в игровом ядре усложнит интеграцию и сборку, не решая первоочередную задачу. Tauri использует Rust в нативной оболочке, поэтому язык остаётся там, где он полезен.

## Платформы
- Web: Vite production build как статический сайт.
- Android: Capacitor WebView; APK для тестирования, AAB для публикации.
- iOS: Capacitor iOS project; локальная сборка/подпись требуют macOS и Xcode.
- Desktop: Tauri 2 и системный WebView; Windows MSI/NSIS, другие форматы — по платформе.
Игровое ядро не зависит от API оболочки. Общий игровой код не означает одинаковую платформенную сборку: мобильная и desktop оболочки разные.

## Архитектурные слои
1. Presentation — Phaser scenes, отображение и ввод.
2. Gameplay — бой, враги, укрытия, волны, миссии.
3. Domain/data — определения оружия, врагов, миссий и улучшений.
4. Application services — прогрессия, награды, настройки.
5. Platform adapters — Web, Capacitor, Tauri.
6. Persistence — локальное сохранение и миграции.
Игровые правила по возможности реализуются чистым TypeScript без зависимости от Phaser.

## Целевая структура
```
Shpy/
├── docs/
├── public/assets/{images,audio,fonts}/
├── src/
│   ├── app/
│   ├── game/
│   │   ├── scenes/
│   │   ├── entities/{enemies,weapons}/
│   │   ├── systems/{combat,cover,missions,waves,progression,automation}/
│   │   └── data/
│   ├── ui/
│   ├── input/
│   ├── audio/
│   ├── platform/
│   └── persistence/
├── tests/
├── android/       # генерируется Capacitor
├── ios/           # генерируется Capacitor
├── src-tauri/     # генерируется Tauri
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```
Создавать реальные каталоги по мере появления систем, не плодить пустые папки.

## Логические сервисы
CombatService — выстрел, трассировка, урон. WeaponService — магазин и перезарядка. EnemyController — конечный автомат врага. CoverService — видимость и блокирование выстрела. WaveDirector — волны. MissionDirector — сцены и цели. ProgressionService — репутация и открытия. SaveService — сериализация и миграции. InputAdapter — мышь/клавиатура/touch. PlatformAdapter — платформенные функции.
Это логические контракты; конкретные типы появятся при реализации.

## Правила модульности
- Combat не управляет сохранениями.
- AI не начисляет репутацию напрямую.
- MissionDirector управляет последовательностью и условиями.
- ProgressionService обрабатывает награды и открытия.
- UI отображает состояние и отправляет команды.
- Контент и баланс отделены от алгоритмов.
- Платформенные API скрыты за адаптерами.
- Случайность поддерживает seed для повторяемых тестов.

## Производительность
Ориентир — 60 FPS на подходящих устройствах; режим 30 FPS допустим для слабых/энергосберегающих. Ограничивать частицы и временные объекты, использовать object pooling для часто создаваемых пуль/эффектов, избегать тяжёлых вычислений каждый кадр, начинать с простых заглушек. Проверять слабый ноутбук и Android-устройство. Минимальные требования устанавливаются после профилирования.

## Offline и сохранения
Основное сохранение локальное. Web: IndexedDB для расширяемых данных, localStorage для простых настроек. Capacitor/Tauri: адаптеры локального хранения. Сохранение содержит schemaVersion и миграции. Ошибка чтения не должна молча обнулять прогресс. Облако вне MVP.

## Унифицированный ввод
Игровая логика получает действия aim, fire, reload, pause, confirm, cancel. Desktop связывает их с мышью/клавиатурой, mobile — с касаниями и виртуальными кнопками. Логика не проверяет физические кнопки напрямую.

## Качество
Минимальные проверки: npm run typecheck, npm run lint, npm run test, npm run build. После инициализации настроить GitHub Actions на push/PR. Не заявлять о прохождении проверок, пока они фактически не запускались.

## Риски
Phaser, Capacitor и Tauri имеют разные циклы обновления: фиксировать версии. WebView на iOS/Android отличается от desktop browser. Сенсорное управление тестировать рано. Для iOS локальная сборка/подпись требуют macOS/Xcode.


## Rebaseline runtime domains (2026-11-25)

The product canon now uses a moving rail-shooter mission model and three combat controllers. These are new logical boundaries, not a request to replace Phaser or the existing shared codebase.

### Rail and mission timeline
- `RailTimeline` owns route distance/time, segment transitions, camera travel, spawn windows and scripted event scheduling.
- `BackgroundLayerController` scrolls authored far/mid/near/foreground layers independently. Decorative motion never owns combat coordinates.
- `MissionDirector` consumes timeline events and owns objectives, segment completion and extraction.
- `SpawnDirector` chooses seeded valid spawn lanes while enforcing separation, visibility and screen-safe constraints.

### Location mechanics and modifiers
- `LocationMechanicController` runs permanent location signatures (Casino lighting, train tunnel/steam/shake, warehouse machinery, Embassy security network, Vulkan infrastructure).
- `ModifierResolver` validates compatible operation modifiers and creates a seeded event schedule.
- Both emit typed events to combat/rendering/audio systems. A visual event may affect visibility or an object state, but must not silently change hitbox coordinates.

### Combat controllers and automation
- `CombatController` is the shared action contract.
- `ManualCombatController` translates player input into aim/fire/reload/item actions.
- `AssistedCombatController` delegates only unlocked actions to equipment (for example automatic supplies or a commanded turret).
- `AutonomousMissionDirector` runs all combat actions after preparation in a full-autonomy operation.
- All controllers call the same weapon, damage, cover, enemy and mission services. Automation must never bypass gameplay rules.

### Agency and resources
- Keep Dollars, Reputation and Components separate in the domain model.
- Existing persisted `accountXp` is currently the storage representation for Reputation; any rename requires an explicit save migration.
- `OperativeAvailabilityService` arbitrates between main-operation support and timed roster assignments so one operative cannot occupy two assignments.
- Agency research unlocks capabilities/capacity; personal perks modify player-agent performance.

### Mission preparation and debrief
- Mission Preparation resolves the actual loadout, support roster, gadgets, operation modifiers and automation doctrine before launch.
- Armory owns catalogue/upgrade/equip data, not the final per-operation deployment choice.
- Debrief records actions/rewards by source (player, operative, turret, drone, autonomous weapon) for balance and progression analysis.

### Determinism and saves
- Route events, modifier rolls, spawn selection and autonomous decisions must accept a seed.
- Keep simulation state separate from presentation state (camera shake, parallax, hit flashes and animation offsets).
- Save any new mission knowledge, automation unlocks, research and operative assignments through versioned migrations and tests.
