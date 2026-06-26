import { EventEmitter, Injectable } from '@angular/core';
import { deserializeServerMessage, ServerMessage } from './server.service';
import { Router } from '@angular/router';
import { ClientMessage } from './client.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

export type GameConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket: WebSocket | undefined;
  private pendingMessages: ClientMessage[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = false;
  emitter = new EventEmitter<ServerMessage>();
  connectionState$ = new BehaviorSubject<GameConnectionState>('disconnected');

  constructor(private router: Router, private authService: AuthService) {

  }

  async auth() {
    this.shouldReconnect = true;
    this.pendingMessages = [];
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    this.closeSocket();

    await this.connect(false);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.pendingMessages = [];
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    this.closeSocket();
    this.connectionState$.next('disconnected');
  }

  private async connect(isReconnect: boolean) {
    const token = await this.authService.ensureValidToken();

    if (!token) {
      this.disconnect();
      this.router.navigate(['/']);
      return;
    }

    if (!this.shouldReconnect) {
      return;
    }

    this.connectionState$.next(isReconnect ? 'reconnecting' : 'connecting');
    this.socket = new WebSocket(`${environment.websocket_url}?token=${token}`);

    this.handleSocket(this.socket);
  }

  private closeSocket() {
    const socket = this.socket;

    this.socket = undefined;

    if (!socket) {
      return;
    }

    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer) {
      return;
    }

    const delayMs = Math.min(1000 * 2 ** this.reconnectAttempts, 5000);
    this.reconnectAttempts += 1;
    this.connectionState$.next('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect(true);
    }, delayMs);
  }

  private handleSocket(socket: WebSocket) {
    socket.onopen = () => {
      if (this.socket !== socket) {
        return;
      }

      this.reconnectAttempts = 0;
      this.connectionState$.next('connected');

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
      if (this.socket !== socket) {
        return;
      }

      console.error('WebSocket error: ', error);
    };

    socket.onclose = (event: CloseEvent) => {
      if (this.socket !== socket) {
        return;
      }

      this.socket = undefined;
      console.warn('WebSocket closed: ', event);

      if (!this.shouldReconnect) {
        this.connectionState$.next('disconnected');
        return;
      }

      this.scheduleReconnect();
    };
  }

  public sendMessage(message: ClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendOpenMessage(message);
    } else if (this.socket?.readyState === WebSocket.CONNECTING) {
      this.pendingMessages.push(message);
    } else {
      console.warn('Dropping game message while websocket is unavailable: ', message);
    }
  }

  private sendOpenMessage(message: ClientMessage) {
    console.log('client: ', message);
    const json = JSON.stringify(message);
    this.socket!.send(json);
  }
}
