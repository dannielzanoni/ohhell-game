import { Component } from '@angular/core';
import { LobbyService, ViewLobbyDTO } from '../services/lobby.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-view-games',
  templateUrl: './view-games.component.html',
  styleUrl: './view-games.component.css'
})
export class ViewGamesComponent {
  lobbies$: Observable<ViewLobbyDTO[]>;

  constructor(private lobbyService: LobbyService) {
    this.lobbies$ = this.lobbyService.getLobbies();
  }
}
