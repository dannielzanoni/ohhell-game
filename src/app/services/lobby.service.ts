import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { Injectable } from "@angular/core";

export interface ViewLobbyDTO {
  id: string;
  player_count: number;
}

export interface JoinLobbyDTO {
  id: string;
  players: Player[];
}

type Player = {
  type: "AnonymousUserClaims",
  data: AnonymousPlayer,
} | {
  type: "GoogleUserClaims",
  data: GooglePlayer
};

type GooglePlayer = {
  email: string;
  picture: string;
  name: string;
}

export type AnonymousPlayer = {
  picture_index: number;
  name: string;
  id: string;
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
    return this.client.post<CreateLobby>(`${environment.api_url}/lobby`, '')
  }
}
