import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OidcAuthService } from '../../../core/services/oidc-auth.service';

const DEMO_USERS = [
  { label: 'Admin',   email: 'admin@demo.com',   password: 'Admin@123',   role: 'admin',   color: '#b794f4', scopes: 'openid profile email roles offline_access' },
  { label: 'Manager', email: 'manager@demo.com', password: 'Manager@123', role: 'manager', color: '#4fd1c7', scopes: 'openid profile email roles' },
  { label: 'User',    email: 'user@demo.com',    password: 'User@123',    role: 'user',    color: '#4a90d9', scopes: 'openid profile email' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  showPassword = signal(false);

  readonly demoUsers = DEMO_USERS;

  constructor(private fb: FormBuilder, public auth: OidcAuthService) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  fillDemo(email: string, password: string): void {
    this.form.patchValue({ email, password });
    this.auth['_state'].update((s: any) => ({ ...s, error: null }));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.auth.isLoading()) return;
    await this.auth.initiateLogin(this.form.value.email, this.form.value.password);
  }

  get pkceStepLabels(): string[] {
    return ['Idle', 'Generate PKCE & Redirect', 'Auth Code Received', 'Token Exchange', 'Authenticated'];
  }

  get pkceSteps() {
    return [
      { icon: 'key',           label: 'Generate PKCE Challenge',      desc: 'code_verifier + SHA-256 → code_challenge' },
      { icon: 'open_in_new',   label: 'Redirect to Provider /authorize', desc: 'state + nonce + code_challenge sent' },
      { icon: 'code',          label: 'Receive Authorization Code',    desc: 'Provider redirects back with auth code' },
      { icon: 'swap_horiz',    label: 'Exchange Code for Tokens',      desc: 'POST /token with code + code_verifier' },
      { icon: 'verified_user', label: 'Tokens Issued',                 desc: 'access_token + id_token + refresh_token' },
    ];
  }
}
