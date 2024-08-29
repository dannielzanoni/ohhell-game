import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { Injectable } from "@angular/core";
import { Player } from '../models/player';

export interface ViewLobbyDTO {
  id: string;
  player_count: number;
}

export interface JoinLobbyDTO {
  id: string;
  players: Player[];
}

type CreateLobby = {
  lobby_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  constructor(private client: HttpClient) { }

  getLobbies() {
    return this.client.get<ViewLobbyDTO[]>(`${environment.api_url}/lobby`)
  }

  joinLobby(id: string) {
    return this.client.put<JoinLobbyDTO>(`${environment.api_url}/lobby/${id}`, '')
  }

  createLobby() {
    const token = localStorage.getItem('JWT_TOKEN');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.post<CreateLobby>(`${environment.api_url}/lobby`, {}, { headers })
  }
}
