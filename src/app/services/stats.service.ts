import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Player } from '../models/player';
import { Card } from '../models/turn';

export type PlayerStats = {
  player_id: string;
  player: Player | null;
  games_played: number;
  matches_won: number;
  rounds_won: number;
  trump_cards: number;
  bid_count: number;
  total_bid: number;
  average_bid: number;
  bids_hit: number;
  bids_missed: number;
  bid_accuracy: number;
  win_rate: number;
  favorite_card: Card | null;
  favorite_card_wins: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  constructor(private client: HttpClient) { }

  getLeaderboard(limit = 50) {
    return this.client.get<PlayerStats[]>(`${environment.api_url}/stats`, {
      params: { limit }
    });
  }

  getMyStats() {
    const token = localStorage.getItem('JWT_TOKEN');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.client.get<PlayerStats | null>(`${environment.api_url}/stats/me`, { headers });
  }
}
