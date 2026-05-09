import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OidcAuthService } from '../services/oidc-auth.service';
import { UserRole } from '../models/auth.models';

/** Protects routes requiring authentication */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(OidcAuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
  return false;
};

/** Redirects authenticated users away from login */
export const guestGuard: CanActivateFn = () => {
  const auth   = inject(OidcAuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  router.navigate(['/dashboard']);
  return false;
};

/** Role-based guard factory */
export const roleGuard = (...roles: UserRole[]): CanActivateFn => () => {
  const auth   = inject(OidcAuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (auth.hasAnyRole(...roles)) return true;
  router.navigate(['/unauthorized']);
  return false;
};
