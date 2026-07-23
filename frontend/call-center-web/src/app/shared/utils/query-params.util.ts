import { HttpParams } from '@angular/common/http';

export type QueryValue = string | number | boolean | Date | null | undefined;

export function toHttpParams(filters: Record<string, QueryValue>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === '') continue;
    params = params.set(key, value instanceof Date ? value.toISOString() : String(value));
  }
  return params;
}
