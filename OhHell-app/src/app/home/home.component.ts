import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  roomId = '';

  constructor(private router: Router) { }

  joinRoom() {
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
