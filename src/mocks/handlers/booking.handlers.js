// handlers/booking.handlers.js
// Домен: Booking — Enrollment (конечный автомат статусов) и WaitlistEntry.
// Логика не знает деталей продукта — работает только с capacityMax/bookedCount.
import { http, HttpResponse, delay } from 'msw';
import { db, nextId, nowIso } from '../src/db';

const API = '/api';

function serializeEnrollment(enrollment) {
  const account = db.accounts.find((a) => a.id === enrollment.accountId);
  const instance = db.productInstances.find((i) => i.id === enrollment.productInstanceId);
  return {
    ...enrollment,
    account: account
      ? { id: account.id, firstName: account.firstName, lastName: account.lastName, avatarUrl: account.avatarUrl }
      : null,
    productInstance: instance ?? null,
  };
}

export const bookingHandlers = [
  // Список записей — с фильтрами по клиенту или по инстансу (для дашборда инструктора)
  http.get(`${API}/enrollments`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    const productInstanceId = url.searchParams.get('productInstanceId');
    const status = url.searchParams.get('status');

    let list = db.enrollments;
    if (accountId) list = list.filter((e) => e.accountId === accountId);
    if (productInstanceId) list = list.filter((e) => e.productInstanceId === productInstanceId);
    if (status) list = list.filter((e) => e.status === status);

    return HttpResponse.json(list.map(serializeEnrollment));
  }),

  http.get(`${API}/enrollments/:id`, async ({ params }) => {
    await delay(150);
    const enrollment = db.enrollments.find((e) => e.id === params.id);
    if (!enrollment) {
      return HttpResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }
    return HttpResponse.json(serializeEnrollment(enrollment));
  }),

  // Создание записи. Ядро бизнес-правила:
  // если в инстансе есть место — enrollment уходит в pending_payment,
  // если мест нет — клиент автоматически попадает в waitlist.
  http.post(`${API}/enrollments`, async ({ request }) => {
    await delay(250);
    const body = await request.json();
    const { accountId, productInstanceId } = body;

    const instance = db.productInstances.find((i) => i.id === productInstanceId);
    if (!instance) {
      return HttpResponse.json({ message: 'Product instance not found' }, { status: 404 });
    }

    const hasSpace = instance.bookedCount < instance.capacityMax;

    const enrollment = {
      id: nextId('enr'),
      accountId,
      productInstanceId,
      status: hasSpace ? 'pending_payment' : 'waitlisted',
      paymentId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.enrollments.push(enrollment);

    if (hasSpace) {
      instance.bookedCount += 1;
      if (instance.bookedCount >= instance.capacityMax) instance.status = 'full';
    } else {
      const position =
        db.waitlistEntries.filter((w) => w.productInstanceId === productInstanceId).length + 1;
      const waitlistEntry = {
        id: nextId('wl'),
        enrollmentId: enrollment.id,
        accountId,
        productInstanceId,
        position,
        autoNotify: true,
        notifiedAt: null,
        expiresAt: null,
        createdAt: nowIso(),
      };
      db.waitlistEntries.push(waitlistEntry);

      db.notifications.push({
        id: nextId('notif'),
        accountId,
        type: 'waitlist_joined',
        payload: { productInstanceId, position },
        isRead: false,
        createdAt: nowIso(),
      });
    }

    return HttpResponse.json(serializeEnrollment(enrollment), { status: 201 });
  }),

  // Смена статуса записи (например, инструктор подтверждает вручную)
  http.patch(`${API}/enrollments/:id`, async ({ params, request }) => {
    await delay(150);
    const enrollment = db.enrollments.find((e) => e.id === params.id);
    if (!enrollment) {
      return HttpResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }
    const body = await request.json();
    Object.assign(enrollment, body, { updatedAt: nowIso() });
    return HttpResponse.json(serializeEnrollment(enrollment));
  }),

  // Отмена записи — освобождает место и, если есть waitlist, продвигает первого в очереди.
  http.post(`${API}/enrollments/:id/cancel`, async ({ params }) => {
    await delay(200);
    const enrollment = db.enrollments.find((e) => e.id === params.id);
    if (!enrollment) {
      return HttpResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }

    const wasCounted = ['confirmed', 'pending_payment'].includes(enrollment.status);
    enrollment.status = 'cancelled';
    enrollment.updatedAt = nowIso();

    const instance = db.productInstances.find((i) => i.id === enrollment.productInstanceId);
    if (instance && wasCounted) {
      instance.bookedCount = Math.max(0, instance.bookedCount - 1);
      instance.status = 'open';

      const nextInLine = db.waitlistEntries
        .filter((w) => w.productInstanceId === instance.id && !w.notifiedAt)
        .sort((a, b) => a.position - b.position)[0];

      if (nextInLine) {
        nextInLine.notifiedAt = nowIso();
        nextInLine.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        db.notifications.push({
          id: nextId('notif'),
          accountId: nextInLine.accountId,
          type: 'waitlist_opened',
          payload: {
            productInstanceId: instance.id,
            enrollmentId: nextInLine.enrollmentId,
            expiresAt: nextInLine.expiresAt,
          },
          isRead: false,
          createdAt: nowIso(),
        });
      }
    }

    return HttpResponse.json(serializeEnrollment(enrollment));
  }),

  // Очередь ожидания по конкретному инстансу
  http.get(`${API}/product-instances/:id/waitlist`, async ({ params }) => {
    await delay(150);
    const list = db.waitlistEntries
      .filter((w) => w.productInstanceId === params.id)
      .sort((a, b) => a.position - b.position);
    return HttpResponse.json(list);
  }),

  // Клиент из waitlist подтверждает место (переводит свою запись в pending_payment)
  http.post(`${API}/waitlist/:id/claim`, async ({ params }) => {
    await delay(200);
    const waitlistEntry = db.waitlistEntries.find((w) => w.id === params.id);
    if (!waitlistEntry) {
      return HttpResponse.json({ message: 'Waitlist entry not found' }, { status: 404 });
    }
    const enrollment = db.enrollments.find((e) => e.id === waitlistEntry.enrollmentId);
    const instance = db.productInstances.find((i) => i.id === waitlistEntry.productInstanceId);

    if (!enrollment || !instance) {
      return HttpResponse.json({ message: 'Related records not found' }, { status: 404 });
    }
    if (instance.bookedCount >= instance.capacityMax) {
      return HttpResponse.json({ message: 'No spots available anymore' }, { status: 409 });
    }

    enrollment.status = 'pending_payment';
    enrollment.updatedAt = nowIso();
    instance.bookedCount += 1;
    if (instance.bookedCount >= instance.capacityMax) instance.status = 'full';

    db.waitlistEntries = db.waitlistEntries.filter((w) => w.id !== waitlistEntry.id);

    return HttpResponse.json(serializeEnrollment(enrollment));
  }),
];
