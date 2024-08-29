export type Player = {
    type: "AnonymousUserClaims",
    data: AnonymousPlayer,
} | {
    type: "GoogleUserClaims",
    data: GooglePlayer
};

export type GooglePlayer = {
    email: string;
    picture: string;
    name: string;
}

export type AnonymousPlayer = {
    picture_index: number;
    name: string;
    id: string;
}