import { HttpClient } from "@angular/common/http";
import { deserializeServerMessage } from "./server.service";
import { environment } from '../../environments/environment';
import { ClientGameMessage } from "./client.service";
import { Injectable } from "@angular/core";

export interface ViewLobbyDTO {
    id: string;
    playerCount: number;
}

export interface JoinLobbyDTO {
    id: string;
    players: Player[];
}

type Player = GooglePlayer | AnonymousPlayer;

type GooglePlayer = {
    email: string;
    picture: string;
    name: string;
}

type AnonymousPlayer = {
    pictureIndex: number;
    name: string;
    id: string;
}

type CreateLobby = {
    lobbyId: string;
}

@Injectable({
    providedIn: 'root'
})

export class LobbyService {

    constructor(private client: HttpClient) {
    }

    getLobbies() {
        return this.client.get<ViewLobbyDTO[]>(`${environment.api_url}/lobby`)
    }

    joinLobby(id: string) {
        return this.client.put<JoinLobbyDTO>(`${environment.api_url}/lobby/${id}`, '')
    }

    createLobby() {
        return this.client.post<CreateLobby>(`${environment.api_url}/lobby`, '')
    }
}