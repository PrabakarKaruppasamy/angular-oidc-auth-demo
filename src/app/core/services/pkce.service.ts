import { Injectable } from '@angular/core';
import { PkceChallenge } from '../models/auth.models';

/**
 * PKCE (Proof Key for Code Exchange) Service — RFC 7636
 *
 * PKCE prevents authorization code interception attacks in public clients (SPAs).
 * Flow:
 *   1. Generate a cryptographically random code_verifier
 *   2. Hash it with SHA-256 → code_challenge
 *   3. Send code_challenge in the /authorize request
 *   4. Send original code_verifier in the /token exchange
 *   5. Provider verifies hash(verifier) === challenge → grants token
 *
 * This makes stolen authorization codes useless without the verifier.
 */
@Injectable({ providedIn: 'root' })
export class PkceService {

  /**
   * Generate a complete PKCE challenge pair.
   * Uses Web Crypto API — available in all modern browsers and Node 15+.
   */
  async generateChallenge(): Promise<PkceChallenge> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
  }

  /**
   * Generate a cryptographically random code verifier.
   * RFC 7636: 43-128 unreserved chars from [A-Z a-z 0-9 - . _ ~]
   */
  private generateCodeVerifier(length = 96): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map(b => charset[b % charset.length])
      .join('');
  }

  /**
   * Generate SHA-256 code challenge from verifier.
   * Base64URL encode (no padding, URL-safe chars).
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(digest);
  }

  /**
   * Base64URL encoding — RFC 4648 §5 (no padding, + → -, / → _)
   */
  private base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Generate a cryptographically random state parameter (CSRF protection).
   * RFC 6749 §10.12: state must be unguessable and verified on callback.
   */
  generateState(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a cryptographically random nonce (replay attack protection).
   * The nonce is included in /authorize and must match the id_token claim.
   */
  generateNonce(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
