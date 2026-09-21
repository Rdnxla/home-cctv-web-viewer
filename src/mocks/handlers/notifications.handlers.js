// handlers/notifications.handlers.js
// Домен: Notifications — события, порождаемые другими доменами
// (waitlist_opened, waitlist_joined, reminder, payment_due).
import { http, HttpResponse, delay } from 'msw';
import { db, nextId, nowIso } from '../src/db';

const API = '/api';

export const notificationsHandlers = [
  http.get(`${API}/notifications`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let list = db.notifications;
    if (accountId) list = list.filter((n) => n.accountId === accountId);
    if (unreadOnly) list = list.filter((n) => !n.isRead);

    list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return HttpResponse.json(list);
  }),

  http.patch(`${API}/notifications/:id/read`, async ({ params }) => {
    await delay(100);
    const notification = db.notifications.find((n) => n.id === params.id);
    if (!notification) {
      return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    }
    notification.isRead = true;
    return HttpResponse.json(notification);
  }),

  http.post(`${API}/notifications/read-all`, async ({ request }) => {
    await delay(150);
    const { accountId } = await request.json();
    db.notifications
      .filter((n) => n.accountId === accountId)
      .forEach((n) => (n.isRead = true));
    return HttpResponse.json({ success: true });
  }),

  // Эмуляция cron-джобы: находит инстансы, которые стартуют через N дней,
  // и создаёт напоминания всем подтверждённым участникам, у которых их ещё не было.
  http.post(`${API}/notifications/trigger-reminders`, async ({ request }) => {
    await delay(300);
    const { daysBefore = 3 } = await request.json().catch(() => ({}));

    const targetDate = new Date(Date.now() + daysBefore * 24 * 60 * 60 * 1000);
    const created = [];

    db.productInstances
      .filter((instance) => {
        const start = new Date(instance.startDate);
        return (
          start.toDateString() === targetDate.toDateString() &&
          instance.status !== 'cancelled'
        );
      })
      .forEach((instance) => {
        const confirmedEnrollments = db.enrollments.filter(
          (e) => e.productInstanceId === instance.id && e.status === 'confirmed'
        );
        confirmedEnrollments.forEach((enrollment) => {
          const notification = {
            id: nextId('notif'),
            accountId: enrollment.accountId,
            type: 'reminder',
            payload: { productInstanceId: instance.id, startsInDays: daysBefore },
            isRead: false,
            createdAt: nowIso(),
          };
          db.notifications.push(notification);
          created.push(notification);
        });
      });

    return HttpResponse.json({ createdCount: created.length, notifications: created });
  }),
];
