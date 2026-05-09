import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { OidcAuthService } from '../services/oidc-auth.service';
import { TokenService } from '../services/token.service';

/**
 * OIDC Auth Interceptor
 *
 * 1. Attaches Bearer token to all outgoing HTTP requests
 * 2. On 401 — attempts silent token refresh then retries once
 * 3. On second 401 — logs out (token refresh failed)
 *
 * This pattern is standard in enterprise Angular apps using OIDC.
 */
export const oidcAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth         = inject(OidcAuthService);
  const tokenService = inject(TokenService);
  const token        = tokenService.getAccessToken();

  // Skip token injection for OIDC endpoints themselves
  const isOidcEndpoint = req.url.includes('/token') || req.url.includes('/authorize');
  if (isOidcEndpoint || !token) return next(req);

  // Proactive refresh — if token expiring in < 60s, refresh before the request
  if (tokenService.isAccessTokenExpiringSoon()) {
    return auth.silentRefresh().pipe(
      switchMap(() => next(addToken(req, tokenService.getAccessToken()!))),
      catchError(() => { auth.logout(); return throwError(() => new Error('Session expired')); })
    );
  }

  return next(addToken(req, token)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Reactive refresh on 401
        return auth.silentRefresh().pipe(
          switchMap(() => next(addToken(req, tokenService.getAccessToken()!))),
          catchError(() => { auth.logout(); return throwError(() => err); })
        );
      }
      return throwError(() => err);
    })
  );
};

function addToken(req: Parameters<HttpInterceptorFn>[0], token: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
