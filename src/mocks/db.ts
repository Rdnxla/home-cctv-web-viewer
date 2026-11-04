import type {User} from '@/api/auth/types';
import accounts from './data/accounts.json';

interface MockAccount extends User {
  password: string;
}

interface MockDb {
  accounts: MockAccount[];
}

const idCounters: Record<string, number> = {};

// Глубокое клонирование, чтобы каждый запуск (например, каждый тест)
// начинался с чистого состояния и не мутировал исходные json-модули.
function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function createStore(): MockDb {
  // JSON-импорт расширяет литералы status и roles до string, поэтому нужно приведение к MockAccount.
  return {
    accounts: clone(accounts) as MockAccount[],
  };
}

const db = createStore();

function resetDb() {
  Object.assign(db, createStore());
}

function nextId(prefix: string) {
  const id = (idCounters[prefix] ?? 0) + 1;
  idCounters[prefix] = id;
  return `${prefix}_${Date.now()}_${id}`;
}

function nowIso() {
  return new Date().toISOString();
}

export type {MockAccount};
export {db, nextId, nowIso, resetDb};
