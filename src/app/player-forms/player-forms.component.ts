import { AfterViewInit, Component, ElementRef, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Player } from '../models/player';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-player-forms',
  templateUrl: './player-forms.component.html',
  styleUrl: './player-forms.component.css'
})
export class PlayerFormsComponent implements OnInit, AfterViewInit {
  @ViewChild('googleButton', { static: false }) googleButton?: ElementRef<HTMLDivElement>;

  readonly nicknameMaxLength = 24;
  readonly googleClientId = environment.google_client_id;
  public userName: string | null = null;
  selectedPicture: string | null = null;
  profilePictures: string[] = [];
  claims: Player | null = null;
  googleError: string | null = null;
  @Input()
  saveCallback: (() => void) | null = null;

  constructor(private authService: AuthService, private ngZone: NgZone) {
    this.refreshProfileState();
  }

  async savePlayer() {
    if (this.isGoogleAuthenticated()) {
      return;
    }

    if (this.selectedPicture == null) {
      this.selectedPicture = this.selectRandom();
    }

    if (this.authService.isUserAuthenticated()) {
      await this.authService.updateProfile(this.userName!, this.selectedPicture)
      this.refreshProfileState();
      this.saveCallback?.call(null)
      return
    }

    await this.authService.login(this.userName!, this.selectedPicture);
    this.refreshProfileState();
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

  async ngAfterViewInit() {
    if (!this.canLoginWithGoogle()) {
      return;
    }

    try {
      await this.loadGoogleIdentityScript();
      this.renderGoogleButton();
      this.googleError = null;
    } catch {
      this.googleError = 'Google login is unavailable right now.';
    }
  }

  selectPictureHandler(picture: string) {
    this.selectedPicture = picture;
  }

  buttonDisabled() {
    const currentPicture = this.claims?.type === 'Anonymous' ? this.claims.data.data['picture'] : this.authService.getUserPicture();

    return this.nicknameTooLong() || this.userName == this.authService.getUserName() && this.selectedPicture == currentPicture
  }

  nicknameLength() {
    return this.userName?.length || 0;
  }

  nicknameTooLong() {
    return this.nicknameLength() > this.nicknameMaxLength;
  }

  canLoginWithGoogle() {
    return this.googleClientId.length > 0;
  }

  isGoogleAuthenticated() {
    return this.claims?.type === 'Google';
  }

  private refreshProfileState() {
    this.claims = this.authService.getClaims();
    this.userName = this.authService.getUserName();
    this.selectedPicture = this.authService.getUserPicture();
  }

  private async loadGoogleIdentityScript() {
    if (window.google?.accounts.id) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');

      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google script')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  }

  private renderGoogleButton() {
    const container = this.googleButton?.nativeElement;

    if (!container || !window.google?.accounts.id) {
      return;
    }

    container.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response) => this.handleGoogleCredential(response),
    });
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 260,
    });
  }

  private handleGoogleCredential(response: google.accounts.id.CredentialResponse) {
    if (!response.credential) {
      return;
    }

    this.ngZone.run(async () => {
      try {
        await this.authService.loginWithGoogle(response.credential);
        this.refreshProfileState();
        this.googleError = null;
        this.saveCallback?.call(null);
      } catch {
        this.googleError = 'Google login failed. Please try again.';
      }
    });
  }
}
