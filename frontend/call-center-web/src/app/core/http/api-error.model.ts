export interface ApiError {
  status: number;
  message: string;
  validationErrors: Record<string, string[]>;
  traceId: string | null;
}
