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
  data?: { [key: string]: null }
}

export type AnonymousPlayer = {
  id: string;
  data: { [key: string]: string }
}

export type PlayerInfo = {
  lifes: number;
  data: Player;
  ready: boolean;
  setInfo: SetInfo | null;
  turnToPlay: boolean;
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

export function getPlayerInfo(player: Player, ready = false): PlayerInfo {
  return { lifes: 5, data: player, ready, setInfo: null, turnToPlay: false }
}

export function getPlayerNickname(player: Player) {
  switch (player.type) {
    case "Anonymous":
      return player.data.data["nickname"] || player.data.id;
    case "Google":
      return player.data.name || player.data.email;
    default:
      throw new Error('Unknown player type');
  }
}

export function getPlayerPicture(player: Player) {
  switch (player.type) {
    case "Anonymous":
      return player.data.data["picture"] || '';
    case "Google":
      return player.data.picture || '';
    default:
      throw new Error('Unknown player type');
  }
}

//id e pontos do jogador
//roundended retorna pontos
//setendend retorna vidas
export type PlayerPoints = { [key: string]: number };
