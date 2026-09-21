// handlers/catalog.handlers.js
// Домен: Catalog — абстрактные Product и их конкретные запуски ProductInstance.
// Ничего не знает про "сноуборд" или "йогу" — только type/capacity/pricing.
import { http, HttpResponse, delay } from 'msw';
import { db, nextId, nowIso } from '../src/db';

const API = '/api';

export const catalogHandlers = [
  // Список продуктов инструктора (личный кабинет)
  http.get(`${API}/products`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const instructorProfileId = url.searchParams.get('instructorProfileId');
    let list = db.products;
    if (instructorProfileId) {
      list = list.filter((p) => p.instructorProfileId === instructorProfileId);
    }
    return HttpResponse.json(list);
  }),

  http.get(`${API}/products/:id`, async ({ params }) => {
    await delay(150);
    const product = db.products.find((p) => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  // Создание нового продукта — универсальный конструктор, тип передаётся как enum-строка
  http.post(`${API}/products`, async ({ request }) => {
    await delay(200);
    const body = await request.json();
    const product = {
      id: nextId('prod'),
      isActive: true,
      createdAt: nowIso(),
      ...body,
    };
    db.products.push(product);
    return HttpResponse.json(product, { status: 201 });
  }),

  http.patch(`${API}/products/:id`, async ({ params, request }) => {
    await delay(150);
    const product = db.products.find((p) => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    const body = await request.json();
    Object.assign(product, body);
    return HttpResponse.json(product);
  }),

  http.delete(`${API}/products/:id`, async ({ params }) => {
    await delay(150);
    const idx = db.products.findIndex((p) => p.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    // Мягкое удаление — продукт не пропадает из истории прошлых записей.
    db.products[idx].isActive = false;
    return HttpResponse.json(db.products[idx]);
  }),

  // Инстансы конкретного продукта (даты запусков)
  http.get(`${API}/products/:id/instances`, async ({ params }) => {
    await delay(150);
    const list = db.productInstances.filter((i) => i.productId === params.id);
    return HttpResponse.json(list);
  }),

  http.get(`${API}/product-instances/:id`, async ({ params }) => {
    await delay(150);
    const instance = db.productInstances.find((i) => i.id === params.id);
    if (!instance) {
      return HttpResponse.json({ message: 'Instance not found' }, { status: 404 });
    }
    return HttpResponse.json(instance);
  }),

  http.post(`${API}/products/:id/instances`, async ({ params, request }) => {
    await delay(200);
    const product = db.products.find((p) => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    const body = await request.json();
    const instance = {
      id: nextId('inst'),
      productId: product.id,
      bookedCount: 0,
      status: 'open',
      capacityMax: body.capacityMax ?? product.capacity.max,
      createdAt: nowIso(),
      ...body,
    };
    db.productInstances.push(instance);
    return HttpResponse.json(instance, { status: 201 });
  }),

  http.patch(`${API}/product-instances/:id`, async ({ params, request }) => {
    await delay(150);
    const instance = db.productInstances.find((i) => i.id === params.id);
    if (!instance) {
      return HttpResponse.json({ message: 'Instance not found' }, { status: 404 });
    }
    const body = await request.json();
    Object.assign(instance, body);
    return HttpResponse.json(instance);
  }),
];
