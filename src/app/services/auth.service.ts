import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private client: HttpClient) { }

  login(name: string, photoIndex: number) {
    const url = `${environment.api_url}/auth/login`
    const payload = { picture_index: photoIndex, nickname: name }

    return this.client.post<{ token: string }>(url, payload)
  }
}
