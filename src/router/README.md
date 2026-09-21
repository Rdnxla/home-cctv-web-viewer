## Карта эндпоинтов

### Identity
- `GET /api/me`
- `GET/PATCH /api/accounts/:id`
- `GET /api/public/instructors/:slug` — публичная страница по ссылке
- `GET/PATCH /api/instructor-profiles/:id`
- `GET/PATCH /api/legal-entities/:id`

### Catalog
- `GET/POST /api/products`
- `GET/PATCH/DELETE /api/products/:id`
- `GET/POST /api/products/:id/instances`
- `GET/PATCH /api/product-instances/:id`

### Booking
- `GET/POST /api/enrollments`
- `GET/PATCH /api/enrollments/:id`
- `POST /api/enrollments/:id/cancel` — освобождает место, продвигает waitlist
- `GET /api/product-instances/:id/waitlist`
- `POST /api/waitlist/:id/claim` — клиент подтверждает освободившееся место

### Payments
- `GET /api/payments`, `GET /api/payments/:id`
- `POST /api/payments/intent` — создание платёжного намерения
- `POST /api/payments/webhook` — эмуляция callback от провайдера (`succeeded`/`failed`)

### Notifications
- `GET /api/notifications?accountId=&unreadOnly=`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/read-all`
- `POST /api/notifications/trigger-reminders` — эмуляция cron-джобы напоминаний

### Reporting
- `GET /api/reports/income?legalEntityId=&dateFrom=&dateTo=`
- `GET /api/reports/product-instances/:id/roster`
