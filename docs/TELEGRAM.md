# Telegram Mini App — чеклист

Ветка: `telegram-miniapp`  
Веб остаётся на `main`.

## Соответствие правилам Telegram (кратко)

| Требование | Статус в проекте |
|---|---|
| HTTPS хостинг | Нужен деплой (GitHub Pages / Cloudflare) |
| WebApp SDK (`telegram-web-app.js`) | Подключён в `index.html` |
| `ready()` + `expand()` | `prepareTelegramMiniApp()` |
| Тема / header / background | Из `themeParams` + бренд-фолбэк |
| Viewport + safe area CSS | `--tg-viewport-*`, `--tg-safe-area-*` |
| Не выгонять в Safari внутри Mini App | Gate выключен для Mini App |
| Отдельный сейв от веба | ключи `*-tg` |
| Дисклеймер 18+ (табачный сеттинг) | Экран при первом запуске TG |
| Нет крипты / не-TON | Не используем |
| `initData` на сервер | Не отправляем (пока только локальный сейв) |
| Имя из Telegram | Только префилл договора, без бэкенда |

**Важно по контенту:** игра — вымышленный idle про лаунж, без инструкций курения. Для Telegram держим 18+ дисклеймер. Платный контент в будущем — только через Telegram Stars (не сторонние кассы в Mini App).

## BotFather (руками)

1. [@BotFather](https://t.me/BotFather) → `/newbot` (или существующий бот)
2. `/mybots` → бот → **Bot Settings** → **Configure Mini App** → **Enable Mini App**
3. URL: HTTPS-адрес деплоя этой ветки (см. ниже)
4. **Configure Splash Screen** — иконка + цвета (тёмный `#0e0b08`, акцент `#c4a574`)
5. **Menu Button** (`/setmenubutton`) — текст «Играть» + тот же URL  
   или Main Mini App → кнопка **Open** в профиле бота
6. Описание бота: что это idle-игра 18+, без реального табака

Ссылка вида: `https://t.me/YourBot/app` (после настройки Main Mini App)

## Деплой URL для бота

Вариант A — GitHub Pages с этой ветки (workflow `Deploy Telegram Mini App`):

- Пуш в `telegram-miniapp` → сборка с `VITE_FLAVOR=telegram`
- URL: `https://<user>.github.io/lounge-idle/`  
  (если Pages смотрит на артефакт этого workflow; веб с `main` лучше держать отдельно на Cloudflare/другом хосте)

Вариант B — отдельный хост только для TG (рекомендуется, чтобы не затирать веб):

```bash
git checkout telegram-miniapp
npm run build:tg
# залить dist/ на Cloudflare Pages / Vercel / свой HTTPS
```

## Локальный тест

```bash
npm run dev:tg
# или http://127.0.0.1:PORT/?tg=1
```

Полный тест — только из Telegram по HTTPS URL бота.

## Обновления

Правки → commit в `telegram-miniapp` → push → деплой.  
Веб (`main`) не меняется, пока не смержите/не задеплоите его отдельно.
