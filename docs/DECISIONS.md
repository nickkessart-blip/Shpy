# SHPY — DECISION LOG

## Решение 2026-11-23 — эксперимент мобильной камеры

Для Android вводится экспериментальная схема: прицел закреплён в центре экрана, свайп панорамирует игровую сцену, огонь вынесен в отдельную кнопку. Оружие и HUD закреплены относительно экрана. Виртуальный стик остаётся альтернативой. Решение временное до физического теста на нескольких размерах экрана; desktop-схема не меняется.

Версия 1.0.0 | 2026-11-22

Документ отделяет решения пользователя от проектных рекомендаций и открытых вопросов.

## Подтверждённые решения
### D-001 — Репозиторий
GitHub: nickkessart-blip/Shpy.

### D-002 — Приоритет
На текущем этапе приоритет — игровой процесс, не визуал. Используются кодовые/геометрические заглушки.

### D-003 — Пространство (историческое решение, заменено D-012)
Первоначально планировался гибрид статичной сцены и кинематографичной последовательности. Это решение superseded решением D-012 от 2026-11-25: текущий канон — полноценная движущаяся rail-shooter-модель.

### D-004 — Стрельба и укрытия
Игрок может стрелять в любой момент. Враги способны прятаться в укрытиях.

### D-005 — Структура
Не один HTML-файл, а чёткая модульная структура для расширения игры.

### D-006 — Платформы
Единая игровая кодовая база с будущими целями Web, Android, iOS и Desktop installer.

## Базовые технические решения
### T-001 — Игровой стек
Phaser 4 + TypeScript + Vite. Capacitor 8 для Android/iOS. Tauri 2 для desktop. Rust — для Tauri shell/native integration, не для основного игрового кода. Patch-версии фиксируются при создании проекта и проверке совместимости.
Статус: техническая рекомендация ассистента в рамках поручения пользователя самостоятельно выбрать стек; пересматривается до реализации при выявлении несовместимости.

## Проектные гипотезы, требующие плейтеста
### P-001 — Репутация
Решение пересмотрено в SHPY 0.5: старая репутация конвертируется в доллары и равное количество account XP. Доллары расходуются на покупки; account XP не тратится и определяет уровень аккаунта/разблокировки. Уровни перков покупаются за доллары, но их категории и максимальные тиры ограничены рангом аккаунта.

### P-002 — Первая миссия
Казино. Предлагаемая структура: главный зал, бар/кухня, VIP-зона, хранилище, финальная арена. Для первого среза достаточно 1–2 сцен.

### P-003 — Противники
Охранник, бронированный, штурмовик. Тайминги и характеристики подлежат тесту.

### P-004 — Баланс
Начальный магазин 6, урон 1, перезарядка 2 секунды; улучшения магазина 6→8→10, урона 1→2→3, перезарядки 2→1.5→1 секунды. Это гипотезы исходного документа.

### D-007 — Разделение функций штаба
Карта отвечает только за основные сюжетные операции. Оружейный шкаф отвечает за коллекцию экипировки (включая закрытые предметы), выбор комплекта, просмотр перков, полевые модификации и косметику. Компьютер разделён на вкладки постоянных улучшений и управления агентами. Телефон остаётся под будущие события и престиж.

### D-008 — Агентское братство и отдельные операции
Агенты вербуются за доллары, имеют собственные специализации и уровни. Их отправляют отдельными от основной кампании таймерными заданиями. Вероятность успеха зависит от состава, уровня и специализации отряда. Успешные задания дают комплектующие, а все вернувшиеся агенты получают собственный XP. Эти задания не дают account XP или доллары, не открывают сюжетные операции и не меняют результаты основной кампании. Провал не убивает агента в текущем прототипе.

## Открытые вопросы
- Бесконечный резерв патронов или ограниченный общий боезапас?
- Только ручная перезарядка или поздняя авто-перезарядка?
- Коэффициент попадания в голову?
- Может ли попадание прервать подготовку атаки, если враг выжил?
- Точная модель урона врагов, защиты/уклонения игрока?
- Mobile: drag-to-aim + отдельный fire или tap-to-aim/fire?
- Нужен ли геймпад?
- Как балансировать цены улучшений и награды по мере добавления новых операций/сложности?
- Минимальные версии Android/iOS?
- Нужны ли macOS/Linux релизы в первой публичной версии?

## Правило изменения канона
Изменения подтверждённых решений записывать с датой, причиной и влиянием на документы. Не менять договорённости молча. Не превращать гипотезы баланса в канон до плейтеста.

## Реализационные допущения прототипа 0.1 (не финальный канон)
- Резервный боезапас временно задан как 48 патронов на миссию, магазин стартует с 6. Это нужно для проверки ритма боя.
- Перезарядка пока только ручная: клавиша R на Desktop; нижняя правая область экрана на touch.
- На touch касание по боевой области задаёт прицел и стреляет. Схема может быть пересмотрена по результатам теста телефона.
- В SHPY 0.5 улучшения покупаются за доллары; уровни аккаунта открывают ветки и тиры. Таблицы наград, цен и XP находятся в balance.ts и progression.ts.
- Первая сборка содержит две геометрические сцены казино и четыре волны, чтобы проверить переход между сценами.
- Укрытия пока неразрушаемые. После выхода из укрытия враг смещается на сторону объекта, обращённую к игроку, чтобы оставаться уязвимым в состоянии выглядывания.

## Решение 2026-11-23 — отзывчивость, оружие и приватность
- Ввод прицела рассчитывается с собственным input delta и не зависит от ограничителя симуляции AI; рука следует за точкой прицела напрямую.
- Оружие определяется отдельными fireMode/spread/pellets/recoil параметрами, а не только уроном и размером магазина.
- HUD должен показывать критическую информацию графикой и краткими подписями.
- Не переключать текущий GitHub-репозиторий на private без миграции: на GitHub Free опубликованный Pages сайт будет отключён, а старые публичные форки останутся публичными. План защиты — приватный source repo + публичный deployment-only repo. До миграции отключены source maps и добавлено уведомление о правах.

## Решение 2026-11-25 — использование существующих изображений
- Не генерировать и не редактировать изображения без прямой просьбы пользователя в текущем запросе.
- Задачи по улучшению графики, интеграции ассетов или продолжению разработки сами по себе не являются разрешением на генерацию.
- Перед визуальной работой искать подготовленные материалы в GitHub-репозитории, текущих вложениях чатов и Library; уже нарезанные атласы и спрайты использовать повторно.
- Не просить повторно загрузить доступный ассет. Фиксировать его происхождение и отдельно отмечать состояния: найден, подготовлен, добавлен в репозиторий, зарегистрирован, загружен, используется в runtime, проверен.

## Решение 2026-11-25 — единое мобильное управление
- Объединить прежние профили tap и swipe в один гибридный режим: касание задаёт прицел и стреляет, перетаскивание того же пальца непрерывно перемещает прицел и панорамирует камеру.
- Отдельная экранная кнопка огня остаётся для удержания стрельбы вторым пальцем; левый виртуальный стик сохраняется как альтернативная схема.
- Старые сохранённые значения `tap` и `swipe` автоматически приводятся к гибридному режиму; `stick` сохраняется без изменений.
- Пределы камеры расширяются до ±420 px по X и ±180 px по Y. Параллакс включается и на мобильных устройствах и должен реагировать на положение камеры.
- Решение считается проверенным только после CI и физического теста на Android: одиночное касание, drag, multi-touch fire+aim, отпускание каждого пальца, края экрана, смена ориентации.

## Решение 2026-11-25 — упрощение Git-процесса
- SHPY остаётся одной общей кодовой базой для Web, Android и desktop; не создавать отдельные долгоживущие ветки по платформам.
- Для обычной последовательной разработки использовать одну активную feature-ветку и один интеграционный PR в `main`. Вложенные PR допустимы только при реальной параллельной работе, с явными зависимостями и порядком слияния.
- Draft-статус сам по себе не запрещает коммитить, тестировать или завершать работу. При прямом поручении пользователя на релиз/слияние перевести PR в Ready и слить после успешных проверок и интеграции родительских изменений; не запрашивать отдельное разрешение на рутинные Git-действия.
- CI должен запускаться для PR в любую целевую ветку, изолировать concurrency по PR/ref и публиковать только после успешного push в `main`.
- Публичность репозитория не связана с передачей локальных бинарных байтов в GitHub connector; приватизацию рассматривать отдельно как миграцию source/deployment.



## Rebaseline 2026-11-25 — approved product canon

### D-009 — SHPY identity and tone
Approved: incremental spy-action rail shooter with agency management. The primary tone is broad spy parody/comedy with black humour, using Johnny English, Leslie Nielsen parody films, The Gentlemen, Tropic Thunder, Austin Powers and Inglourious Basterds as tonal references only. SHPY must use original characters, dialogue, scenes and jokes.

### D-010 — Protagonist arc
Approved: combine the awkward/lucky rookie with the deadpan, increasingly competent professional. The player-agent begins inexperienced and occasionally clumsy, but gradually becomes genuinely capable. The surrounding agency and antagonists remain absurd; the protagonist must not remain a useless joke forever.

### D-011 — Multiple major antagonists
Approved: Vulkan is one of several major villains, not the universal mastermind. The first campaign reveals a network of competing criminal interests and independent antagonists. Vulkan receives a major arc associated with his lair.

### D-012 — Rail-shooter structure restored
Approved: missions use a moving authored rail, linked segments, independent parallax/environment layers, enemy entry lanes and scripted location events. Stationary compositions may still be used for brief encounter beats, but the mission's overall identity is a forward-moving rail shooter. The previous "static scenes only" description is superseded.

### D-013 — Location signatures and operation modifiers
Approved: each initial location has a permanent signature mechanic that affects play. Optional modifiers are selected before launch and alter the frequency, severity or combination of events while showing clear warnings and counterplay. Initial signature directions:
- Casino: changing light and visual distractions.
- East Express: train motion, tunnel darkness, vibration, steam and compartment routes.
- Contraband warehouse: moving cargo and industrial machinery.
- Embassy: surveillance/security network, reinforced sightlines and restricted doors.
- Vulkan's Lair: dangerous infrastructure, pressure/heat systems and power control.
Specific event values and compatibility are balancing/content decisions, not fixed constants.

### D-014 — Three-resource economy
Approved: Dollars are spendable cash; Reputation is persistent career/agency progression; Components are crafting and equipment materials. The current save field `accountXp` remains the technical storage field for Reputation until a deliberate migration is implemented and tested. Do not add currencies without a strong design reason.

### D-015 — Fully autonomous endgame operations
Approved: late-game players can prepare and launch an operation, then watch the simulation execute the entire mission. In this full-autonomy mode the game handles target selection, aim, fire, reload, automatic supplies, weapon selection, turret/drone/rocket support and assigned operative support. The player has no required combat clicks after launch. Pause and playback speed are presentation controls only.

### D-016 — Autonomy is earned and operation-bound
Approved: new story operations/sectors are first experienced manually or with assistance. Full autonomy unlocks for known/prepared sectors through agency research, reconnaissance and equipment progression. Autonomy is a visible in-mission simulation, not an offline timer or a button that simply claims rewards. It uses the same combat rules as manual play and can fail when underprepared.

### D-017 — Player-agent and operatives
Approved terminology: the directly controlled character is the **player-agent**; recruited roster members are **operatives**. An operative assigned as direct support in a main operation is unavailable for simultaneous timed roster assignments. This creates a deliberate choice between immediate combat support and background logistics/intelligence work.

### D-018 — Armory versus mission preparation
Approved: the Armory is a catalogue/workshop for weapon inspection, attachments, perks and cosmetics. Actual weapon slots, grenades, medkits, gadgets, support operative and automation package are confirmed in a separate Mission Preparation step before launch.

### D-019 — Onboarding and story delivery
Approved: the first operation is a prologue and contextual tutorial. Story delivery uses short cinematic intros/outros, radio chatter, character exchanges, documents, messages and mission events. New systems are explained when first unlocked, not in one front-loaded manual.

### D-020 — UI/UX expectations
Approved direction: consistent visual system and dimensions across buttons/tabs/cards; active tabs must stay visibly selected; Settings are platform-aware; Desktop includes key rebinding; mobile-only touch options are not shown as desktop controls; parallax is a default visual feature rather than a normal toggle; graphics and vibration options explain their real effects.

## Open content and balance questions (not blockers for the canon)

- Protagonist name, agency leadership cast and supporting character roster.
- Exact villain roster, their motives and the order in which the network is exposed.
- Final plot twists and the campaign ending.
- Exact account level thresholds, prices, rewards and automation unlock costs.
- Exact location event timings, modifier compatibility and difficulty multipliers.
- Exact perk branch nodes, weapon attachment pool and role bonuses for operatives.
- The first complete autonomous operation's equipment budget and success targets.

Do not silently promote these open items into fixed canon.