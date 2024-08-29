import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AnonymousPlayer } from './lobby.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private client: HttpClient) { }

  login(name: string, photoIndex: number) {
    const url = `${environment.api_url}/auth/login`
    const payload = { photo_index: photoIndex, nickname: name }

    const token = localStorage.getItem('JWT_TOKEN');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.post<AnonymousPlayer>(url, payload, { headers })
  }
}
