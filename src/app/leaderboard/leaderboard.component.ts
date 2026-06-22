import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { getPlayerNickname, getPlayerPicture, Player } from '../models/player';
import { Card } from '../models/turn';
import { PlayerStats, StatsService } from '../services/stats.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent {
  leaderboard$: Observable<PlayerStats[]>;

  constructor(private statsService: StatsService, private router: Router) {
    this.leaderboard$ = this.statsService.getLeaderboard(100);
  }

  goToMainMenu() {
    this.router.navigate(['/']);
  }

  playerName(player: Player | null, fallback: string) {
    return player ? getPlayerNickname(player) : fallback;
  }

  playerPicture(player: Player | null) {
    return player ? getPlayerPicture(player) : '';
  }

  cardLabel(card: Card | null) {
    return card ? `${card.rank} of ${card.suit}` : 'No rounds yet';
  }
}
