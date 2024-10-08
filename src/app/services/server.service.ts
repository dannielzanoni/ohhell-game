import { Player, PlayerPoints } from "../models/player";
import { Card, Turn } from "../models/turn";

export type GameInfoDto = {
  info: PlayerInfoDto[],
  deck: Card[],
  upcard: Card,
  current_player: string
  stage: GameStage
}

export type GameStage =
  | { type: 'Dealing'; data: null }
  | { type: 'Bidding'; data: { possible_bids: number[] } }

export type PlayerInfoDto = {
  id: string,
  lifes: number,
  bid: number,
  rounds: number
}

export type ServerMessage =
  | { type: 'PlayerTurn'; data: { player_id: string } }
  | { type: 'TurnPlayed'; data: { pile: Turn[] } }
  | { type: 'PlayerBidded'; data: { player_id: string, bid: number } }
  | { type: 'PlayerBiddingTurn'; data: { player_id: string, possible_bids: number[] } }
  | { type: 'PlayerStatusChange'; data: { player_id: string, ready: boolean } }
  | { type: 'RoundEnded'; data: PlayerPoints }
  | { type: 'PlayerDeck'; data: Card[] }
  | { type: 'SetStart'; data: { upcard: Card } }
  | { type: 'SetEnded'; data: { lifes: PlayerPoints } }
  | { type: 'GameEnded'; data: { winner: string, lifes: PlayerPoints } }
  | { type: 'PlayerJoined'; data: Player; }
  | { type: 'Reconnect'; data: GameInfoDto; }
  | { type: 'Error'; data: { msg: string }; }

export function deserializeServerMessage(json: string): ServerMessage {
  const parsed = JSON.parse(json);

  return parsed as ServerMessage;
}
