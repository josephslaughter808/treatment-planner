import type { AnalysisResponse, IntakePayload } from "@/lib/mock-analysis";

export const patientPreviewStorageKey = "clearpath-patient-preview";

export type StoredImagingAsset = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

export type StoredPatientPreview = {
  analysis: AnalysisResponse;
  payload: IntakePayload;
  imagingAssets: StoredImagingAsset[];
  updatedAt: string;
};
