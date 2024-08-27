import { Turn } from "./client.service";

export interface Lobby {
    id: string;
    players: string[];
}

// Server Lobby Message
export type ServerLobbyMessage =
    | { type: "AvailableLobbies"; data: Lobby[] }
    | { type: "GameStarted"; data: { game_id: string } }
    | { type: "LobbyCreated"; data: { game_id: string } }
    | { type: "LobbyJoined"; data: { game_id: string; players: string[] } }
    | { type: "PlayerJoined"; data: { player_id: string } };

// Server Game Message
export type ServerGameMessage =
    | { type: "PlayerTurn"; data: { turn: Turn; state: GameState } }
    | { type: "PlayerBidded"; data: { player_id: string; bid: number } };

// Server Message
export type ServerMessage =
    | { type: "Lobby"; data: ServerLobbyMessage }
    | { type: "Game"; data: ServerGameMessage }
    | { type: "Authorized"; data: string }
    | { type: "Error"; data: string };

// Assuming GameState is defined somewhere
export interface GameState {
    // Define the structure of GameState based on your Rust code

}

export function deserializeServerMessage(json: string): ServerMessage {
    const parsed = JSON.parse(json);

    // You can add further validation here if needed
    switch (parsed.type) {
        case "Lobby":
            return { type: "Lobby", data: parsed.data as ServerLobbyMessage };
        case "Game":
            return { type: "Game", data: parsed.data as ServerGameMessage };
        case "Authorized":
            return { type: "Authorized", data: parsed.data as string };
        case "Error":
            return { type: "Error", data: parsed.data as string };
        default:
            throw new Error("Unknown message type");
    }
}