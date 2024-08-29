import { Injectable } from '@angular/core';
import { deserializeServerMessage } from './server.service';
import { Router } from '@angular/router';
import { ClientGameMessage } from './client.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket = new WebSocket(environment.websocket_url);

  constructor(private router: Router) {
    this.socket.onmessage = (event: MessageEvent) => {

      const message = deserializeServerMessage(event.data);
      console.log('server: ', message);

      switch (message.type) {
        case "Game":
          return { type: "Game", };
        case "Error":
          return { type: "Error", };
        default:
          throw new Error("Unknown message type");
      }

    };
  }

  public sendAuth() {
    this.socket.onopen = () => {
      console.log('WebSocket is connected.');
      // const obj: ClientMessage = { type: "Auth", data: "Joao" };
      // this.sendMessage(obj);
    };
  }

  sendMessage(message: ClientGameMessage) {
    console.log('client: ', message);
    const json = JSON.stringify(message);
    this.socket.send(json);

  }
}
