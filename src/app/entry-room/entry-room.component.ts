import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-entry-room',
  templateUrl: './entry-room.component.html',
  styleUrl: './entry-room.component.css'
})
export class EntryRoomComponent {
  userName = '';
  selectedPicture: string = '';
  profilePictures: string[] = [];

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    for (let i = 1; i <= 30; i++) {
      this.profilePictures.push(`../../assets/profile_pictures/${i}.png`);
    }
  }

  selectPicture(picture: string) {
    this.selectedPicture = picture;
  }

  enterRoom() {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (this.userName && roomId && this.selectedPicture) {
      this.router.navigate([`/room`, roomId, this.userName, this.selectedPicture]);
    }
  }
}
