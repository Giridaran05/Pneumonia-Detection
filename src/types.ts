export type ConditionType = "NORMAL" | "BACTERIAL_PNEUMONIA" | "VIRAL_PNEUMONIA";

export interface BoundingBox {
  name: string;
  x: number;      // 0 to 100 relative
  y: number;      // 0 to 100 relative
  width: number;  // 0 to 100 relative
  height: number; // 0 to 100 relative
}

export interface MarkerPoint {
  label: string;
  x: number;      // 0 to 100 relative
  y: number;      // 0 to 100 relative
}

export interface AnatomicalReport {
  pleuralEffusion: string;
  diaphragmShape: string;
  cardiacSize: string;
  mediastinum: string;
}

export interface XRayDiagnosis {
  condition: ConditionType;
  confidence: number;
  findings: string;
  severity: string;
  detectedRegions: BoundingBox[];
  markers: MarkerPoint[];
  anatomicalReport: AnatomicalReport;
}

export interface TrainingArgs {
  learningRate: number;
  epochs: number;
  batchSize: number;
  baseArchitecture: "resnet18" | "resnet34" | "resnet50";
}

export interface EpochLog {
  epoch: number;
  trainLoss: number;
  validLoss: number;
  accuracy: number;
  recallBacterial: number;
  recallViral: number;
  f1Score: number;
  timeTaken: string;
}

export interface TrainingHistory {
  args: TrainingArgs;
  logs: EpochLog[];
  completedAt: Date;
}
