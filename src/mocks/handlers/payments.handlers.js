// handlers/payments.handlers.js
// Домен: Payments — платформа НЕ обрабатывает платёжные данные сама,
// а только хранит ссылку на транзакцию у стороннего провайдера и её статус.
import { http, HttpResponse, delay } from 'msw';
import { db, nextId, nowIso } from '../src/db';

const API = '/api';

export const paymentsHandlers = [
  http.get(`${API}/payments`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const enrollmentId = url.searchParams.get('enrollmentId');
    let list = db.payments;
    if (enrollmentId) list = list.filter((p) => p.enrollmentId === enrollmentId);
    return HttpResponse.json(list);
  }),

  http.get(`${API}/payments/:id`, async ({ params }) => {
    await delay(150);
    const payment = db.payments.find((p) => p.id === params.id);
    if (!payment) {
      return HttpResponse.json({ message: 'Payment not found' }, { status: 404 });
    }
    return HttpResponse.json(payment);
  }),

  // Создание "платёжного намерения" — платформа только инициирует запись,
  // сам платёж проходит на стороне провайдера (redirect/виджет).
  http.post(`${API}/payments/intent`, async ({ request }) => {
    await delay(250);
    const body = await request.json();
    const { enrollmentId, amount, currency = 'RUB', provider = 'yookassa' } = body;

    const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) {
      return HttpResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }

    const payment = {
      id: nextId('pay'),
      enrollmentId,
      provider,
      externalId: `ext_${Math.random().toString(16).slice(2, 8)}`,
      amount,
      currency,
      status: 'pending',
      createdAt: nowIso(),
      confirmedAt: null,
    };
    db.payments.push(payment);
    enrollment.paymentId = payment.id;
    enrollment.updatedAt = nowIso();

    // В реальном приложении здесь возвращается redirect-ссылка провайдера.
    return HttpResponse.json(
      { payment, redirectUrl: `https://pay.example-provider.ru/checkout/${payment.externalId}` },
      { status: 201 }
    );
  }),

  // Webhook от платёжного провайдера — сюда придёт нотификация об успехе/отказе.
  http.post(`${API}/payments/webhook`, async ({ request }) => {
    await delay(150);
    const body = await request.json();
    const { externalId, status } = body; // status: 'succeeded' | 'failed'

    const payment = db.payments.find((p) => p.externalId === externalId);
    if (!payment) {
      return HttpResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    payment.status = status;
    payment.confirmedAt = status === 'succeeded' ? nowIso() : null;

    const enrollment = db.enrollments.find((e) => e.id === payment.enrollmentId);
    if (enrollment) {
      if (status === 'succeeded') {
        enrollment.status = 'confirmed';
      } else if (status === 'failed') {
        enrollment.status = 'cancelled';
        const instance = db.productInstances.find((i) => i.id === enrollment.productInstanceId);
        if (instance) {
          instance.bookedCount = Math.max(0, instance.bookedCount - 1);
          instance.status = 'open';
        }
      }
      enrollment.updatedAt = nowIso();
    }

    return HttpResponse.json({ received: true, payment });
  }),
];
