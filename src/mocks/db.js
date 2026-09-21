import accounts from './data/accounts.json';
import instructorProfiles from './data/instructorProfiles.json';
import legalEntities from './data/legalEntities.json';
import products from './data/products.json';
import productInstances from './data/productInstances.json';
import enrollments from './data/enrollments.json';
import waitlistEntries from './data/waitlistEntries.json';
import payments from './data/payments.json';
import notifications from './data/notifications.json';

// Глубокое клонирование, чтобы каждый запуск (например, каждый тест)
// начинался с чистого состояния и не мутировал исходные json-модули.
const clone = (data) => JSON.parse(JSON.stringify(data));
const idCounters = {};

function createStore() {
  return {
    accounts: clone(accounts),
    instructorProfiles: clone(instructorProfiles),
    legalEntities: clone(legalEntities),
    products: clone(products),
    productInstances: clone(productInstances),
    enrollments: clone(enrollments),
    waitlistEntries: clone(waitlistEntries),
    payments: clone(payments),
    notifications: clone(notifications),
  };
}

const db = createStore();

function resetDb() {
  Object.assign(db, createStore());
}

function nextId(prefix) {
  idCounters[prefix] = (idCounters[prefix] || 0) + 1;
  return `${prefix}_${Date.now()}_${idCounters[prefix]}`;
}

function nowIso() {
  return new Date().toISOString();
}

export {
  db,
  resetDb,
  nextId,
  nowIso,
}