import { Turn } from "./client.service";

export interface Lobby {
    id: string;
    players: string[];
}

// Server Game Message
export type ServerGameMessage =
    | { type: "PlayerTurn"; data: { turn: Turn; state: GameState } }
    | { type: "PlayerBidded"; data: { player_id: string; bid: number } };

// Server Message
export type ServerMessage =
    | { type: "Game"; data: ServerGameMessage }
    | { type: "Error"; data: string };

// Assuming GameState is defined somewhere
export interface GameState {
    // Define the structure of GameState based on your Rust code

}

export function deserializeServerMessage(json: string): ServerMessage {
    const parsed = JSON.parse(json);

    // You can add further validation here if needed
    switch (parsed.type) {
        case "Game":
            return { type: "Game", data: parsed.data as ServerGameMessage };
        case "Error":
            return { type: "Error", data: parsed.data as string };
        default:
            throw new Error("Unknown message type");
    }
}