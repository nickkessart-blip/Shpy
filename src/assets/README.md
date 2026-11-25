# Автоподхват ассетов

Кладите файлы прямо в соответствующие папки. Vite обнаруживает их через import.meta.glob при dev-запуске и сборке. Если файл для слота отсутствует, игра использует геометрическую заглушку.

| Папка | Имя файла | Слот |
|---|---|---|
| backgrounds | casino-main-base/far/mid/near.svg, casino-bar-base/far/mid/near.svg | Раздельные планы казино; исходные casino-main.svg и casino-bar.svg остаются fallback |
| enemies | guard.png, armored.png, assault.png | Враги |

| weapons | pistol.svg, smg.svg, shotgun.svg, rifle.svg | Пистолет |
| props | cover-crate.png | Укрытия |
| ui | logo.png, cursor.png | Логотип/прицел |
| audio | Любые имена ogg/mp3/wav | Звуковые ресурсы |

Поддерживаемые изображения: PNG, JPG/JPEG, WEBP, SVG. Для атласов с прозрачностью используйте PNG как основной переносимый формат: в текущем процессе загрузка пользовательского WebP в Git не сработала, поэтому атлас врагов опубликован как PNG. Сам Vite по-прежнему поддерживает WEBP через import.meta.glob.
Для новых именованных слотов добавьте соответствие в src/game/assets/assetSlots.ts.


## Подборка источников

Проверенные бесплатные источники и условия лицензирования собраны в docs/ASSET_RESEARCH.md. Наличие ссылки в подборке не означает, что архив уже включён в билд: перед интеграцией ассет нужно загрузить в репозиторий, проверить содержимое архива и сохранить лицензию рядом с файлами.


## Текущая графика

В `src/assets/enemies/animation-atlas.png` находится прозрачный авторский атлас 4×4: idle/aim/fire/hit для guard/armored/assault/boss, 192×288 на кадр. Он загружается напрямую как Phaser spritesheet (frame IDs 0–15); при отсутствии PNG остаётся совместимая CanvasTexture-заглушка из SVG. Подробности: docs/ENEMY_ANIMATION_ATLAS.md. Источники сторонних бесплатных паков и их лицензии собраны в `docs/ASSET_RESEARCH.md`; сами сторонние паки пока не интегрированы.


## Локальное аудио SHPY 0.6

Подпапки `audio/sfx/` и `audio/music/` содержат файлы, используемые в игре напрямую. Для каждого файла записан источник и лицензия в `audio/LICENSES.md`. Файлы подхватываются автоматически через Vite/AssetCatalog, сетевое скачивание при запуске не требуется.


## Оружие SHPY 0.7

`weapons/pistol.svg`, `smg.svg`, `shotgun.svg` и `rifle.svg` — четыре собственные векторные модели. Их силуэты различаются длиной/формой ствола, ресивером, магазином, оптикой и помповым цевьём; файлы используются в боевой сцене и в оружейном шкафу. Это оригинальные проектные файлы, а не сторонний CC0-пак. Правовой режим проекта описан в `/COPYRIGHT.md`.


## Visual recovery pass

- Casino main/bar: detailed layered 1280×720 SVG backgrounds.
- First-person weapon viewmodels: original weapon SVGs rasterized at 720×1240 for the combat rig; the old small atlas remains fallback only.
- Enemies: 2× source rasterization and a 192×384 runtime atlas. State poses are still generated from static source SVGs, so full animation cycles remain future work.


### Восточный экспресс: раздельные планы

`backgrounds/train-carriage.svg` — базовый интерьер. `train-carriage-far.svg`, `train-carriage-mid.svg` и `train-carriage-near.svg` — прозрачные оверлеи 1280×720, выровненные под базу: ночной город за окнами, дождь/отражения на стекле и передние кресла с отделкой. MissionScene загружает их как независимые планы с разной скоростью параллакса; при отсутствии полного набора остаётся исходный фон.
