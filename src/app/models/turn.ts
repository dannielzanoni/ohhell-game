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
