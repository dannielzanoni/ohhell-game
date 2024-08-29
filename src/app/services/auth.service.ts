import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AnonymousPlayer } from './lobby.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private client: HttpClient) { }

  login(name: string, photoIndex: number) {
    return this.client.post<AnonymousPlayer>(`${environment.api_url}/lobby`, { photo_index: photoIndex, nickname: name })
  }
}
