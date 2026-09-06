## Карта эндпоинтов

- GET /api/nvr	Инфо о NVR: модель, прошивка, бюджет PoE, диск
- GET /api/nvr/ports	4 PoE-порта
- GET /api/cameras	Камеры в порядке: online, online, error, no_connection
- GET /api/cameras/:id	Одна камера
- GET /api/cameras/:id/stream	Параметры RTSP-потока