import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { LobbyService } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  roomId = '';
  joinInput: boolean = false;
  userName = '';
  selectedPicture: string = '';
  profilePictures: string[] = [];

  constructor(private router: Router, private gameService: GameService, private lobbyService: LobbyService, private authService: AuthService) {
  }

  ngOnInit(): void {
    for (let i = 1; i <= 30; i++) {
      this.profilePictures.push(`../../assets/profile_pictures/${i}.png`);
    }
  }

  createLobby() {
    const photoIndex = Math.floor(Math.random() * this.profilePictures.length)
    this.authService.login(this.userName, photoIndex).subscribe(x => {
      console.log("Login: ", x)
      localStorage.setItem('JWT_TOKEN', x.token)
      this.lobbyService.createLobby().subscribe(this.joinLobby)
    })
  }

  joinLobby() {
    this.router.navigate(['/game', this.roomId]);
  }

  viewLobbies() {
    this.router.navigate(['/game']);
  }

  selectPicture(picture: string) {
    this.selectedPicture = picture;
  }
}
