import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OidcAuthService } from './core/services/oidc-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-container *ngIf="auth.isAuthenticated(); else plain">
      <div class="shell">
        <nav class="topnav">
          <div class="nav-brand">
            <span class="brand-icon">🔐</span>
            <span class="brand-text">OIDC Demo</span>
          </div>
          <div class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            <a routerLink="/profile"   routerLinkActive="active">Profile</a>
            <a routerLink="/admin"     routerLinkActive="active" *ngIf="auth.isAdmin()">
              Admin
              <span class="nav-badge">Admin Only</span>
            </a>
          </div>
          <div class="nav-user">
            <div class="user-info">
              <div class="avatar">{{ auth.user()?.avatar }}</div>
              <div class="user-meta">
                <span class="user-name">{{ auth.user()?.name }}</span>
                <div class="roles">
                  <span *ngFor="let r of auth.user()?.roles" class="badge" [class]="'badge-' + r">{{ r }}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-outline logout-btn" (click)="auth.logout()">
              <span class="material-icons sm">logout</span>
              Sign Out
            </button>
          </div>
        </nav>
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </ng-container>
    <ng-template #plain><router-outlet /></ng-template>
  `,
  styles: [`
    .shell { min-height: 100vh; display: flex; flex-direction: column; }
    .topnav {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center;
      padding: 0 24px; height: 60px; gap: 24px;
      position: sticky; top: 0; z-index: 100;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 8px;
      .brand-icon { font-size: 22px; }
      .brand-text { font-size: 17px; font-weight: 700; color: var(--accent); }
    }
    .nav-links {
      display: flex; gap: 4px; flex: 1;
      a {
        padding: 6px 14px; border-radius: 6px; font-size: 14px;
        font-weight: 500; color: var(--text-secondary);
        text-decoration: none; position: relative;
        transition: all .2s;
        &:hover { background: var(--bg-elevated); color: var(--text-primary); }
        &.active { background: rgba(74,144,217,.1); color: var(--accent); }
      }
    }
    .nav-badge {
      font-size: 9px; font-weight: 700; background: var(--accent-purple);
      color: #fff; padding: 1px 5px; border-radius: 4px; margin-left: 5px;
    }
    .nav-user { display: flex; align-items: center; gap: 12px; }
    .user-info { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 34px; height: 34px; background: var(--accent);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); display: block; }
    .roles { display: flex; gap: 4px; margin-top: 2px; }
    .logout-btn { padding: 6px 12px; font-size: 12px; }
    .main-content { flex: 1; padding: 32px 24px; max-width: 1100px; width: 100%; margin: 0 auto; }
    @media (max-width: 768px) {
      .user-meta, .nav-badge { display: none; }
      .main-content { padding: 20px 16px; }
    }
  `]
})
export class AppComponent {
  constructor(public auth: OidcAuthService) {}
}
