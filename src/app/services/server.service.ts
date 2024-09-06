import { Player, PlayerPoints } from "../models/player";
import { Card, Turn } from "../models/turn";


// Server Game Message
export type ServerGameMessage =
    | { type: 'PlayerTurn'; data: { player_id: string } }
    | { type: 'TurnPlayed'; data: { turn: Turn } }
    | { type: 'PlayerBidded'; data: { player_id: string, bid: number } }
    | { type: 'PlayerBiddingTurn'; data: { player_id: string } }
    | { type: 'PlayerReady'; data: { player_id: string } }
    | { type: 'RoundEnded'; data: PlayerPoints }
    | { type: 'PlayerDeck'; data: Card[] }
    | { type: 'SetStart'; data: Card }
    | { type: 'SetEnded'; data: PlayerPoints }
    | { type: 'GameEnded'; data: null };

// Server Message
export type ServerMessage =
    | { type: "Game"; data: ServerGameMessage }
    | { type: "Authorized"; data: Player };


export function deserializeServerMessage(json: string): ServerMessage {
    const parsed = JSON.parse(json);

    // You can add further validation here if needed
    switch (parsed.type) {
        case "Game":
            return { type: "Game", data: parsed.data as ServerGameMessage };
        case "Error":
            return { type: "Authorized", data: parsed.data as Player };
        default:
            console.error("Unknown message type ", parsed);
            throw new Error("Unknown message type",);
    }
}