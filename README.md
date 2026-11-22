# SHPY — Prototype 0.1

Модульный 2D-прототип шпионской инкременталки на Phaser 4 + TypeScript + Vite.

## Документы
- [GAME_BIBLE](docs/GAME_BIBLE.md) — канон игры.
- [GAME_DESIGN](docs/GAME_DESIGN.md) — цикл, миссии и прогрессия.
- [TECHNICAL_ARCHITECTURE](docs/TECHNICAL_ARCHITECTURE.md) — архитектура и платформы.
- [COMBAT_SPEC](docs/COMBAT_SPEC.md) — стрельба, враги и укрытия.
- [MVP_SCOPE](docs/MVP_SCOPE.md) — объём и критерии MVP.
- [ROADMAP](docs/ROADMAP.md) — этапы производства.
- [DECISIONS](docs/DECISIONS.md) — журнал решений.

## Запуск
Требуется Node.js 26 LTS и npm:
```bash
npm install
npm run dev
```
Откройте адрес Vite, по умолчанию http://localhost:5173.

## Проверки
```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

## Управление
- Навести курсор — прицел.
- ЛКМ — выстрел.
- R — перезарядка.
- Esc — пауза.
- Android: левый нижний джойстик плавно двигает прицел; справа отдельные кнопки огня, перезарядки и смены оружия; сверху справа — пауза. Одновременное прицеливание и стрельба поддерживают два пальца.

## Игровой срез
Штаб → казино (две статичные сцены, четыре волны) → результаты → штаб. Враги: охранник, бронированный, штурмовик. Есть HP, магазин/резерв, попадания в голову и тело, укрытия, телеграф атак, репутация, три ветки улучшений и локальное сохранение.

## Автоподхват ассетов
Кладите файлы в `src/assets/` по таблице в [src/assets/README.md](src/assets/README.md). Vite обнаруживает их через `import.meta.glob` при запуске dev-сервера и сборке. Если слот пуст, используется геометрическая заглушка.
Примеры:
- `src/assets/backgrounds/casino-main.webp`
- `src/assets/backgrounds/casino-bar.webp`
- `src/assets/enemies/guard.png`
- `src/assets/enemies/armored.png`
- `src/assets/enemies/assault.png`
- `src/assets/props/cover-crate.png`
- `src/assets/weapons/pistol.png`
- `src/assets/ui/logo.png`

## Статус платформ
Исходный код Web-прототипа загружен. GitHub Actions проверяет TypeScript, тесты, линтер и production build; до успешного прохождения CI не считать сборку проверенной. После успешного CI на push в `main` workflow публикует готовую Web-сборку в ветку `prototype-build`. ZIP этой ветки можно получить по адресу https://github.com/nickkessart-blip/Shpy/archive/refs/heads/prototype-build.zip. Для локального запуска распакуйте архив и выполните `python -m http.server 8000`, затем откройте http://localhost:8000. Ветка содержит production-файлы, а не исходники. Capacitor Android/iOS и Tauri Desktop подключаются отдельным этапом после стабилизации боевого ядра. APK и настольные установщики пока не создавались.
