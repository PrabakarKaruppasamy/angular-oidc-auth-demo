import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OidcAuthService } from '../../core/services/oidc-auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page fade-in">
      <div class="admin-header">
        <span class="material-icons lg" style="color:var(--accent-purple)">admin_panel_settings</span>
        <div>
          <h1>Admin Panel</h1>
          <p>This page is protected by <code>roleGuard('admin')</code> — only admins can access it.</p>
        </div>
      </div>

      <div class="guard-explainer card">
        <h3>How the Route Guard Works</h3>
        <pre>{{ guardCode }}</pre>
      </div>

      <div class="admin-grid">
        <div class="card admin-card" *ngFor="let card of adminCards">
          <span class="material-icons" [style.color]="card.color">{{ card.icon }}</span>
          <h4>{{ card.title }}</h4>
          <p>{{ card.desc }}</p>
          <span class="badge badge-admin">Admin Only</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { display: flex; flex-direction: column; gap: 28px; }
    .admin-header { display: flex; align-items: flex-start; gap: 16px; h1 { font-size: 24px; font-weight: 700; color: var(--text-primary); } p { font-size: 13px; color: var(--text-secondary); margin-top: 4px; } }
    .guard-explainer { padding: 24px; h3 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; } }
    .admin-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; @media(max-width:700px){grid-template-columns:1fr;} }
    .admin-card { padding: 24px; display: flex; flex-direction: column; gap: 8px; .material-icons { font-size: 28px; } h4 { font-size: 16px; font-weight: 700; color: var(--text-primary); } p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; flex: 1; } }
  `]
})
export class AdminComponent {
  constructor(public auth: OidcAuthService) {}

  guardCode = `// Route definition
{
  path: 'admin',
  canActivate: [roleGuard('admin')],
  loadComponent: () => import('./admin.component')
}

// Guard implementation
export const roleGuard = (...roles: UserRole[]): CanActivateFn => () => {
  const auth   = inject(OidcAuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (auth.hasAnyRole(...roles)) return true;
  router.navigate(['/unauthorized']);
  return false;
};`;

  adminCards = [
    { icon: 'people',        color: 'var(--accent)',        title: 'User Management',   desc: 'Create, update, disable user accounts and manage role assignments across the organization.' },
    { icon: 'security',      color: 'var(--accent-purple)', title: 'Security Audit',    desc: 'View authentication logs, failed login attempts, and token usage across all sessions.' },
    { icon: 'tune',          color: 'var(--accent-teal)',   title: 'OIDC Configuration',desc: 'Configure OIDC provider settings, redirect URIs, scopes, and token lifetimes.' },
    { icon: 'bar_chart',     color: 'var(--accent-orange)', title: 'Auth Analytics',    desc: 'Login frequency, session duration, token refresh rates, and geographic distribution.' },
    { icon: 'policy',        color: 'var(--accent-green)',  title: 'Role Policies',     desc: 'Define RBAC policies, role hierarchies, and permission mappings for application features.' },
    { icon: 'notifications', color: 'var(--accent-red)',    title: 'Security Alerts',   desc: 'Configure alerts for suspicious activity, brute force attempts, and anomaly detection.' },
  ];
}
