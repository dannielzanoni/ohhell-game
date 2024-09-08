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

export function getCardImage(card: Card) {
    return `${translateRank(card.rank)}${translateSuit(card.suit)}`
}

function translateRank(rank: Rank) {
    switch (rank) {
        case Rank.Four:
            return "4";
        case Rank.Five:
            return "5";
        case Rank.Six:
            return "6";
        case Rank.Seven:
            return "7";
        case Rank.Ten:
            return "10";
        case Rank.Eleven:
            return "11";
        case Rank.Twelve:
            return "12";
        case Rank.One:
            return "1";
        case Rank.Two:
            return "2";
        case Rank.Three:
            return "3";
    }
}
function translateSuit(suit: Suit) {
    switch (suit) {
        case Suit.Golds:
            return "ouro"
        case Suit.Swords:
            return "espada"
        case Suit.Cups:
            return "copas"
        case Suit.Clubs:
            return "paus"
    }
}