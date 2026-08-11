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
| Дисклеймер 18+ (табачный сеттинг) | Экран при первом запуске TG |
| Нет крипты / не-TON | Не используем |
| `initData` на сервер | Не отправляем (пока только локальный сейв) |
| Имя из Telegram | Только префилл договора, без бэкенда |

**Контент:** idle про вымышленный лаунж, без инструкций курения. Платежи в будущем — только Telegram Stars.

## BotFather (руками)

1. [@BotFather](https://t.me/BotFather) → `/newbot` (или свой бот)
2. `/mybots` → бот → **Bot Settings** → **Configure Mini App** → **Enable Mini App**
3. URL: `https://<user>.github.io/lounge-idle/tg/`
4. **Configure Splash Screen** — тёмный `#0e0b08`, акцент `#c4a574`
5. **Menu Button** — «Играть» + тот же URL `/tg/`
6. Описание: idle-игра 18+, без реального табака

Ссылка: `https://t.me/YourBot/app` (после Main Mini App)

## Локальный тест

```bash
git checkout telegram-miniapp
npm run dev:tg
# или http://127.0.0.1:PORT/?tg=1
```

Полный тест — из Telegram по HTTPS `/tg/`.

## Обновления

- Правки TG → commit/push в `telegram-miniapp` → Pages обновит `/tg/` (и пересоберёт веб с `main`)
- Правки веба → commit/push в `main` → Pages обновит корень (и пересоберёт TG с `telegram-miniapp`)
