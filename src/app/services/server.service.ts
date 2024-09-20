import { Player, PlayerPoints } from "../models/player";
import { Card, Turn } from "../models/turn";

export type ServerGameMessage =
  | { type: 'PlayerTurn'; data: { player_id: string } }
  | { type: 'TurnPlayed'; data: { pile: Turn[] } }
  | { type: 'PlayerBidded'; data: { player_id: string, bid: number } }
  | { type: 'PlayerBiddingTurn'; data: { player_id: string, possible_bids: number[] } }
  | { type: 'PlayerStatusChange'; data: { player_id: string, ready: boolean } }
  | { type: 'RoundEnded'; data: PlayerPoints }
  | { type: 'PlayerDeck'; data: Card[] }
  | { type: 'SetStart'; data: { upcard: Card } }
  | { type: 'SetEnded'; data: PlayerPoints }
  | { type: 'GameEnded'; data: { winner: string, lifes: PlayerPoints } }
  | { type: 'PlayerJoined'; data: Player; }

export function deserializeServerMessage(json: string): ServerGameMessage {
  const parsed = JSON.parse(json);

  return parsed as ServerGameMessage;
}
