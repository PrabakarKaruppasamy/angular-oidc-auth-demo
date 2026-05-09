// ── OIDC Token Models ─────────────────────────────────────────
export interface OidcTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  roles?: string[];
  realm_access?: { roles: string[] };   // Keycloak-style
  'https://myapp/roles'?: string[];     // Auth0-style namespace claim
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
  azp?: string;
  jti?: string;
  nonce?: string;
}

// ── User Models ────────────────────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'user';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  username: string;
  roles: UserRole[];
  avatar: string;
}

// ── Auth State ─────────────────────────────────────────────────
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  accessTokenExpiry: number | null;   // Unix timestamp ms
  refreshTokenExpiry: number | null;
  error: string | null;
  lastRefreshed: Date | null;
}

// ── PKCE Models ────────────────────────────────────────────────
export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export interface AuthorizationRequest {
  responseType: 'code';
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

// ── OIDC Config ────────────────────────────────────────────────
export interface OidcConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scope: string;
  responseType: string;
  usePkce: boolean;
  tokenEndpoint: string;
  authorizationEndpoint: string;
  userinfoEndpoint: string;
  endSessionEndpoint: string;
  jwksUri: string;
}

// ── Token Info (for UI display) ────────────────────────────────
export interface TokenInfo {
  raw: string;
  header: Record<string, unknown>;
  payload: JwtPayload;
  expiresAt: Date;
  isExpired: boolean;
  timeToExpiry: string;
}
