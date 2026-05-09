import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-page">
      <div class="spinner" style="width:40px;height:40px;border-width:3px;"></div>
      <p>Completing authentication...</p>
      <small>Exchanging authorization code for tokens</small>
    </div>
  `,
  styles: [`.callback-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--text-muted); font-size: 14px; }`]
})
export class CallbackComponent {}
