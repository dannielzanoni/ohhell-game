import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { Injectable } from "@angular/core";
import { Player } from '../models/player';
import { Router } from "@angular/router";
import { catchError, of } from "rxjs";

export interface ViewLobbyDTO {
  id: string;
  player_count: number;
}

export interface JoinLobbyDTO {
  id: string;
  //ver players q tao ready
  players: PlayerReadyDTO[];
}

export interface PlayerReadyDTO {
  player: Player;
  ready: boolean;
}

type CreateGame = {
  lobby_id: { $oid: string };
}

type GetLobbyDto = {
  id: string;
  player_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  constructor(private client: HttpClient, private router: Router) { }

  getLobbies() {
    const token = localStorage.getItem('JWT_TOKEN');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.get<ViewLobbyDTO[]>(`${environment.api_url}/lobby`, { headers })
  }

  joinLobby(id: string) {
    const token = localStorage.getItem('JWT_TOKEN');
    if (!token) {
      //return erro
    }


    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.put<JoinLobbyDTO>(`${environment.api_url}/lobby/${id}`, {}, { headers })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            this.router.navigate(['/'], { queryParams: { disableButtons: true } });
          }
          return of(null);
        })
      );
  }

  createGame() {
    const token = localStorage.getItem('JWT_TOKEN');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.post<CreateGame>(`${environment.api_url}/lobby`, {}, { headers })
  }
}
