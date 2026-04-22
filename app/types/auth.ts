export interface AuthSessionState {
  has_access: boolean;
  has_refresh: boolean;
  access_expires_at: string | null;
  refresh_expires_at: string | null;
}
