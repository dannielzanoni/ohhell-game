import { Injectable } from '@angular/core';
import { ClientMessage } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket = new WebSocket('ws://177.10.90.21:3000/');

  constructor() {
    this.socket.onmessage = (event: { data: any; }) => {
      console.log('Message from server:', event.data);
    };
  }

  public sendAuth() {
    const obj: ClientMessage = { type: "Auth", data: "Joao" };
    this.sendMessage(obj);
  }

  sendMessage(message: ClientMessage) {
    const json = JSON.stringify(message);
    this.socket.send(json);
    console.log(json);
  }
}
