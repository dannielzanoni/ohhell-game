import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-entry-room',
  templateUrl: './entry-room.component.html',
  styleUrl: './entry-room.component.css'
})
export class EntryRoomComponent {
  userName = '';

  constructor(private router: Router, private route: ActivatedRoute) { }

  enterRoom() {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (this.userName && roomId) {
      this.router.navigate([`/room`, roomId, this.userName]);
    }
  }
}
