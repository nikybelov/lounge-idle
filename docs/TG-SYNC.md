# Автосинк Telegram (телефон ↔ Mac)

Облако Telegram (`CloudStorage`) на Mac Desktop **не читает** сейв — поэтому нужен свой маленький сервер.

## Что получится

Игра сама пишет/читает прогресс по твоему Telegram `user.id`.  
Открыл на телефоне → открыл на Mac → касса та же. Без кодов.

## Разово настроить (Cloudflare, бесплатно)

1. Аккаунт на [dash.cloudflare.com](https://dash.cloudflare.com)  
2. В терминале из корня репо:

```bash
cd workers/tg-sync
npx wrangler login
npx wrangler kv namespace create SAVES
```

3. Вставь выданный `id` в `wrangler.toml` (поля `id` и `preview_id`)  
4. Секрет бота (из BotFather → API Token, **не свети в чат**):

```bash
npx wrangler secret put BOT_TOKEN
# вставь токен и Enter
```

5. Деплой:

```bash
npx wrangler deploy
```

Скрипт выведет URL вида `https://lounge-idle-tg-sync.<subdomain>.workers.dev`

6. В GitHub → Settings → Secrets → Actions добавь:

| Secret | Значение |
|---|---|
| `VITE_TG_SYNC_URL` | тот URL воркера |

7. В `.github/workflows/deploy-pages.yml` для job сборки TG уже можно прокинуть:

```yaml
VITE_TG_SYNC_URL: ${{ secrets.VITE_TG_SYNC_URL }}
```

8. Пуш в `telegram-miniapp` (или `main`) — пересоберётся `/tg/`.

## Проверка

1. Телефон: поиграй, сверни мини-апп  
2. Mac: открой бота  
3. Плашка: `с сервера …₽`

## Важно

- Игру открывать **только из бота** (нужен `initData`)  
- Токен бота только в Cloudflare Secret / GitHub Secret, не в коде  
- Если сервер не настроен, игра работает как раньше (только локально)
