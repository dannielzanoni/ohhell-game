import { Component } from '@angular/core';
import { LobbyService, ViewLobbyDTO } from '../services/lobby.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-view-rooms',
  templateUrl: './view-rooms.component.html',
  styleUrl: './view-rooms.component.css'
})
export class ViewRoomsComponent {
  lobbies$: Observable<ViewLobbyDTO[]>;

  constructor(private lobbyService: LobbyService) {
    this.lobbies$ = this.lobbyService.getLobbies();
  }
}
