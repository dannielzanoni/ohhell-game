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

  constructor(private router: Router, private gameService: GameService) {

  }

  ngOnInit(): void {
    this.gameService.sendAuth();
  }

  joinRoom() {
    this.joinInput = true;
    console.log(this.roomId);
    if (this.roomId) {
      this.router.navigate(['/entry-room', this.roomId]);
    }
  }

  createRoom() {
    const newRoomId = uuidv4();
    this.router.navigate(['/entry-room', newRoomId]);
  }

}
