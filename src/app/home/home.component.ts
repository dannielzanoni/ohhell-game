import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { GameService } from '../services/game.service';

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

  constructor(private router: Router, private gameService: GameService) {
  }

  ngOnInit(): void {
    this.gameService.sendAuth();
    for (let i = 1; i <= 30; i++) {
      this.profilePictures.push(`../../assets/profile_pictures/${i}.png`);
    }
  }

  joinRoom() {
    this.router.navigate(['/']);
  }

  createRoom() {
    this.router.navigate(['/room']);
  }

  viewRooms() {
    this.router.navigate(['/view-rooms']);
  }

  selectPicture(picture: string) {
    this.selectedPicture = picture;
  }

}
