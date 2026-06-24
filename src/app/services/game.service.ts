import { EventEmitter, Injectable } from '@angular/core';
import { deserializeServerMessage, ServerMessage } from './server.service';
import { Router } from '@angular/router';
import { ClientMessage } from './client.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket: WebSocket | undefined;
  private pendingMessages: ClientMessage[] = [];
  emitter = new EventEmitter<ServerMessage>();

  constructor(private router: Router, private authService: AuthService) {

  }

  async auth() {
    const token = await this.authService.ensureValidToken();

    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.socket?.close();
    this.pendingMessages = [];
    this.socket = new WebSocket(`${environment.websocket_url}?token=${token}`);

    this.handleSocket();
  }

  private handleSocket() {
    const socket = this.socket;

    if (socket) {
      socket.onopen = () => {
        if (this.socket !== socket) {
          return;
        }

        for (const message of this.pendingMessages) {
          this.sendOpenMessage(message);
        }

        this.pendingMessages = [];
      };

      socket.onmessage = (event: MessageEvent) => {
        if (this.socket !== socket) {
          return;
        }

        const message = deserializeServerMessage(event.data);
        console.log('server: ', message);

        return this.emitter.emit(message);
      };

      socket.onerror = (error: Event) => {
        console.error('WebSocket error: ', error);
      };

      socket.onclose = (event: CloseEvent) => {
        console.warn('WebSocket closed: ', event);
      };
    } else {
      console.error('WebSocket is not initialized');
    }
  }

  public sendMessage(message: ClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendOpenMessage(message);
    } else if (this.socket?.readyState === WebSocket.CONNECTING) {
      this.pendingMessages.push(message);
    } else {
      console.error('WebSocket is not initialized');
    }
  }

  private sendOpenMessage(message: ClientMessage) {
    console.log('client: ', message);
    const json = JSON.stringify(message);
    this.socket!.send(json);
  }
}
