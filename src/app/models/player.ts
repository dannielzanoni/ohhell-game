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
  nickname?: string | null;
  picture_override?: string | null;
}

export type AnonymousPlayer = {
  id: string;
  data: { [key: string]: string }
}

export type PlayerInfo = {
  lifes: number | null;
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

export function getPlayerInfo(player: Player, ready = false, lifes: number | null = null): PlayerInfo {
  return { lifes, data: player, ready, setInfo: null, turnToPlay: false }
}

export function getPlayerNickname(player: Player) {
  switch (player.type) {
    case "Anonymous":
      return player.data.data["nickname"] || player.data.id;
    case "Google":
      return player.data.nickname || player.data.name || player.data.email;
    default:
      throw new Error('Unknown player type');
  }
}

export function getPlayerPicture(player: Player) {
  switch (player.type) {
    case "Anonymous":
      return player.data.data["picture"] || '';
    case "Google":
      return player.data.picture_override || player.data.picture || '';
    default:
      throw new Error('Unknown player type');
  }
}

//id e pontos do jogador
//roundended retorna pontos
//setendend retorna vidas
export type PlayerPoints = { [key: string]: number };
