import { HttpClient } from '@angular/common/http';
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
  constructor(private client: HttpClient) { }

  private httpLogin(name: string, photoIndex: number) {

    const url = `${environment.api_url}/auth/login`
    const payload = { picture_index: photoIndex, nickname: name }

    return this.client.post<{ token: string }>(url, payload)
  }

  async login(userName: string, photoIndex: number) {
    if (localStorage.getItem("JWT_TOKEN")) {
      return
    }

    const loginData = await firstValueFrom(this.httpLogin(userName, photoIndex));
    localStorage.setItem('JWT_TOKEN', loginData.token);
  }

  getClaims() {
    const token = localStorage.getItem("JWT_TOKEN");

    if (!token) {
      return null
    }
    //todo trocar quando implementar login google!!
    const jwt = jwtDecode<AnonymousPlayer>(token);
    console.log("JWT DECODE: ", jwt);

    return jwt;
  }
}
