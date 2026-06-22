import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { Injectable } from "@angular/core";
import { GameInfoDto, PlayerStatusMap } from './server.service';
import { map } from 'rxjs';

export interface ViewLobbyDTO {
  id: string;
  player_count: number;
}

export type LobbyInfo =
  | { type: 'NotStarted'; data: PlayerStatusMap }
  | { type: 'Playing'; data: GameInfoDto };

type LobbyInfoResponse = LobbyInfo
  | { NotStarted: PlayerStatusMap }
  | { Playing: GameInfoDto };

type CreateGame = {
  lobby_id: string;
}

export type CreateGameOptions = {
  lifes: number;
}

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  constructor(private client: HttpClient) { }

  getLobbies() {
    const token = localStorage.getItem('JWT_TOKEN');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.get<ViewLobbyDTO[]>(`${environment.api_url}/lobby`, { headers })
  }

  joinLobby(id: string) {
    const token = localStorage.getItem('JWT_TOKEN');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.put<LobbyInfoResponse>(`${environment.api_url}/lobby/${id}`, {}, { headers })
      .pipe(map(normalizeLobbyInfo))
  }

  createGame(options: CreateGameOptions) {
    const token = localStorage.getItem('JWT_TOKEN');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.post<CreateGame>(`${environment.api_url}/lobby`, options, { headers })
  }
}

function normalizeLobbyInfo(response: LobbyInfoResponse): LobbyInfo {
  if ('type' in response) {
    return response;
  }

  if ('NotStarted' in response) {
    return { type: 'NotStarted', data: response.NotStarted };
  }

  return { type: 'Playing', data: response.Playing };
}
