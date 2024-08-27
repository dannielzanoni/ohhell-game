import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent {
  messages: string[] = [];
  players: { [key: number]: { userName: string, profilePicture: string, ready: boolean } } = {};
  roomId!: string;
  userName!: string;
  roomLink: string = '';
  profilePicture!: string;
  readyPlayersCount: number = 0;
  totalPlayersCount: number = 0;
  allPlayersReady: boolean = false;
  cards = [
    '../assets/cards/1ouro.jpg',
    '../assets/cards/2ouro.jpg',
    '../assets/cards/3ouro.jpg'
  ];


  @ViewChild('cardsContainer') cardsContainer!: ElementRef;

  constructor(private route: ActivatedRoute) { }


  markAsReady() {
    // this.socket.emit('playerReady');
  }

  // ngOnInit() {
  //   this.roomId = this.route.snapshot.paramMap.get('roomId')!;
  //   this.userName = this.route.snapshot.paramMap.get('userName')!;
  //   this.profilePicture = decodeURIComponent(this.route.snapshot.paramMap.get('profilePicture')!);
  //   this.socket = io();
  //   this.roomLink = `${window.location.origin}/entry-room/${this.roomId}`;
  //   this.socket.emit('playerJoin', { roomId: this.roomId, userName: this.userName, profilePicture: this.profilePicture });

  //   this.socket.on('message', (data: any) => {
  //     const { id, message, special } = data;
  //     if (message.includes("leave the lobby") || message.includes("joined the lobby")) {
  //       this.messages.push(`${message}`);
  //     } else {
  //       this.messages.push(`${id}: ${message}`);
  //     }
  //   });

  //   this.socket.on('allPlayers', (players: any[]) => {
  //     this.players = {};  // Clear current players list
  //     let readyCount = 0;
  //     players.sort((a, b) => a.position - b.position).forEach(player => {
  //       this.players[player.position] = {
  //         userName: player.userName,
  //         profilePicture: player.profilePicture,
  //         ready: player.ready
  //       };
  //       if (player.ready) {
  //         readyCount++;
  //       }
  //     });
  //     this.readyPlayersCount = readyCount;
  //     this.checkAllPlayersReady();
  //   });

  //   this.socket.on('playerJoined', (data: any) => {
  //     const { position, userName, profilePicture, ready } = data;
  //     this.players[position] = { userName, profilePicture, ready };
  //     this.checkAllPlayersReady();
  //   });

  //   this.socket.on('playerLeft', (data: any) => {
  //     const { position } = data;
  //     delete this.players[position];
  //     this.checkAllPlayersReady();
  //   });

  //   this.socket.on('totalPlayersCount', (count: number) => {
  //     this.totalPlayersCount = count;
  //     this.checkAllPlayersReady();
  //   });

  //   this.socket.on('readyPlayersCount', (count: number) => {
  //     this.readyPlayersCount = count;
  //     this.checkAllPlayersReady();
  //   });

  //   this.socket.on('playerReady', (data: any) => {
  //     this.readyPlayersCount = data.readyPlayersCount;
  //     this.messages.push(`${data.userName} is ready!`);
  //     this.checkAllPlayersReady();
  //   });
  // }

  generateRoomLink() {
    this.roomLink = `${window.location.origin}/entry-room/${this.roomId}`;
    const content1 = document.createElement('textarea');
    content1.style.position = 'fixed';
    content1.style.left = '0';
    content1.style.top = '0';
    content1.style.opacity = '0';
    content1.value = this.roomLink;
    document.body.appendChild(content1);
    content1.focus();
    content1.select();
    document.execCommand('copy');
    document.body.removeChild(content1);

    var button = document.querySelector('.custom-button');
    button!.classList.add('clicked');
    setTimeout(function () {
      button!.classList.remove('clicked');
    }, 200);
  }

  getHearts(playerKey: string | number): any[] {
    const hearts = new Array(5).fill(0);
    return hearts;
  }

  private checkAllPlayersReady() {
    this.allPlayersReady = this.readyPlayersCount === this.totalPlayersCount && this.totalPlayersCount > 0;
  }

  ngAfterViewInit() {
    this.adjustCardSize();
  }

  adjustCardSize() {
    const cards = this.cardsContainer.nativeElement.querySelectorAll('.card img');
    const numberOfCards = cards.length;
    console.log(numberOfCards);

    let newSize = '7.7rem';

    if (numberOfCards >= 19) {
      newSize = '5.5rem';
    } else if (numberOfCards >= 16) {
      newSize = '6rem';
    }

    cards.forEach((card: HTMLImageElement) => {
      card.style.width = newSize;
    });
  }

  moveToCenter(event: Event) {
    const cardElement = event.target as HTMLElement;
    const currentCenterCard = this.cardsContainer.nativeElement.querySelector('.move-to-center');
    if (currentCenterCard) {
      currentCenterCard.classList.remove('move-to-center');
    }
    cardElement.classList.add('move-to-center');
  }
}
