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
Открой игру на телефоне → подожди пару секунд / сверни мини-апп → на Mac в том же боте прогресс подтянется.

Если на Mac уже был **старый** локальный сейв новее облака — победит он. Сброс: `?reset=1` в URL мини-аппа или очистка данных WebView.

## BotFather (руками) — скопируй

Бот: `@DymnayaImperiyaBot`

### 1. Аватар

`/mybots` → бот → **Edit Bot** → **Edit Botpic**  
Файл в репо: `public/assets/bot-avatar.jpg`  
(или открой на Pages после деплоя: `…/lounge-idle/tg/assets/bot-avatar.jpg`)

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

| Поле | Значение |
|---|---|
| Background | `#0e0b08` |
| Accent / button | `#c4a574` |

Картинку splash — по желанию тот же `bot-avatar.jpg` или кадр из игры.

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
