// Legacy (FSD-001, roadmap M-2): доменные типы камеры пока лежат в src/mocks.
// Это единственная точка, через которую слайс берёт типы из моков; при M-2 определения переедут сюда.
export type {Camera, CameraStatus, StreamInfo} from '@/mocks/data/nvrtypes';
