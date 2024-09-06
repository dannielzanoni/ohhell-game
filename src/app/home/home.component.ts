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
export class HomeComponent implements OnInit {
  userName: string | null = null;
  selectedPicture: string = '';
  profilePictures: string[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private gameService: GameService, private lobbyService: LobbyService, private authService: AuthService) {
    const claims = authService.getClaims();

    //todo mover username para authservice, nao fazer validacao aqui!!!!!!!!!!!!
    this.userName = claims?.name || null;
  }

  ngOnInit(): void {
    for (let i = 1; i <= 30; i++) {
      this.profilePictures.push(`../../assets/profile_pictures/${i}.png`);
    }
  }

  async createGame() {
    //todo validar se o cara selecionou foto
    const photoIndex = Math.floor(Math.random() * this.profilePictures.length)

    await this.authService.login(this.userName!, photoIndex);

    const lobby = await firstValueFrom(this.lobbyService.createGame());
    this.router.navigate(['/game', lobby.lobby_id.$oid]);
  }

  openHowToPlay() {
    this.router.navigate(['/howtoplay']);
  }

  viewGames() {
    this.router.navigate(['/viewgames']);
  }

  selectPicture(picture: string) {
    this.selectedPicture = picture;
  }

  openLink() {
    window.open('https://github.com/dannielzanoni/ohhell-game', '_blank');
  }

}
