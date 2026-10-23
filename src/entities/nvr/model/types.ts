export type NvrStorageStatus = 'ok' | 'degraded' | 'missing';

export interface NvrStorage {
  status: NvrStorageStatus;
  totalGb: number;
  usedGb: number;
}

/** Сведения о регистраторе (`GET /api/nvr`) */
export interface NvrInfo {
  firmware: string;
  id: string;
  ip: string;
  model: string;
  name: string;
  poeBudgetW: number;
  /** Число PoE-портов */
  poePorts: number;
  poeUsedW: number;
  serialNumber: string;
  storage: NvrStorage;
  uptimeSec: number;
}
