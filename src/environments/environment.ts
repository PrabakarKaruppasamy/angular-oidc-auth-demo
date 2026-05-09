export const environment = {
  production: false,

  // ── OIDC Provider Configuration ──────────────────────────────
  // Replace these values with your real OIDC provider settings
  // Works with: Keycloak, Auth0, Okta, Azure AD, Google, or any RFC-compliant provider
  oidc: {
    issuer: 'https://your-oidc-provider.com/realms/demo',
    clientId: 'angular-oidc-demo',
    redirectUri: 'http://localhost:4200/auth/callback',
    postLogoutRedirectUri: 'http://localhost:4200/login',
    silentRefreshRedirectUri: 'http://localhost:4200/silent-refresh.html',
    scope: 'openid profile email roles offline_access',
    responseType: 'code',             // Authorization Code flow
    usePkce: true,                    // PKCE — always true for SPAs
    tokenEndpoint: 'https://your-oidc-provider.com/realms/demo/protocol/openid-connect/token',
    authorizationEndpoint: 'https://your-oidc-provider.com/realms/demo/protocol/openid-connect/auth',
    userinfoEndpoint: 'https://your-oidc-provider.com/realms/demo/protocol/openid-connect/userinfo',
    endSessionEndpoint: 'https://your-oidc-provider.com/realms/demo/protocol/openid-connect/logout',
    jwksUri: 'https://your-oidc-provider.com/realms/demo/protocol/openid-connect/certs',
  },

  // Token config
  accessTokenExpirySeconds: 300,      // 5 min — matches Keycloak default
  refreshTokenExpirySeconds: 1800,    // 30 min
  silentRefreshOffsetSeconds: 60,     // Refresh 60s before expiry

  // App
  appName: 'Angular OIDC Auth Demo',
  version: '1.0.0'
};
