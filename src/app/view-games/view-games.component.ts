import { Component } from '@angular/core';
import { LobbyService, ViewLobbyDTO } from '../services/lobby.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-games',
  templateUrl: './view-games.component.html',
  styleUrl: './view-games.component.css'
})
export class ViewGamesComponent {
  lobbies$: Observable<ViewLobbyDTO[]>;

  constructor(private lobbyService: LobbyService, private router: Router) {
    this.lobbies$ = this.lobbyService.getLobbies();
  }

  joinLobby(lobby: ViewLobbyDTO) {
    this.router.navigate(['/game', lobby.id])
  }
}
