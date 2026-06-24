import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { GooglePlayer, Player, getPlayerId, getPlayerNickname, getPlayerPicture } from '../models/player';
import { firstValueFrom } from 'rxjs';

type GoogleTokenClaims = GooglePlayer & {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
};

type AccessTokenClaims = {
  user: Player;
  exp?: number;
  iss?: string;
};

type AuthResponse = {
  token: string;
  refresh_token?: string | null;
};

type DecodedTokenClaims = GoogleTokenClaims | AccessTokenClaims;

const ACCESS_TOKEN_STORAGE_KEY = 'JWT_TOKEN';
const REFRESH_TOKEN_STORAGE_KEY = 'REFRESH_TOKEN';
const TOKEN_EXPIRATION_SKEW_SECONDS = 30;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  claims: Player | null = null;
  private refreshInFlight: Promise<boolean> | null = null;

  constructor(private client: HttpClient) { }

  private httpLogin(name: string, picture: string) {
    const url = `${environment.api_url}/auth/signup`
    const payload = { picture, nickname: name }

    return this.client.post<AuthResponse>(url, payload)
  }

  private httpGoogleLogin(credential: string) {
    const url = `${environment.api_url}/auth/google`
    const token = this.getAccessToken();
    const claims = this.getClaims();
    const headers = token && claims?.type === 'Anonymous'
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.client.post<AuthResponse>(url, { credential }, headers ? { headers } : undefined)
  }

  private httpRefresh(refreshToken: string) {
    const url = `${environment.api_url}/auth/refresh`

    return this.client.post<AuthResponse>(url, { refresh_token: refreshToken })
  }

  async login(userName: string, picture: string) {
    if (await this.ensureValidToken()) {
      return
    }

    const loginData = await firstValueFrom(this.httpLogin(userName, picture));
    this.storeAuth(loginData);
  }

  async loginWithGoogle(credential: string) {
    await this.ensureValidToken();

    const loginData = await firstValueFrom(this.httpGoogleLogin(credential));

    this.storeAuth(loginData);
  }

  getClaims() {
    if (this.claims) {
      return this.claims
    }
    const token = this.getAccessToken();

    if (!token) {
      return null
    }

    try {
      this.claims = this.parseToken(token);
    } catch {
      this.clearAccessToken();
      return null;
    }

    return this.claims;
  }

  isUserAuthenticated() {
    return this.getClaims() != null;
  }

  isGoogleAuthenticated() {
    return this.getClaims()?.type === 'Google';
  }

  canRefreshSession() {
    return this.getRefreshToken() != null;
  }

  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  getUserName() {
    const claims = this.getClaims();

    return claims ? getPlayerNickname(claims) : null;
  }

  getID() {
    const claims = this.getClaims();

    return claims ? getPlayerId(claims) : null;
  }

  getUserPicture() {
    const claims = this.getClaims();

    return claims ? getPlayerPicture(claims) : null;
  }

  async updateProfile(nickname: string, picture: string) {
    const response = await firstValueFrom(this.updateProfileHttp(nickname, picture))

    this.storeAuth(response);
  }

  async ensureValidToken() {
    const token = this.getAccessToken();

    if (!token) {
      return null;
    }

    if (!this.isTokenExpired(token)) {
      return token;
    }

    const refreshed = await this.refreshSession();

    return refreshed ? this.getAccessToken() : null;
  }

  async refreshSession(force = false) {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    if (!force) {
      const token = this.getAccessToken();

      if (token && !this.isTokenExpired(token)) {
        return true;
      }
    }

    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    this.refreshInFlight = this.runRefreshSession(refreshToken);

    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  private storeAuth(auth: AuthResponse) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, auth.token);

    if (auth.refresh_token !== undefined) {
      if (auth.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, auth.refresh_token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    }

    this.claims = this.parseToken(auth.token);
  }

  private clearAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    this.claims = null;
  }

  private clearSession() {
    this.clearAccessToken();
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  private getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  private async runRefreshSession(refreshToken: string) {
    try {
      const auth = await firstValueFrom(this.httpRefresh(refreshToken));

      this.storeAuth(auth);

      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.clearSession();
      }

      return false;
    }
  }

  private isTokenExpired(token: string) {
    try {
      const exp = jwtDecode<{ exp?: number }>(token).exp;

      if (!exp) {
        return false;
      }

      return exp <= Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_SKEW_SECONDS;
    } catch {
      return true;
    }
  }

  private setToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    this.claims = this.parseToken(token);
  }

  private updateProfileHttp(nickname: string, picture: string) {
    const url = `${environment.api_url}/auth/profile`
    const payload = { picture, nickname }

    const token = this.getAccessToken();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.post<AuthResponse>(url, payload, { headers })
  }

  private parseToken(token: string): Player {
    const claims = jwtDecode<DecodedTokenClaims>(token);

    if (this.isAccessTokenClaims(claims)) {
      return claims.user;
    }

    if (this.isGoogleTokenClaims(claims)) {
      return {
        type: 'Google',
        data: {
          email: claims.email,
          name: claims.name,
          picture: claims.picture,
        }
      };
    }

    throw new Error('Unsupported auth token');
  }

  private isAccessTokenClaims(claims: DecodedTokenClaims): claims is AccessTokenClaims {
    return 'user' in claims;
  }

  private isGoogleTokenClaims(claims: DecodedTokenClaims): claims is GoogleTokenClaims {
    return 'email' in claims && 'name' in claims && 'picture' in claims;
  }
}
