import { HttpErrorResponse } from '@angular/common/http';

// Turns an API error into one line for a toast
export function apiErrorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return '發生未預期的錯誤';
  if (err.status === 0) return '無法連線到伺服器';
  const body = err.error as { message?: string; title?: string } | null;
  return body?.message ?? body?.title ?? `${err.status} ${err.statusText}`;
}
