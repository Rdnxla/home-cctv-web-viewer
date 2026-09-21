// композиционный слой
import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

const API = '/api';

function buildAccountContext(accountId) {
  const account = db.accounts.find((a) => a.id === accountId);
  if (!account) return null;

  const isInstructor = account.roles.includes('instructor');
  const instructorProfile = isInstructor
    ? db.instructorProfiles.find((p) => p.accountId === accountId) ?? null
    : null;
  const legalEntity = instructorProfile
    ? db.legalEntities.find((e) => e.id === instructorProfile.legalEntityId) ?? null
    : null;

  const unreadNotificationsCount = db.notifications.filter(
    (n) => n.accountId === accountId && !n.isRead
  ).length;

  let stats;
  if (isInstructor && instructorProfile) {
    const productIds = db.products
      .filter((p) => p.instructorProfileId === instructorProfile.id)
      .map((p) => p.id);
    const instanceIds = db.productInstances
      .filter((i) => productIds.includes(i.productId))
      .map((i) => i.id);
    const now = new Date();
    const upcomingInstancesCount = db.productInstances.filter(
      (i) =>
        instanceIds.includes(i.id) &&
        i.status !== 'cancelled' &&
        new Date(i.endDate ?? i.startDate) >= now
    ).length;

    stats = {
      activeProductsCount: productIds.length,
      upcomingInstancesCount,
      pendingPaymentCount: db.enrollments.filter(
        (e) => instanceIds.includes(e.productInstanceId) && e.status === 'pending_payment'
      ).length,
      waitlistedCount: db.enrollments.filter(
        (e) => instanceIds.includes(e.productInstanceId) && e.status === 'waitlisted'
      ).length,
    };
  } else {
    const myEnrollments = db.enrollments.filter((e) => e.accountId === accountId);
    stats = {
      upcomingBookingsCount: myEnrollments.filter((e) =>
        ['confirmed', 'pending_payment'].includes(e.status)
      ).length,
      waitlistedCount: myEnrollments.filter((e) => e.status === 'waitlisted').length,
    };
  }

  return {
    account,
    role: isInstructor ? 'instructor' : 'client',
    instructorProfile,
    legalEntity,
    unreadNotificationsCount,
    stats,
  };
}

export const viewsHandlers = [
  // Всё для сайдбара/хедера текущего пользователя одним запросом:
  // аккаунт + (если инструктор) профиль/юрлицо + счётчики для бейджей.
  // В реальном API accountId берётся из сессии, тут — заглушка "первый аккаунт".
  http.get(`${API}/me/context`, async () => {
    await delay(150);
    const context = buildAccountContext(db.accounts[4].id);
    return HttpResponse.json(context);
  }),

  http.get(`${API}/accounts/:id/context`, async ({ params }) => {
    await delay(150);
    const context = buildAccountContext(params.id);
    if (!context) {
      return HttpResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    return HttpResponse.json(context);
  }),

  // Полный дашборд инструктора: профиль + юрлицо + продукты со всеми их
  // инстансами + последние записи + непрочитанные уведомления.
  // Раньше это было 5 запросов (profile, legalEntity, products, instances×N, notifications).
  http.get(`${API}/instructor-profiles/:id/dashboard`, async ({ params }) => {
    await delay(250);
    const profile = db.instructorProfiles.find((p) => p.id === params.id);
    if (!profile) {
      return HttpResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    const legalEntity = db.legalEntities.find((e) => e.id === profile.legalEntityId) ?? null;

    const products = db.products
      .filter((p) => p.instructorProfileId === profile.id)
      .map((product) => ({
        ...product,
        instances: db.productInstances.filter((i) => i.productId === product.id),
      }));

    const instanceIds = products.flatMap((p) => p.instances.map((i) => i.id));

    const recentEnrollments = db.enrollments
      .filter((e) => instanceIds.includes(e.productInstanceId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)

    const unreadNotifications = db.notifications
      .filter((n) => n.accountId === profile.accountId && !n.isRead)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return HttpResponse.json({
      profile,
      legalEntity,
      products,
      recentEnrollments,
      unreadNotifications,
    });
  }),

  // Полный кабинет клиента: аккаунт + все его записи (с продуктом и инстансом
  // внутри каждой) + все уведомления. Раньше — отдельные запросы на каждую сущность.
  http.get(`${API}/accounts/:id/client-dashboard`, async ({ params }) => {
    await delay(250);
    const account = db.accounts.find((a) => a.id === params.id);
    if (!account) {
      return HttpResponse.json({ message: 'Account not found' }, { status: 404 });
    }

    const enrollments = db.enrollments
      .filter((e) => e.accountId === account.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const notifications = db.notifications
      .filter((n) => n.accountId === account.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return HttpResponse.json({ account, enrollments, notifications });
  }),

  // Публичная страница инструктора уже была composite (см. accounts.handlers.js:
  // GET /api/public/instructors/:slug) — profile + products одним ответом.
];
