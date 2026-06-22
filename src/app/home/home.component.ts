import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { LobbyService } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  userName: string | null = null;
  selectedPicture: string = '';
  profilePictures: string[] = [];
  lifesOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => ({ label: `${value} lives`, value }));
  selectedLifes = 5;

  constructor(private route: ActivatedRoute, private router: Router, private gameService: GameService, private lobbyService: LobbyService, private authService: AuthService) {
    this.userName = authService.getUserName();
  }

  async createGame() {
    //todo validar se o cara selecionou foto

    const lobby = await firstValueFrom(this.lobbyService.createGame({ lifes: this.selectedLifes }));
    this.router.navigate(['/game', lobby.lobby_id]);
  }

  openHowToPlay() {
    this.router.navigate(['/howtoplay']);
  }

  viewGames() {
    this.router.navigate(['/viewgames']);
  }

  openLink() {
    window.open('https://github.com/dannielzanoni/ohhell-game', '_blank');
  }

  isAuthenticated() {
    return this.authService.isUserAuthenticated()
  }

}
