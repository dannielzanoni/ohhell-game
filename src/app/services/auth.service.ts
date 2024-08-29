import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

type CreateLobby = {
  lobbyId: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private client: HttpClient) {

  }

  createLobby() {

    return this.client.post<CreateLobby>(`${environment.api_url}/lobby`, '')
  }

}
