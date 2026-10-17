import type {EventType, NvrEvent} from '@/entities/event';
import {EVENT_TYPE_META} from '@/entities/event';
import {cameras} from './nvr';
import type {Camera} from './nvrtypes';

/**
 * Журнал событий для моков: ~640 записей за 30 дней.
 * Генератор детерминированный (фиксированное зерно), поэтому набор событий одинаков
 * при каждом запуске, а время отсчитывается от момента загрузки модуля.
 */

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const EVENT_COUNT = 640;
const HISTORY_DAYS = 30;
const SEED = 20_261_017;
const PARK_MILLER_MODULUS = 2_147_483_647;
const PARK_MILLER_MULTIPLIER = 16_807;
const POE_PORT_LIMIT_W = 30;

/** Park–Miller: без побитовых операций, точен в пределах Number */
function createRandom(seed: number) {
  let state = seed % PARK_MILLER_MODULUS;
  return () => {
    state = (state * PARK_MILLER_MULTIPLIER) % PARK_MILLER_MODULUS;
    return (state - 1) / (PARK_MILLER_MODULUS - 1);
  };
}

const random = createRandom(SEED);

function randomInt(min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

/** Относительная частота типов: детекции — основная масса, тревоги — редкость */
const TYPE_WEIGHTS: {type: EventType; weight: number}[] = [
  {type: 'motion', weight: 30},
  {type: 'person', weight: 18},
  {type: 'vehicle', weight: 12},
  {type: 'line_crossing', weight: 8},
  {type: 'intrusion', weight: 4},
  {type: 'tampering', weight: 1},
  {type: 'video_loss', weight: 2},
  {type: 'power_failure', weight: 1},
  {type: 'disk_error', weight: 1},
  {type: 'disk_full', weight: 2},
  {type: 'poe_overload', weight: 3},
  {type: 'network_unstable', weight: 4},
  {type: 'login_failed', weight: 5},
];
const TOTAL_WEIGHT = TYPE_WEIGHTS.reduce((sum, {weight}) => sum + weight, 0);

/** События самого регистратора — без камеры */
const DEVICE_EVENT_TYPES = new Set<EventType>(['disk_error', 'disk_full', 'login_failed', 'power_failure']);

const CAMERA_ZONES: Record<string, string[]> = {
  'cam-1': ['Крыльцо', 'Калитка'],
  'cam-2': ['Въезд', 'Ворота'],
  'cam-3': ['Парковка', 'Проезд'],
};

interface MessageContext {
  camera: Camera | null;
  zone: string;
}

const MESSAGE_BUILDERS: Record<EventType, (context: MessageContext) => string> = {
  disk_error: () => `HDD1: ошибка чтения, переназначено секторов: ${randomInt(1, 24)}`,
  disk_full: () => `HDD1: свободно ${randomInt(3, 9)}%, старые записи будут перезаписаны`,
  intrusion: ({zone}) => `Объект находится в зоне «${zone}» дольше ${randomInt(5, 40)} с`,
  line_crossing: ({zone}) => `Пересечение линии «${zone}», направление: ${pick(['внутрь', 'наружу'])}`,
  login_failed: () =>
    `Неверный пароль для пользователя «${pick(['admin', 'operator'])}» с адреса 192.168.1.${randomInt(20, 250)}`,
  motion: () => `Движение в кадре, длительность ${randomInt(2, 45)} с`,
  network_unstable: () => `Связь с камерой прерывалась ${randomInt(2, 6)} раз за 10 минут`,
  person: ({zone}) => `Обнаружен человек, зона «${zone}»`,
  poe_overload: ({camera}) =>
    `Порт ${camera?.portId ?? 1}: потребление ${(POE_PORT_LIMIT_W + random() * 4).toFixed(1).replace('.', ',')} Вт при лимите ${POE_PORT_LIMIT_W} Вт`,
  power_failure: () => `Пропало сетевое питание, работа от ИБП ${randomInt(1, 25)} мин`,
  tampering: () => 'Объектив закрыт или изображение засвечено',
  vehicle: ({zone}) => `${pick(['Легковой автомобиль', 'Грузовой автомобиль', 'Мотоцикл'])}, зона «${zone}»`,
  video_loss: () => 'Нет видеосигнала: камера не отвечает',
};

function pickType(): EventType {
  let threshold = random() * TOTAL_WEIGHT;
  for (const {type, weight} of TYPE_WEIGHTS) {
    threshold -= weight;
    if (threshold < 0) return type;
  }
  return 'motion';
}

/** Камеры, которые уже были в сети к этому моменту: `cam-4` ни разу не подключалась, `cam-3` молчит с `lastSeen` */
function pickCamera(occurredAt: number) {
  const candidates = cameras.filter(camera => camera.lastSeen !== null && Date.parse(camera.lastSeen) >= occurredAt);
  return candidates.length > 0 ? pick(candidates) : null;
}

function createEvent(type: EventType, camera: Camera | null, occurredAt: number, message?: string) {
  const zone = camera ? pick(CAMERA_ZONES[camera.id] ?? ['Кадр']) : '';
  return {
    cameraId: camera?.id ?? null,
    cameraName: camera?.name ?? null,
    category: EVENT_TYPE_META[type].category,
    message: message ?? MESSAGE_BUILDERS[type]({camera, zone}),
    occurredAt: new Date(occurredAt).toISOString(),
    type,
  };
}

function createEvents(now: number): NvrEvent[] {
  const drafts: Omit<NvrEvent, 'id'>[] = [];

  // Свежая тревога, согласованная с фикстурой камеры: cam-3 в статусе error с момента lastSeen
  for (const camera of cameras) {
    if (camera.status === 'error' && camera.lastSeen !== null) {
      drafts.push(createEvent('video_loss', camera, Date.parse(camera.lastSeen), camera.error?.message));
    }
  }

  for (let index = 0; index < EVENT_COUNT; index += 1) {
    const occurredAt = now - MINUTE_MS - Math.floor(random() * HISTORY_DAYS * DAY_MS);
    const type = pickType();
    const camera = DEVICE_EVENT_TYPES.has(type) ? null : pickCamera(occurredAt);
    drafts.push(createEvent(type, camera, occurredAt));
  }

  // id растут со временем: самое старое событие — evt-00001
  return drafts
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((draft, index) => ({...draft, id: `evt-${String(index + 1).padStart(5, '0')}`}));
}

export const events: readonly NvrEvent[] = createEvents(Date.now());
