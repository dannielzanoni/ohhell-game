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


// Client Game Message
export type ClientGameMessage =
    | { type: "PlayTurn"; data: { game_id: string; turn: Turn } }
    | { type: "PutBid"; data: { game_id: string; player_id: string; bid: number } };


// Function to serialize to the expected format
export function serializeMessage(message: ClientGameMessage): string {
    return JSON.stringify({
        type: message.type,
        data: message.data,
    });
}
