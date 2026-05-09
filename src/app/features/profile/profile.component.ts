import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OidcAuthService } from '../../core/services/oidc-auth.service';
import { TokenService } from '../../core/services/token.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-page fade-in">
      <h1>User Profile</h1>
      <p class="text-muted" style="font-size:13px; margin-bottom: 28px;">
        Claims decoded from your OIDC ID Token
      </p>
      <div class="profile-grid">
        <div class="card profile-card">
          <div class="avatar-lg">{{ auth.user()?.avatar }}</div>
          <h2>{{ auth.user()?.name }}</h2>
          <p class="username">&#64;{{ auth.user()?.username }}</p>
          <div class="roles">
            <span *ngFor="let r of auth.user()?.roles" class="badge" [class]="'badge-' + r">{{ r }}</span>
          </div>
          <hr class="divider">
          <div class="profile-detail">
            <span class="detail-label">Email</span>
            <code>{{ auth.user()?.email }}</code>
          </div>
          <div class="profile-detail">
            <span class="detail-label">Subject (sub)</span>
            <code style="font-size:11px; word-break:break-all;">{{ auth.user()?.sub }}</code>
          </div>
          <div class="profile-detail">
            <span class="detail-label">Token Last Refreshed</span>
            <code>{{ auth.state().lastRefreshed | date:'HH:mm:ss' }}</code>
          </div>
        </div>
        <div class="card info-card">
          <h3>How ID Tokens Work</h3>
          <div class="info-section" *ngFor="let s of infos">
            <span class="material-icons" [style.color]="s.color">{{ s.icon }}</span>
            <div>
              <p class="info-title">{{ s.title }}</p>
              <p class="info-desc">{{ s.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    h1 { font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
    .profile-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; @media(max-width:700px){grid-template-columns:1fr;} }
    .profile-card { padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .avatar-lg { width: 72px; height: 72px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; }
    h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); }
    .username { font-size: 13px; color: var(--text-muted); }
    .roles { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
    .profile-detail { width: 100%; display: flex; flex-direction: column; gap: 4px; text-align: left; }
    .detail-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; }
    .info-card { padding: 28px; display: flex; flex-direction: column; gap: 20px; }
    .info-card h3 { font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .info-section { display: flex; gap: 14px; align-items: flex-start; }
    .info-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .info-desc  { font-size: 13px; color: var(--text-secondary); margin-top: 2px; line-height: 1.6; }
    .material-icons { flex-shrink: 0; font-size: 22px; margin-top: 2px; }
  `]
})
export class ProfileComponent {
  infos = [
    { icon: 'badge',          color: 'var(--accent)',        title: 'ID Token Purpose',      desc: 'ID tokens prove the identity of the user to the client application. They are JWTs issued by the OIDC provider.' },
    { icon: 'verified_user',  color: 'var(--accent-green)',  title: 'Signature Validation',  desc: 'In production, validate the JWT signature using the provider\'s JWKS endpoint before trusting any claims.' },
    { icon: 'timer',          color: 'var(--accent-orange)', title: 'Token Expiry',          desc: 'ID tokens are short-lived (5-15 min). Use silent refresh to get new tokens without interrupting the user.' },
    { icon: 'block',          color: 'var(--accent-red)',    title: 'Never Send to API',     desc: 'Never send ID tokens to your API. APIs should only receive and validate access tokens with the correct audience.' },
    { icon: 'manage_accounts',color: 'var(--accent-purple)', title: 'Claims & Roles',        desc: 'Custom claims like roles, groups, and permissions are added by the provider and extracted by the client.' },
  ];
  constructor(public auth: OidcAuthService) {}
}
