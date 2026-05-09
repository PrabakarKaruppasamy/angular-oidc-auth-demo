import { Injectable } from '@angular/core';
import { JwtPayload, TokenInfo, AuthUser, UserRole } from '../models/auth.models';

const STORAGE_KEYS = {
  ACCESS_TOKEN:  'oidc_access_token',
  ID_TOKEN:      'oidc_id_token',
  REFRESH_TOKEN: 'oidc_refresh_token',
  EXPIRY:        'oidc_token_expiry',
  REFRESH_EXPIRY:'oidc_refresh_expiry',
  PKCE_VERIFIER: 'oidc_pkce_verifier',
  STATE:         'oidc_state',
  NONCE:         'oidc_nonce',
} as const;

@Injectable({ providedIn: 'root' })
export class TokenService {

  // ── Storage ──────────────────────────────────────────────────

  saveTokens(params: {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
    expiresIn: number;
  }): void {
    const expiry = Date.now() + params.expiresIn * 1000;
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN,  params.accessToken);
    sessionStorage.setItem(STORAGE_KEYS.ID_TOKEN,      params.idToken);
    sessionStorage.setItem(STORAGE_KEYS.EXPIRY,        String(expiry));
    if (params.refreshToken) {
      // Refresh token in sessionStorage — cleared on tab close (more secure than localStorage)
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, params.refreshToken);
      const refreshExpiry = Date.now() + 1800 * 1000; // 30 min
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_EXPIRY, String(refreshExpiry));
    }
  }

  getAccessToken():  string | null { return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN); }
  getIdToken():      string | null { return sessionStorage.getItem(STORAGE_KEYS.ID_TOKEN); }
  getRefreshToken(): string | null { return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN); }

  getTokenExpiry(): number | null {
    const v = sessionStorage.getItem(STORAGE_KEYS.EXPIRY);
    return v ? parseInt(v, 10) : null;
  }

  isAccessTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() >= expiry;
  }

  isAccessTokenExpiringSoon(offsetMs = 60000): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() >= expiry - offsetMs;
  }

  clearTokens(): void {
    Object.values(STORAGE_KEYS).forEach(k => sessionStorage.removeItem(k));
  }

  // ── PKCE / State / Nonce ──────────────────────────────────────

  saveAuthRequest(verifier: string, state: string, nonce: string): void {
    sessionStorage.setItem(STORAGE_KEYS.PKCE_VERIFIER, verifier);
    sessionStorage.setItem(STORAGE_KEYS.STATE,         state);
    sessionStorage.setItem(STORAGE_KEYS.NONCE,         nonce);
  }

  getCodeVerifier(): string | null { return sessionStorage.getItem(STORAGE_KEYS.PKCE_VERIFIER); }
  getState():        string | null { return sessionStorage.getItem(STORAGE_KEYS.STATE); }
  getNonce():        string | null { return sessionStorage.getItem(STORAGE_KEYS.NONCE); }

  clearAuthRequest(): void {
    sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.STATE);
    sessionStorage.removeItem(STORAGE_KEYS.NONCE);
  }

  // ── JWT Decoding ──────────────────────────────────────────────

  /**
   * Decode a JWT without cryptographic verification.
   * In production: verify signature against JWKS endpoint.
   * Here we decode for demonstration — never trust unverified JWTs for auth decisions.
   */
  decodeJwt(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      // Base64URL → Base64 → JSON
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const decoded = atob(padded);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }

  decodeJwtHeader(token: string): Record<string, unknown> | null {
    try {
      const header = token.split('.')[0];
      const base64 = header.replace(/-/g, '+').replace(/_/g, '/');
      const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  getTokenInfo(token: string): TokenInfo | null {
    const payload = this.decodeJwt(token);
    const header  = this.decodeJwtHeader(token);
    if (!payload || !header) return null;

    const expiresAt  = new Date(payload.exp * 1000);
    const isExpired  = Date.now() > payload.exp * 1000;
    const diffMs     = payload.exp * 1000 - Date.now();
    const timeToExpiry = isExpired
      ? 'Expired'
      : diffMs < 60000
        ? `${Math.floor(diffMs / 1000)}s`
        : `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`;

    return { raw: token, header, payload, expiresAt, isExpired, timeToExpiry };
  }

  // ── User Extraction ───────────────────────────────────────────

  extractUser(idToken: string): AuthUser | null {
    const payload = this.decodeJwt(idToken);
    if (!payload) return null;

    // Extract roles — handle Keycloak, Auth0, and generic OIDC patterns
    const roles = this.extractRoles(payload);

    return {
      sub:        payload.sub,
      email:      payload.email ?? '',
      name:       payload.name ?? payload.preferred_username ?? payload.sub,
      givenName:  payload.given_name ?? '',
      familyName: payload.family_name ?? '',
      username:   payload.preferred_username ?? payload.email ?? payload.sub,
      roles,
      avatar:     this.buildAvatar(payload.name ?? payload.preferred_username ?? 'U'),
    };
  }

  private extractRoles(payload: JwtPayload): UserRole[] {
    const allRoles: string[] = [
      ...(payload.roles ?? []),
      ...(payload.realm_access?.roles ?? []),
      ...(payload['https://myapp/roles'] ?? []),
    ];
    const validRoles: UserRole[] = ['admin', 'manager', 'user'];
    const found = allRoles.filter((r): r is UserRole => validRoles.includes(r as UserRole));
    return found.length > 0 ? found : ['user'];
  }

  private buildAvatar(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
