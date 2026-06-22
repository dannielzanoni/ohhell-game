import { Player, PlayerPoints } from "../models/player";
import { Card, Turn } from "../models/turn";

export type GameInfoDto = {
  info: PlayerInfoDto[],
  deck: Card[] | null,
  upcard: Card | null,
  current_player: string
  stage: GameStage
}

export type GameStage =
  | { type: 'Dealing' }
  | { type: 'Bidding'; data: { possible_bids: number[] } }

export type PlayerInfoDto = {
  id: string,
  lifes: number,
  bid: number | null,
  rounds: number | null
}

export type PlayerStatusDto = {
  player: Player;
  ready: boolean;
}

export type PlayerStatusMap = Record<string, PlayerStatusDto>;

export type MatchSnapshot =
  | { type: 'Waiting'; data: PlayerStatusMap }
  | { type: 'Playing'; data: { players: PlayerStatusMap; game: GameInfoDto } }

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
  | { type: 'GameEnded'; data: { lifes: PlayerPoints } }
  | { type: 'PlayerJoined'; data: Player; }
  | { type: 'Snapshot'; data: MatchSnapshot; }
  | { type: 'Error'; data: { msg: string }; }

export function deserializeServerMessage(json: string): ServerMessage {
  const parsed = JSON.parse(json);

  return parsed as ServerMessage;
}
