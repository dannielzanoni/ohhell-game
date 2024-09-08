import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { LobbyService, PlayerReadyDTO } from '../services/lobby.service';
import { ServerGameMessage } from '../services/server.service';
import { Card, getCardImage, Turn } from '../models/turn';
import { getPlayerId, getPlayerInfo, Player, PlayerInfo, PlayerPoints } from '../models/player';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-room',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {
  players: Map<string, PlayerInfo> = new Map;
  userName!: string;
  roomLink: string = '';
  profilePicture!: string;
  readyPlayersCount: number = 0;
  allPlayersReady: boolean = false;
  roomId: string | null = null;
  isValidGuid: boolean = false;
  isAuthenticated: boolean = false;
  ready: boolean = false;
  showBidsContainer: boolean = false;
  totalCardsInRound: number = 0;
  cardsPlayer: Card[] = [];
  trump: Card | null = null;

  @ViewChild('cardsContainer') cardsContainer!: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private gameService: GameService, private lobbyService: LobbyService, private authService: AuthService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

      this.roomId = params.get('id');
      if (this.roomId == null) {
        this.router.navigate(['viewgames']);
        return
      }

      if (!this.authService.isUserAuthenticated()) {
        return
      }
      //load component player
      this.joinLobby();

    });
  }

  joinLobby() {
    this.isAuthenticated = true;

    this.lobbyService.joinLobby(this.roomId!).subscribe(x => {
      this.players = new Map(x.players.map(p => [getPlayerId(p.player), getPlayerInfo(p.player)]))

      this.gameService.auth();
      this.gameService.emitter.subscribe(x => {
        this.handleServerGameMessage(x);
      });
    });
  }

  totalPlayersCount() {
    return this.players.size
  }

  totalReadyPlayersCount() {
    return [...this.players].filter(x => x[1].ready).length
  }

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
      case 'PlayerStatusChange':
        return this.handlePlayerStatusChange(message.data);
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
      case 'PlayerJoined':
        return this.handlePlayerJoined(message.data);
    }
  }

  handlePlayerJoined(data: Player) {
    this.players.set(getPlayerId(data), getPlayerInfo(data));
    // ver como registrar mudanca
  }

  handlePlayerStatusChange(data: { player_id: string; ready: boolean }) {
    const player = this.players.get(data.player_id)

    if (!player) {
      console.error('nao achou o player', this.players, data.player_id)
      return
    }

    player.ready = data.ready;
  }

  handleGameEnded(data: null) {
    //game terminou
  }

  handleSetEnded(data: PlayerPoints) {
    //fim do set, retorna um dicionario com id do player e o numero de pontos
    for (const [id, lifes] of data) {
      const player = this.players.get(id)

      player!.lifes = lifes;
    }
  }

  handleSetStart(data: { trump: Card }) {
    this.trump = data.trump;

    for (const player of this.players.values()) {
      player.setInfo = null
    }
  }

  handlePlayerDeck(data: Card[]) {
    //cartas do jogador
    //mostar as cartas na tela do jogador
    this.totalCardsInRound = data.length;

    this.cardsPlayer = data;
  }

  getCardImage(card: Card) {
    return `../assets/cards/${getCardImage(card)}.jpg`
  }

  handleRoundEnded(data: PlayerPoints) {
    //round terminou, retorna um dicionario com id do player e o numero de vidas atualizada
    for (const [id, points] of data) {
      const player = this.players.get(id)

      player!.setInfo!.points = points;
    }
  }

  handlePlayerBidded(data: { player_id: string; bid: number; }) {
    //mostrar valor na tela para os outros tchos
    const player = this.players.get(data.player_id)

    if (player?.setInfo) {
      player.setInfo.bid = data.bid
    }
    else {
      player!.setInfo = { bid: data.bid, points: 0 }
    }
  }

  handlePlayerBiddingTurn(data: { player_id: string; }) {
    //mostrar qual tcho deve apostar suas bids
    this.showBidsContainer = true;
  }

  handleTurnPlayed(data: { turn: Turn; }) {
    //fazer animacao da carta
    //player jogou alguma carta
  }

  handlePlayerTurn(data: { player_id: string; }) {
    //pintar o player da vez
  }

  getHearts(lifes: number) {
    return Array(lifes).fill(null)
  }

  getBids(): number[] {
    const bidCount = this.totalCardsInRound;
    return Array(bidCount + 1).fill(0).map((_, i) => i);
  }

  getPoints(player: PlayerInfo) {
    if (player.setInfo) {
      return Array(player.setInfo.points).fill(null)
    }
    return []
  }

  getMapEntries() {
    return Array.from(this.players.values());
  }

  markAsReady() {
    this.ready = !this.ready;
    this.gameService.sendGameMessage({ type: "PlayerStatusChange", data: { ready: this.ready } })
  }

  playersToStart() {
    return this.players.size > 1
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
