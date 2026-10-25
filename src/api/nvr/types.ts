export type NvrStorageStatus = 'ok' | 'degraded' | 'missing';

export interface NvrStorage {
  status: NvrStorageStatus;
  totalGb: number;
  usedGb: number;
}

export interface NvrInfo {
  firmware: string;
  id: string;
  ip: string;
  model: string;
  name: string;
  poeBudgetW: number;
  poePorts: number;
  poeUsedW: number;
  serialNumber: string;
  storage: NvrStorage;
  uptimeSec: number;
}

export interface PoePort {
  id: number;
  number: number;
  linkUp: boolean;
  poeEnabled: boolean;
  powerW: number;
  maxPowerW: number;
  cameraId: string | null;
}
