import { ApiError } from './http'

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function statusOf(error: unknown): number {
  if (!(error instanceof ApiError)) return 0
  return error.httpStatus || error.code
}

export function isUnauthorized(error: unknown): boolean {
  return statusOf(error) === 401
}
