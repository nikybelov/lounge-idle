# Telegram Mini App — чеклист

Ветка: `telegram-miniapp`  
Веб: `main`

## URL (отдельные, ничего не затирается)

После деплоя GitHub Pages:

| Версия | URL |
|---|---|
| Веб | `https://<user>.github.io/lounge-idle/` |
| Telegram | `https://<user>.github.io/lounge-idle/tg/` |

В BotFather указывай **только** URL с `/tg/`.

Пуш в `main` или `telegram-miniapp` пересобирает **оба** сайта вместе (workflow `Deploy Web + Telegram Pages`).

## Соответствие правилам Telegram (кратко)

| Требование | Статус в проекте |
|---|---|
| HTTPS хостинг | GitHub Pages `/tg/` |
| WebApp SDK (`telegram-web-app.js`) | Подключён в `index.html` |
| `ready()` + `expand()` | `prepareTelegramMiniApp()` |
| Тема / header / background | Из `themeParams` + бренд-фолбэк |
| Viewport + safe area CSS | `--tg-viewport-*`, `--tg-safe-area-*` |
| Не выгонять в Safari внутри Mini App | Gate выключен для Mini App |
| Отдельный сейв от веба | ключи `*-tg` |
| Синк телефон ↔ Mac | `CloudStorage` (чанки `li_save_*`) |
| Дисклеймер 18+ (табачный сеттинг) | Экран при первом запуске TG |
| Нет крипты / не-TON | Не используем |
| `initData` на сервер | Не нужен для сейва (CloudStorage) |
| Имя из Telegram | Только префилл договора, без бэкенда |

**Контент:** idle про вымышленный лаунж, без инструкций курения. Платежи в будущем — только Telegram Stars.

## Прогресс между устройствами

Сейв пишется в `localStorage` **и** в Telegram CloudStorage (привязан к твоему аккаунту и боту).

### Как проверить

1. На **телефоне** открой бота → поиграй → **подожди 2–3 сек** (или сверни мини-апп).
2. На **Mac** открой того же бота через Telegram Desktop (не сайт github.io).
3. Должен мелькнуть тост «Прогресс подтянут с другого устройства».

Если на Mac уже был свой старый сейв — он мог «побеждать». Один раз сбрось только Mac:

1. В мини-аппе на Mac открой URL с `?reset=1`  
   (в Desktop: меню ⋮ → «Открыть в браузере» не нужно — проще:  
   BotFather/ссылка `https://t.me/DymnayaImperiyaBot` заново, или в настройках игры «Начать заново» только если ок потерять mac-сейв).
2. Либо добавь в WebApp URL временно:  
   `https://nikybelov.github.io/lounge-idle/tg/?reset=1`  
   через BotFather Configure Mini App → URL, открой раз, верни URL без `?reset=1`.

Важно: синк только **внутри Telegram** (телефон ↔ Mac Desktop), не с веб-сайтом.

## BotFather (руками) — скопируй

Бот: `@DymnayaImperiyaBot`

### 1. Аватар

`/mybots` → бот → **Edit Bot** → **Edit Botpic**  
Аватар — **Огонёк** (тот же SVG, что в игре): `public/assets/bot-avatar.jpg`  
Исходник: `public/assets/bot-avatar-ogonek.svg`  
После деплоя: `…/lounge-idle/tg/assets/bot-avatar.jpg`

### 2. Описание (Description)

`/setdescription` → бот → вставь:

```
Дымная Империя — idle про свой кальянный лаунж.
Зарабатывай, нанимай команду, расти империю дыма.
18+. Вымысел, без инструкций курения.
```

### 3. About (коротко, до ~120 символов)

`/setabouttext` → бот → вставь:

```
Idle-игра: свой лаунж, команда и империя дыма. 18+
```

### 4. Splash Screen

`/mybots` → бот → **Bot Settings** → **Configure Mini App** → **Configure Splash Screen**

**Шаг 1 — иконка:** пришли файл `public/assets/splash-icon.svg`  
(силуэт Огонька, 512×512, один `<path>` — как требует BotFather).  
Цвета в SVG **не** пишутся.

**Шаг 2 — цвета** (BotFather спросит отдельно, после иконки).  
Важно: **header и background оба `#0e0b08`**. Не ставь `#c4a574` на фон — иначе сверху полоска другого цвета.

| Поле | Значение |
|---|---|
| Header | `#0e0b08` |
| Background | `#0e0b08` |
| Light (если спросит пару) | `#f3e8d8 #0e0b08` |

`#c4a574` — акцент кнопок в игре, не цвет splash-фона.

### 5. Mini App URL + Menu Button

- Mini App URL: `https://nikybelov.github.io/lounge-idle/tg/`
- Menu Button: текст **Играть**, тот же URL

Ссылка: `https://t.me/DymnayaImperiyaBot`

## Локальный тест

```bash
git checkout telegram-miniapp
npm run dev:tg
# или http://127.0.0.1:PORT/?tg=1
```

CloudStorage работает **только внутри Telegram** (не в обычном браузере с `?tg=1`).

## Обновления

- Правки TG → commit/push в `telegram-miniapp` → Pages обновит `/tg/` (и пересоберёт веб с `main`)
- Правки веба → commit/push в `main` → Pages обновит корень (и пересоберёт TG с `telegram-miniapp`)
