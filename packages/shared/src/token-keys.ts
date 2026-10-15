export const TOKEN_KEYS = {
  portal: 'nj_portal_token',
  admin: 'nj_admin_token',
  merchant: 'nj_merchant_token',
} as const

export type TokenApp = keyof typeof TOKEN_KEYS

export function tokenStorageKey(app: TokenApp): string {
  return TOKEN_KEYS[app]
}
