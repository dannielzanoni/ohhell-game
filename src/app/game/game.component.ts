import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { LobbyService, PlayerReadyDTO } from '../services/lobby.service';
import { ServerGameMessage, ServerMessage } from '../services/server.service';
import { Card, Turn } from '../models/turn';
import { PlayerPoints } from '../models/player';

@Component({
  selector: 'app-room',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {
  messages: string[] = [];
  players: PlayerReadyDTO[] = [];
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
  roomId: string | null = null;
  isValidGuid: boolean = false;


  @ViewChild('cardsContainer') cardsContainer!: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private gameService: GameService, private lobbyService: LobbyService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

      this.roomId = params.get('id');
      if (this.roomId == null) {
        this.router.navigate(['viewgames']);
        return
      }

      this.lobbyService.joinLobby(this.roomId).subscribe(x => {
        this.players = x!.players;
        this.totalPlayersCount = this.players.length;

        this.gameService.auth();
        this.gameService.emitter.subscribe(x => {
          this.handleServerGameMessage(x);
        });
      });

    });
  }

  //todo999 form pra inputar name foto quando entrar por link
  //todo dar pull no back para playerInfo.player.data.name

  handleServerGameMessage(message: ServerGameMessage) {
    switch (message.type) {
      case 'PlayerTurn':
        return this.handlePlayerTurn(message.data);
      case 'TurnPlayed':
        return this.handleTurnPlayed(message.data);
      case 'PlayerBidded':
        return this.handlePlayerBidded(message.data);
      case 'PlayerBiddingTurn':
        return this.handlePlayerBiddingTurn(message.data);
      case 'PlayerReady':
        return this.handlePlayerReady(message.data);
      case 'RoundEnded':
        return this.handleRoundEnded(message.data);
      case 'PlayerDeck':
        return this.handlePlayerDeck(message.data);
      case 'SetStart':
        return this.handleSetStart(message.data);
      case 'SetEnded':
        return this.handleSetEnded(message.data);
      case 'GameEnded':
        return this.handleGameEnded(message.data);
    }
  }


  //fazer handles

  handleGameEnded(data: null) {
    //game terminou
  }

  handleSetEnded(data: PlayerPoints) {
    //fim do set, retorna um dicionario com id do player e o numero de pontos
  }

  handleSetStart(data: Card) {
    //coringa
  }

  handlePlayerDeck(data: Card[]) {
    //cartas do jogador
    //mostar as cartas na tela do jogador

  }

  handleRoundEnded(data: PlayerPoints) {
    //round terminou, retorna um dicionario com id do player e o numero de vidas atualizada
  }

  handlePlayerBidded(data: { player_id: string; bid: number; }) {
    //player apostou o valor
    //mostrar valor na tela para os outros tchos
  }

  handlePlayerReady(data: { player_id: string; }) {
    //player deu ready
  }

  handleTurnPlayed(data: { turn: Turn; }) {
    //fazer animacao da carta
    //player jogou alguma carta
  }

  handlePlayerTurn(data: { player_id: string; }) {
    //pintar o player da vez
  }

  handlePlayerBiddingTurn(data: { player_id: string; }) {
    //mostrar qual tcho deve apostar suas bids
  }


  checkAllPlayersReady() {
    this.allPlayersReady = this.readyPlayersCount === this.totalPlayersCount && this.readyPlayersCount >= 2;
  }

  markAsReady() {
    this.players.forEach(player => {
      if (player.player.data.name === this.userName) {
        player.ready = true;
      }
    });
    this.readyPlayersCount = this.getReadyPlayers().length;
    this.checkAllPlayersReady();
  }

  getReadyPlayers() {
    return this.players.filter(playerReadyDTO => playerReadyDTO.ready);
  }

  displayPlayers() {
    this.players.forEach(playerReadyDTO => {
      console.log(`Player: ${playerReadyDTO.player.data.name}, Ready: ${playerReadyDTO.ready}`);
    })
  }

  generateRoomLink() {
    this.roomLink = ``;
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

  ngAfterViewInit() {
    this.adjustCardSize();
  }

  adjustCardSize() {
    if (!this.allPlayersReady) {
      return
    }

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
