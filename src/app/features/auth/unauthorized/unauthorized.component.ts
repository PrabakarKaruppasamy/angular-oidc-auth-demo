import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OidcAuthService } from '../../../core/services/oidc-auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="unauth-page fade-in">
      <div class="unauth-card card">
        <span class="material-icons lg" style="color:var(--accent-red)">block</span>
        <h2>Access Denied</h2>
        <p>You don't have the required role to access this page.</p>
        <div class="current-roles">
          <span class="label">Your roles:</span>
          <span *ngFor="let r of auth.user()?.roles" class="badge" [class]="'badge-' + r">{{ r }}</span>
        </div>
        <a routerLink="/dashboard" class="btn btn-primary">
          <span class="material-icons sm">arrow_back</span>
          Back to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [`
    .unauth-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; }
    .unauth-card { padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 420px; }
    h2 { font-size: 24px; color: var(--text-primary); }
    p  { color: var(--text-muted); font-size: 14px; }
    .current-roles { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .label { font-size: 12px; color: var(--text-muted); }
  `]
})
export class UnauthorizedComponent {
  constructor(public auth: OidcAuthService) {}
}
