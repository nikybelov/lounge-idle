# Telegram Mini App

Ветка: `telegram-miniapp` → URL `/lounge-idle/tg/`  
Веб: `main` → `/lounge-idle/`

## Деплой

Workflow собирает **оба** артефакта (веб с `main` + TG с `telegram-miniapp`).

Сейчас Environment **github-pages** в GitHub пускает деплой только с ветки `main`.  
Поэтому после правок в `telegram-miniapp` нужен пуш/`workflow_dispatch` с `main` (или добавь ветку `telegram-miniapp` в  
Settings → Environments → github-pages → Deployment branches).

Синк прогресса телефон ↔ Mac: Telegram CloudStorage (код в ветке `telegram-miniapp`).
