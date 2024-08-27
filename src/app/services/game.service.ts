import { Injectable } from '@angular/core';
import { deserializeServerMessage } from './server.service';
import { Router } from '@angular/router';
import { ClientGameMessage } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket = new WebSocket('ws://localhost:3000/');

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
