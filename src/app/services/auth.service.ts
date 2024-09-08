import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Token } from '@angular/compiler';
import { AnonymousPlayer, Player } from '../models/player';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  claims: AnonymousPlayer | null = null;
  constructor(private client: HttpClient) { }

  private httpLogin(name: string, picture: string) {
    const url = `${environment.api_url}/auth/login`
    const payload = { picture, nickname: name }

    return this.client.post<{ token: string }>(url, payload)
  }

  async login(userName: string, picture: string) {
    if (localStorage.getItem("JWT_TOKEN")) {
      return
    }

    const loginData = await firstValueFrom(this.httpLogin(userName, picture));
    localStorage.setItem('JWT_TOKEN', loginData.token);
  }

  getClaims() {
    if (this.claims) {
      return this.claims
    }
    const token = localStorage.getItem("JWT_TOKEN");

    if (!token) {
      return null
    }

    //todo trocar quando implementar login google!!
    const jwt = jwtDecode<AnonymousPlayer>(token);
    this.claims = jwt;
    console.log("JWT DECODE: ", jwt);

    return jwt;
  }

  isUserAuthenticated() {
    return this.getClaims() != null;
  }

  getUserName() {
    return this.getClaims()?.name || null;
  }

  getID() {
    return this.getClaims()?.id || null;
  }

  async updateProfile(nickname: string, picture: string) {
    const response = await firstValueFrom(this.updateProfileHttp(nickname, picture))

    localStorage.setItem("JWT_TOKEN", response.token);
  }

  private updateProfileHttp(nickname: string, picture: string) {
    const url = `${environment.api_url}/auth/profile`
    const payload = { picture, nickname }

    const token = localStorage.getItem("JWT_TOKEN");

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.post<{ token: string }>(url, payload, { headers })
  }
}
