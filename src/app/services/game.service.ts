import { EventEmitter, Injectable } from '@angular/core';
import { deserializeServerMessage, ServerMessage } from './server.service';
import { Router } from '@angular/router';
import { ClientGameMessage, ClientMessage } from './client.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket: WebSocket | undefined;
  emitter = new EventEmitter<ServerMessage>();

  constructor(private router: Router) {

  }

  auth() {
    const token = localStorage.getItem('JWT_TOKEN') ?? '';

    if (!token) {
      this.router.navigate(['/']);
      return;
    }
    this.socket = new WebSocket(environment.websocket_url);

    this.socket.onopen = () => {
      this.sendClientMessage({ type: 'Auth', data: { token } });
    };

    this.handleSocket();
  }

  private handleSocket() {
    if (this.socket) {
      this.socket.onmessage = (event: MessageEvent) => {
        const message = deserializeServerMessage(event.data);
        console.log('server: ', message);

        return this.emitter.emit(message);
      };

      this.socket.onerror = (error: Event) => {
        console.error('WebSocket error: ', error);
      };

      this.socket.onclose = (event: CloseEvent) => {
        console.warn('WebSocket closed: ', event);
      };
    } else {
      console.error('WebSocket is not initialized');
    }
  }

  private sendClientMessage(message: ClientMessage) {
    if (this.socket) {
      console.log('client: ', message);
      const json = JSON.stringify(message);
      this.socket.send(json);
    } else {
      console.error('WebSocket is not initialized');
    }
  }

  sendGameMessage(message: ClientGameMessage) {
    this.sendClientMessage({ type: "Game", data: message })
  }
}
