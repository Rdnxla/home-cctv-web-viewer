import accounts from './data/accounts.json';

// Глубокое клонирование, чтобы каждый запуск (например, каждый тест)
// начинался с чистого состояния и не мутировал исходные json-модули.
const clone = data => JSON.parse(JSON.stringify(data));
const idCounters = {};

function createStore() {
  return {
    accounts: clone(accounts),
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

export {db, nextId, nowIso, resetDb};
