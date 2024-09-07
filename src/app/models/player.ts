import { PlayerReadyDTO } from "../services/lobby.service";

export type Player = {
    type: "Anonymous",
    data: AnonymousPlayer,
} | {
    type: "Google",
    data: GooglePlayer
};

export type GooglePlayer = {
    email: string;
    picture: string;
    name: string;
}

export type AnonymousPlayer = {
    picture: string;
    name: string;
    id: string;
}

export type PlayerInfo = {
    lifes: number;
    data: Player;
    ready: boolean;
    setInfo: SetInfo | null;
}

export type SetInfo = {
    bid: number;
    points: number;
}

export function getPlayerId(player: Player) {
    switch (player.type) {
        case "Anonymous":
            return player.data.id
        case "Google":
            return player.data.email
        default:
            throw new Error('Unknown player type');
    }
}

export function getPlayerInfo(player: Player) {
    return { lifes: 5, data: player, ready: false, setInfo: null }
}

//id e pontos do jogador
//roundended retorna pontos
//setendend retorna vidas
export type PlayerPoints = Map<string, number>;