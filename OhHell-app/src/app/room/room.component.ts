import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit, OnDestroy {
  private socket!: Socket;
  messages: string[] = [];
  players: { [key: number]: string } = {};
  roomId!: string;
  userName!: string;
  roomLink: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId')!;
    this.userName = this.route.snapshot.paramMap.get('userName')!;
    this.socket = io();
    this.roomLink = `${window.location.origin}/room/${this.roomId}`;

    this.socket.emit('playerJoin', { roomId: this.roomId, userName: this.userName });

    this.socket.on('message', (data: any) => {
      const { id, message, special } = data;
      if (message.includes("leave the lobby") || message.includes("joined the lobby")) {
        this.messages.push(`${message}`);
      } else {
        this.messages.push(`${id}: ${message}`);
      }
    });

    this.socket.on('allPlayers', (players: any[]) => {
      players.sort((a, b) => a.position - b.position).forEach(player => {
        this.players[player.position] = player.userName;
      });
    });

    this.socket.on('playerJoined', (data: any) => {
      const { playerId, position, userName } = data;
      this.players[position] = userName;
    });

    this.socket.on('playerLeft', (data: any) => {
      const { playerId, position } = data;
      delete this.players[position];
    });
  }

  ngOnDestroy() {
    this.socket.emit('playerLeave');
    this.socket.disconnect();
  }

  sendMessage(event: Event) {
    event.preventDefault();
    const input = (event.target as HTMLFormElement).querySelector('input');
    const message = input?.value;
    if (message) {
      this.socket.emit('message', { message });
      input.value = '';
    }
  }

  generateRoomLink() {
    this.roomLink = `${window.location.origin}/room/${this.roomId}`;
  }
}
