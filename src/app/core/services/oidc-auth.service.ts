import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap, tap, catchError, throwError, timer, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PkceService } from './pkce.service';
import { TokenService } from './token.service';
import {
  AuthState, AuthUser, AuthStatus, OidcTokenResponse, UserRole
} from '../models/auth.models';

// ── Mock OIDC users (simulates real provider token responses) ───
const MOCK_USERS: Record<string, { password: string; idTokenPayload: object; roles: UserRole[] }> = {
  'admin@demo.com': {
    password: 'Admin@123',
    roles: ['admin', 'manager', 'user'],
    idTokenPayload: {
      sub: 'uuid-admin-001',
      email: 'admin@demo.com',
      name: 'Prabakar Karuppasamy',
      given_name: 'Prabakar',
      family_name: 'Karuppasamy',
      preferred_username: 'prabakar.admin',
      roles: ['admin', 'manager', 'user'],
      realm_access: { roles: ['admin', 'manager', 'user'] },
    }
  },
  'manager@demo.com': {
    password: 'Manager@123',
    roles: ['manager', 'user'],
    idTokenPayload: {
      sub: 'uuid-mgr-002',
      email: 'manager@demo.com',
      name: 'Sarah Johnson',
      given_name: 'Sarah',
      family_name: 'Johnson',
      preferred_username: 'sarah.manager',
      roles: ['manager', 'user'],
      realm_access: { roles: ['manager', 'user'] },
    }
  },
  'user@demo.com': {
    password: 'User@123',
    roles: ['user'],
    idTokenPayload: {
      sub: 'uuid-user-003',
      email: 'user@demo.com',
      name: 'Alex Chen',
      given_name: 'Alex',
      family_name: 'Chen',
      preferred_username: 'alex.user',
      roles: ['user'],
      realm_access: { roles: ['user'] },
    }
  }
};

const INITIAL_STATE: AuthState = {
  status: 'idle',
  user: null,
  accessToken: null,
  idToken: null,
  refreshToken: null,
  accessTokenExpiry: null,
  refreshTokenExpiry: null,
  error: null,
  lastRefreshed: null,
};

@Injectable({ providedIn: 'root' })
export class OidcAuthService implements OnDestroy {

  // ── Signals ──────────────────────────────────────────────────
  private _state = signal<AuthState>(INITIAL_STATE);
  readonly state     = this._state.asReadonly();
  readonly user      = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().status === 'authenticated');
  readonly isLoading = computed(() => this._state().status === 'loading');
  readonly error     = computed(() => this._state().error);

  // Token refresh timer
  private refreshTimer?: Subscription;

  // Simulate the PKCE flow step tracking
  readonly pkceStep = signal<number>(0);
  readonly pkceData = signal<Record<string, string>>({});

  constructor(
    private pkceService: PkceService,
    private tokenService: TokenService,
    private router: Router,
    private http: HttpClient,
  ) {
    this.restoreSession();
  }

  // ── Session Restore ───────────────────────────────────────────

  private restoreSession(): void {
    const accessToken  = this.tokenService.getAccessToken();
    const idToken      = this.tokenService.getIdToken();
    const refreshToken = this.tokenService.getRefreshToken();

    if (!accessToken || !idToken) {
      this.setStatus('unauthenticated');
      return;
    }

    if (this.tokenService.isAccessTokenExpired()) {
      if (refreshToken) {
        this.silentRefresh().subscribe({
          error: () => { this.clearAndLogout(); }
        });
      } else {
        this.clearAndLogout();
      }
      return;
    }

    const user = this.tokenService.extractUser(idToken);
    if (user) {
      this._state.set({
        ...INITIAL_STATE,
        status: 'authenticated',
        user,
        accessToken,
        idToken,
        refreshToken,
        accessTokenExpiry: this.tokenService.getTokenExpiry(),
        lastRefreshed: new Date(),
      });
      this.scheduleTokenRefresh();
    }
  }

  // ── Login (simulates PKCE Authorization Code Flow) ────────────

  /**
   * Step 1: Initiate PKCE login — simulates redirect to OIDC provider.
   * In production: calls this.pkceService.generateChallenge() then
   * redirects to provider's /authorize endpoint with code_challenge.
   */
  async initiateLogin(email: string, password: string): Promise<void> {
    this.setStatus('loading');

    // Generate PKCE challenge (real PKCE — production-ready code)
    const pkce  = await this.pkceService.generateChallenge();
    const state = this.pkceService.generateState();
    const nonce = this.pkceService.generateNonce();

    // Save to session — used in callback step
    this.tokenService.saveAuthRequest(pkce.codeVerifier, state, nonce);

    // Update PKCE visualizer
    this.pkceData.set({
      codeVerifier:  pkce.codeVerifier.slice(0, 40) + '...',
      codeChallenge: pkce.codeChallenge,
      state:         state.slice(0, 20) + '...',
      nonce:         nonce.slice(0, 20) + '...',
      step:          'authorize_redirect',
    });
    this.pkceStep.set(1);

    // In production: window.location.href = buildAuthorizationUrl(pkce, state, nonce)
    // Here: simulate async provider callback
    await this.simulateProviderCallback(email, password, state, nonce);
  }

  /**
   * Step 2: Simulate provider callback with authorization code.
   * In production: provider redirects to /auth/callback?code=xxx&state=yyy
   */
  private async simulateProviderCallback(
    email: string, password: string, state: string, nonce: string
  ): Promise<void> {
    await delay(600); // Simulate network round-trip

    const mockUser = MOCK_USERS[email];
    if (!mockUser || mockUser.password !== password) {
      this._state.update(s => ({ ...s, status: 'error', error: 'Invalid email or password' }));
      return;
    }

    // Simulate provider returning an auth code
    const authCode = generateMockCode();
    this.pkceData.update(d => ({ ...d, authCode: authCode.slice(0, 20) + '...', step: 'code_received' }));
    this.pkceStep.set(2);

    await delay(400);

    // Step 3: Exchange code + verifier for tokens
    await this.exchangeCodeForTokens(authCode, mockUser, nonce);
  }

  /**
   * Step 3: Token exchange — simulates POST /token with code + code_verifier.
   * In production: HTTP POST to provider's token endpoint.
   */
  private async exchangeCodeForTokens(
    code: string, mockUser: typeof MOCK_USERS[string], nonce: string
  ): Promise<void> {
    const verifier = this.tokenService.getCodeVerifier();
    this.pkceData.update(d => ({ ...d, step: 'token_exchange', codeVerifier: verifier?.slice(0,20) + '...' }));
    this.pkceStep.set(3);

    await delay(500);

    const now = Math.floor(Date.now() / 1000);
    const accessPayload  = { ...mockUser.idTokenPayload, iat: now, exp: now + 300, iss: environment.oidc.issuer, aud: environment.oidc.clientId, type: 'access' };
    const idPayload      = { ...mockUser.idTokenPayload, iat: now, exp: now + 300, iss: environment.oidc.issuer, aud: environment.oidc.clientId, nonce };
    const refreshPayload = { sub: (mockUser.idTokenPayload as any).sub, iat: now, exp: now + 1800, type: 'refresh' };

    const accessToken  = buildMockJwt(accessPayload);
    const idToken      = buildMockJwt(idPayload);
    const refreshToken = buildMockJwt(refreshPayload);

    this.tokenService.clearAuthRequest();
    this.tokenService.saveTokens({ accessToken, idToken, refreshToken, expiresIn: 300 });

    const user = this.tokenService.extractUser(idToken)!;

    this.pkceData.update(d => ({ ...d, step: 'tokens_received', tokenType: 'Bearer' }));
    this.pkceStep.set(4);

    this._state.set({
      status: 'authenticated',
      user,
      accessToken,
      idToken,
      refreshToken,
      accessTokenExpiry: Date.now() + 300_000,
      refreshTokenExpiry: Date.now() + 1_800_000,
      error: null,
      lastRefreshed: new Date(),
    });

    this.scheduleTokenRefresh();
    this.router.navigate(['/dashboard']);
  }

  // ── Silent Refresh ─────────────────────────────────────────────

  /**
   * Silently refresh the access token using the refresh token.
   * In production: POST to /token endpoint with grant_type=refresh_token.
   * No user interaction required — happens in background.
   */
  silentRefresh(): Observable<void> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return new Observable<void>(observer => {
      setTimeout(async () => {
        try {
          const decoded = this.tokenService.decodeJwt(refreshToken);
          if (!decoded || Date.now() > decoded.exp * 1000) {
            observer.error(new Error('Refresh token expired'));
            return;
          }
          const now = Math.floor(Date.now() / 1000);
          const currentId = this.tokenService.getIdToken();
          const currentPayload = currentId ? this.tokenService.decodeJwt(currentId) : null;

          const newAccessPayload = { ...(currentPayload ?? {}), iat: now, exp: now + 300, type: 'access' };
          const newIdPayload     = { ...(currentPayload ?? {}), iat: now, exp: now + 300, type: 'id' };
          const newAccess = buildMockJwt(newAccessPayload);
          const newId     = buildMockJwt(newIdPayload);

          this.tokenService.saveTokens({ accessToken: newAccess, idToken: newId, refreshToken, expiresIn: 300 });

          this._state.update(s => ({
            ...s,
            accessToken: newAccess,
            idToken: newId,
            accessTokenExpiry: Date.now() + 300_000,
            lastRefreshed: new Date(),
          }));

          this.scheduleTokenRefresh();
          observer.next();
          observer.complete();
        } catch (e) {
          observer.error(e);
        }
      }, 600);
    });
  }

  // ── Logout ────────────────────────────────────────────────────

  /**
   * Logout — clear tokens and redirect to provider's end_session_endpoint.
   * In production: redirect to provider /logout with id_token_hint and post_logout_redirect_uri.
   */
  logout(): void {
    const idToken = this.tokenService.getIdToken();
    this.refreshTimer?.unsubscribe();
    this.tokenService.clearTokens();
    this._state.set({ ...INITIAL_STATE, status: 'unauthenticated' });
    this.pkceStep.set(0);
    this.pkceData.set({});
    // In production: window.location.href = buildEndSessionUrl(idToken)
    this.router.navigate(['/login']);
  }

  // ── Role Checks ────────────────────────────────────────────────

  hasRole(role: UserRole): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  hasAnyRole(...roles: UserRole[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  isAdmin():   boolean { return this.hasRole('admin'); }
  isManager(): boolean { return this.hasAnyRole('admin', 'manager'); }

  // ── Token Refresh Scheduler ────────────────────────────────────

  private scheduleTokenRefresh(): void {
    this.refreshTimer?.unsubscribe();
    const expiry = this.tokenService.getTokenExpiry();
    if (!expiry) return;
    const refreshAt = expiry - Date.now() - 60_000; // 60s before expiry
    if (refreshAt <= 0) { this.silentRefresh().subscribe(); return; }
    this.refreshTimer = timer(refreshAt).pipe(
      switchMap(() => this.silentRefresh()),
      catchError(() => { this.clearAndLogout(); return []; })
    ).subscribe();
  }

  private clearAndLogout(): void {
    this.tokenService.clearTokens();
    this.setStatus('unauthenticated');
    this.router.navigate(['/login']);
  }

  private setStatus(status: AuthStatus, error?: string): void {
    this._state.update(s => ({ ...s, status, error: error ?? null }));
  }

  ngOnDestroy(): void {
    this.refreshTimer?.unsubscribe();
  }
}

// ── Helpers ────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function generateMockCode(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
}

/**
 * Build a mock JWT (header.payload.signature).
 * Signature is a fake placeholder — not cryptographically valid.
 * In production: the provider signs with RS256/ES256 private key.
 */
function buildMockJwt(payload: object): string {
  const header  = { alg: 'RS256', typ: 'JWT', kid: 'mock-key-id-001' };
  const enc     = (obj: object) => btoa(JSON.stringify(obj)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const fakeSig = 'MOCK_SIGNATURE_NOT_CRYPTOGRAPHICALLY_VALID';
  return `${enc(header)}.${enc(payload)}.${fakeSig}`;
}
