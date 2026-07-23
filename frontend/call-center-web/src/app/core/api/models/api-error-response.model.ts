export interface ApiErrorResponse { statusCode: number; code: string; message: string; detail: string | null; traceId: string | null; validationErrors: Record<string, string[]> | null }
