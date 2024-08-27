export enum Rank {
    Four = "Four",
    Five = "Five",
    Six = "Six",
    Seven = "Seven",
    Ten = "Ten",
    Eleven = "Eleven",
    Twelve = "Twelve",
    One = "One",
    Two = "Two",
    Three = "Three",
}

export enum Suit {
    Golds = "Golds",
    Swords = "Swords",
    Cups = "Cups",
    Clubs = "Clubs",
}

export interface Turn {
    player_id: string;
    card: Card;
}

export interface Card {
    rank: Rank;
    suit: Suit;
}

// Client Lobby Message
export type ClientLobbyMessage =
    | { type: "RequestLobbies" }
    | { type: "CreateLobby"; data: { player_id: string } }
    | { type: "JoinLobby"; data: { player_id: string; lobby_id: string } }
    | { type: "StartGame"; data: { game_id: string } };

// Client Game Message
export type ClientGameMessage =
    | { type: "PlayTurn"; data: { game_id: string; turn: Turn } }
    | { type: "PutBid"; data: { game_id: string; player_id: string; bid: number } };

// Client Message
export type ClientMessage =
    | { type: "Lobby"; data: ClientLobbyMessage }
    | { type: "Game"; data: ClientGameMessage }
    | { type: "Auth"; data: string };

// Function to serialize to the expected format
export function serializeMessage(message: ClientMessage): string {
    return JSON.stringify({
        type: message.type,
        data: message.data,
    });
}
