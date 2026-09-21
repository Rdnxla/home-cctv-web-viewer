// handlers/reporting.handlers.js
// Домен: Reporting — читает данные из Booking/Payments, но не содержит
// их бизнес-логики. Нужен для выгрузок по доходам ИП/самозанятых.
import { http, HttpResponse, delay } from 'msw';
import { db } from '../src/db';

const API = '/api';

export const reportingHandlers = [
  // Отчёт по доходам инструктора (юр.лица) за период — источник для налоговой отчётности.
  http.get(`${API}/reports/income`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const legalEntityId = url.searchParams.get('legalEntityId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const legalEntity = db.legalEntities.find((e) => e.id === legalEntityId);
    if (!legalEntity) {
      return HttpResponse.json({ message: 'Legal entity not found' }, { status: 404 });
    }

    const instructorProfile = db.instructorProfiles.find(
      (p) => p.legalEntityId === legalEntityId
    );
    const productIds = db.products
      .filter((p) => p.instructorProfileId === instructorProfile?.id)
      .map((p) => p.id);
    const instanceIds = db.productInstances
      .filter((i) => productIds.includes(i.productId))
      .map((i) => i.id);

    const relevantEnrollments = db.enrollments.filter((e) =>
      instanceIds.includes(e.productInstanceId)
    );
    const relevantPayments = db.payments.filter(
      (p) =>
        relevantEnrollments.some((e) => e.id === p.enrollmentId) &&
        p.status === 'succeeded' &&
        (!dateFrom || p.confirmedAt >= dateFrom) &&
        (!dateTo || p.confirmedAt <= dateTo)
    );

    const totalAmount = relevantPayments.reduce((sum, p) => sum + p.amount, 0);

    return HttpResponse.json({
      legalEntity,
      period: { dateFrom: dateFrom ?? null, dateTo: dateTo ?? null },
      totalAmount,
      currency: 'RUB',
      transactionsCount: relevantPayments.length,
      transactions: relevantPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        confirmedAt: p.confirmedAt,
        provider: p.provider,
        externalId: p.externalId,
      })),
    });
  }),

  // Сводка по конкретному инстансу — кто оплатил, кто в ожидании, кто в очереди.
  http.get(`${API}/reports/product-instances/:id/roster`, async ({ params }) => {
    await delay(200);
    const instance = db.productInstances.find((i) => i.id === params.id);
    if (!instance) {
      return HttpResponse.json({ message: 'Instance not found' }, { status: 404 });
    }
    const enrollments = db.enrollments
      .filter((e) => e.productInstanceId === instance.id)
      .map((e) => ({
        ...e,
        account: db.accounts.find((a) => a.id === e.accountId),
        payment: db.payments.find((p) => p.id === e.paymentId) ?? null,
      }));
    const waitlist = db.waitlistEntries
      .filter((w) => w.productInstanceId === instance.id)
      .sort((a, b) => a.position - b.position);

    return HttpResponse.json({ instance, enrollments, waitlist });
  }),
];
