import { Component, Input, input, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { AnonymousPlayer } from '../models/player';


@Component({
  selector: 'app-player-forms',
  templateUrl: './player-forms.component.html',
  styleUrl: './player-forms.component.css'
})
export class PlayerFormsComponent implements OnInit {
  public userName: string | null = null;
  selectedPicture: string | null = null;
  profilePictures: string[] = [];
  claims: AnonymousPlayer | null = null;
  @Input()
  saveCallback: (() => void) | null = null;

  constructor(private authService: AuthService) {
    this.claims = authService.getClaims();
    this.userName = this.claims?.name || null;
  }

  async savePlayer() {
    if (this.selectedPicture == null) {
      this.selectedPicture = this.selectRandom();
    }

    if (this.authService.isUserAuthenticated()) {
      await this.authService.updateProfile(this.userName!, this.selectedPicture)
      this.saveCallback?.call(null)
      return
    }

    await this.authService.login(this.userName!, this.selectedPicture);
    this.saveCallback?.call(null)
  }

  selectRandom() {
    const randomIndex = Math.floor(Math.random() * this.profilePictures.length);

    return this.profilePictures[randomIndex];
  }

  ngOnInit(): void {
    for (let i = 1; i <= 4; i++) {
      this.profilePictures.push(`../../assets/profile_pictures/gifs/${i}.gif`);
    }
    for (let i = 1; i <= 31; i++) {
      this.profilePictures.push(`../../assets/profile_pictures/${i}.png`);
    }
  }

  selectPictureHandler(picture: string) {
    this.selectedPicture = picture;
  }

  buttonDisabled() {
    return this.userName == this.claims?.name && this.selectedPicture == this.claims?.picture
  }
}
