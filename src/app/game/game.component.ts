import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { LobbyService } from '../services/lobby.service';
import { ServerGameMessage } from '../services/server.service';
import { Card, getCardImage, Turn } from '../models/turn';
import { getPlayerId, getPlayerInfo, Player, PlayerInfo, PlayerPoints } from '../models/player';
import { AuthService } from '../services/auth.service';

enum GameState {
  NotPlaying,
  Bidding,
  Dealing,
}

@Component({
  selector: 'app-room',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {
  players: Map<string, PlayerInfo> = new Map;
  ready: boolean = false;
  totalCardsInRound: number = 0;
  cardsPlayer: Card[] = [];
  pile: Turn[] = [];
  trump: Card | null = null;
  possible_bids: number[] | null = null;
  gameState = GameState.NotPlaying;

  @ViewChild('cardsContainer') cardsContainer!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private lobbyService: LobbyService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.join();
  }

  join() {
    this.route.paramMap.subscribe(params => {
      const roomId = params.get('id');
      if (roomId == null) {
        this.router.navigate(['viewgames']);
        return;
      }

      if (this.authService.isUserAuthenticated()) {
        this.joinLobby(roomId);
      }
    });
  }

  joinLobby(roomId: string) {
    this.lobbyService.joinLobby(roomId).subscribe(x => {
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

  isAuthenticated() {
    return this.authService.isUserAuthenticated()
  }

  playing() {
    return this.gameState == GameState.Dealing
  }

  bidding() {
    return this.gameState == GameState.Bidding
  }

  notReady() {
    return this.gameState == GameState.NotPlaying
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

  handleGameEnded(data: { winner: string, lifes: PlayerPoints }) {
    //game terminou

    this.updateLifes(data.lifes);
  }

  private updateLifes(data: PlayerPoints) {
    for (const [id, lifes] of Object.entries(data)) {
      const player = this.players.get(id);

      player!.lifes = lifes;
    }
  }

  handleSetEnded(data: PlayerPoints) {
    this.updateLifes(data)

    this.pile = []
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
    for (const [id, points] of Object.entries(data)) {
      const player = this.players.get(id)

      player!.setInfo!.points = points;
    }

    this.pile = []
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

  handlePlayerBiddingTurn(data: { player_id: string; possible_bids: number[] }) {
    //mostrar qual tcho deve apostar suas bids
    //
    const yourTurn = data.player_id == this.authService.getID();
    this.possible_bids = yourTurn ? data.possible_bids : null

    for (const [id, player] of this.players) {
      player.turnToPlay = data.player_id == id
    }

    if (yourTurn) {
      this.gameState = GameState.Bidding;
    }
  }

  sendBid(bid: number) {
    this.gameService.sendGameMessage({ type: "PutBid", data: { bid } })
  }

  bidTurn() {
    return this.possible_bids != null
  }

  handleTurnPlayed(data: { pile: Turn[] }) {
    //fazer animacao da carta

    this.pile = data.pile
  }

  handlePlayerTurn(data: { player_id: string; }) {
    //pintar o player da vez´
    this.gameState = GameState.Dealing;

    for (const [id, player] of this.players) {
      player.turnToPlay = data.player_id == id
    }
  }

  getHearts(lifes: number) {
    return Array(lifes).fill(null)
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

  playCard(card: Card) {
    const me = this.players.get(this.authService.getID()!)

    if (me?.turnToPlay) {
      this.cardsPlayer.splice(this.cardsPlayer.indexOf(card), 1)
      this.gameService.sendGameMessage({ type: "PlayTurn", data: { card } })
    }
  }
}
