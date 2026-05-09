import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { OidcAuthService } from '../../core/services/oidc-auth.service';
import { TokenService } from '../../core/services/token.service';
import { TokenInfo } from '../../core/models/auth.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnDestroy {
  activeTab = signal<'overview' | 'access' | 'id' | 'refresh'>('overview');
  accessTokenInfo = signal<TokenInfo | null>(null);
  idTokenInfo     = signal<TokenInfo | null>(null);
  refreshing      = signal(false);
  refreshMsg      = signal('');

  private timerSub: Subscription;

  constructor(public auth: OidcAuthService, private tokenService: TokenService) {
    this.refreshTokenInfos();
    // Update countdown every second
    this.timerSub = interval(1000).subscribe(() => this.refreshTokenInfos());
  }

  private refreshTokenInfos(): void {
    const at = this.tokenService.getAccessToken();
    const id = this.tokenService.getIdToken();
    if (at) this.accessTokenInfo.set(this.tokenService.getTokenInfo(at));
    if (id) this.idTokenInfo.set(this.tokenService.getTokenInfo(id));
  }

  manualRefresh(): void {
    this.refreshing.set(true);
    this.refreshMsg.set('');
    this.auth.silentRefresh().subscribe({
      next: () => { this.refreshMsg.set('✅ Tokens refreshed successfully'); this.refreshing.set(false); this.refreshTokenInfos(); },
      error: () => { this.refreshMsg.set('❌ Refresh failed — session expired'); this.refreshing.set(false); }
    });
  }

  formatPayload(info: TokenInfo | null): string {
    if (!info) return '';
    return JSON.stringify(info.payload, null, 2);
  }

  ngOnDestroy(): void { this.timerSub.unsubscribe(); }
}
