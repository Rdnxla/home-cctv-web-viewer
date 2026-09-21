import { http, HttpResponse, delay } from 'msw';
import { db, nowIso } from '../src/db';

const API = '/api';

export const accountsHandlers = [
  // Текущий залогиненный аккаунт (в реальном приложении — по токену/сессии)
  http.get(`${API}/me`, async () => {
    await delay(150);
    return HttpResponse.json(db.accounts[0]);
  }),

  http.get(`${API}/accounts/:id`, async ({ params }) => {
    await delay(150);
    const account = db.accounts.find((a) => a.id === params.id);
    if (!account) {
      return HttpResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    return HttpResponse.json(account);
  }),

  http.patch(`${API}/accounts/:id`, async ({ params, request }) => {
    await delay(150);
    const account = db.accounts.find((a) => a.id === params.id);
    if (!account) {
      return HttpResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    const body = await request.json();
    Object.assign(account, body);
    return HttpResponse.json(account);
  }),

  // Публичная страница инструктора по slug — то, на что ведёт публичная ссылка.
  http.get(`${API}/public/instructors/:slug`, async ({ params }) => {
    await delay(200);
    const profile = db.instructorProfiles.find(
      (p) => p.slug === params.slug && p.isPublished
    );
    if (!profile) {
      return HttpResponse.json({ message: 'Instructor not found' }, { status: 404 });
    }
    const products = db.products.filter(
      (p) => p.instructorProfileId === profile.id && p.isActive
    );
    // Внешнему клиенту не отдаём accountId/legalEntityId — только публичные поля.
    const { accountId, legalEntityId, ...publicProfile } = profile;
    return HttpResponse.json({ profile: publicProfile, products });
  }),

  http.get(`${API}/instructor-profiles/:id`, async ({ params }) => {
    await delay(150);
    const profile = db.instructorProfiles.find((p) => p.id === params.id);
    if (!profile) {
      return HttpResponse.json({ message: 'Profile not found' }, { status: 404 });
    }
    return HttpResponse.json(profile);
  }),

  http.patch(`${API}/instructor-profiles/:id`, async ({ params, request }) => {
    await delay(150);
    const profile = db.instructorProfiles.find((p) => p.id === params.id);
    if (!profile) {
      return HttpResponse.json({ message: 'Profile not found' }, { status: 404 });
    }
    const body = await request.json();
    Object.assign(profile, body);
    return HttpResponse.json(profile);
  }),

  // Юр.лицо — нужно инструктору в личном кабинете и для отчетности.
  http.get(`${API}/legal-entities/:id`, async ({ params }) => {
    await delay(150);
    const entity = db.legalEntities.find((e) => e.id === params.id);
    if (!entity) {
      return HttpResponse.json({ message: 'Legal entity not found' }, { status: 404 });
    }
    return HttpResponse.json(entity);
  }),

  http.patch(`${API}/legal-entities/:id`, async ({ params, request }) => {
    await delay(150);
    const entity = db.legalEntities.find((e) => e.id === params.id);
    if (!entity) {
      return HttpResponse.json({ message: 'Legal entity not found' }, { status: 404 });
    }
    const body = await request.json();
    Object.assign(entity, body, { updatedAt: nowIso() });
    return HttpResponse.json(entity);
  }),
];
