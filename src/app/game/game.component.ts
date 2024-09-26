import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { LobbyService } from '../services/lobby.service';
import { GameInfoDto, ServerMessage } from '../services/server.service';
import { Card, getCardImage, Rank, Turn } from '../models/turn';
import { getPlayerId, getPlayerInfo, Player, PlayerInfo, PlayerPoints } from '../models/player';
import { AuthService } from '../services/auth.service';

enum GameState {
  NotPlaying,
  Bidding,
  Playing,
}

interface AudioInfo {
  name: string;
  path: string;
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
  upcard: Card | null = null;
  possible_bids: number[] | null = null;
  gameState = GameState.NotPlaying;
  setOrRoundEnded: boolean = false;
  collapsed: boolean = true;
  volume: number = 40;
  audios: AudioInfo[] = [];
  selectedAudio: AudioInfo | null = null;
  selectedAudioBid: AudioInfo | null = null;
  audioPlayer: HTMLAudioElement | null = null;
  audiosBid: AudioInfo[] = [];

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  @ViewChild('cardsContainer') cardsContainer!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private lobbyService: LobbyService,
    private authService: AuthService
  ) {
    this.gameService.emitter.subscribe(x => {
      this.handleServerGameMessage(x);
    });
  }

  ngOnInit(): void {
    this.join();

    this.audios = [
      { name: 'Default', path: '../assets/sounds/default.mp3' },
      { name: 'Renato Cariani', path: '../assets/sounds/cariani.mp3' },
      { name: 'Kanye West', path: '../assets/sounds/kanye.wav' },
      { name: 'LUCAS1', path: '../assets/sounds/lucas1.mp3' },
    ];

    this.audiosBid = [
      { name: 'Default', path: '../assets/sounds/bid.mp3' }
    ]

    this.selectedAudio = this.audios[0];
    this.selectedAudioBid = this.audiosBid[0];
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

      this.gameService.auth(x.should_reconnect);
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
    return this.gameState == GameState.Playing
  }

  bidding() {
    return this.gameState == GameState.Bidding
  }

  notReady() {
    return this.gameState == GameState.NotPlaying
  }

  handleServerGameMessage(message: ServerMessage) {
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
      case 'Reconnect':
        return this.reconnect(message.data)
      case 'Error':
        return this.handleError(message.data)
    }
  }

  reconnect(gameInfo: GameInfoDto) {
    switch (gameInfo.stage.type) {
      case "Dealing": this.gameState = GameState.Playing; break
      case "Bidding":
        this.gameState = GameState.Bidding;
        const yourTurn = gameInfo.current_player == this.authService.getID();
        this.possible_bids = yourTurn ? gameInfo.stage.data.possible_bids : null
        break
    }

    this.cardsPlayer = gameInfo.deck
    this.upcard = gameInfo.upcard

    for (const info of gameInfo.info) {
      const player = this.players.get(info.id)

      if (!player) {
        console.error("Missing player on reconnect: ", gameInfo)
        continue;
      }

      player.turnToPlay = info.id == gameInfo.current_player
      player.lifes = info.lifes
      player.setInfo = { points: info.rounds, bid: info.bid }
    }
  }

  handleError(data: { msg: string; }) {
    console.error("GameError: ", data.msg)
  }

  handlePlayerJoined(data: Player) {
    const id = getPlayerId(data);
    const player = this.players.get(id);

    if (!player) {
      this.players.set(id, getPlayerInfo(data))
    } else {
      player.data = data
    }
  }

  handlePlayerStatusChange(data: { player_id: string; ready: boolean }) {
    const player = this.players.get(data.player_id)

    if (!player) {
      console.error('Missing player on handlePlayerStatusChange: ', data)
      return
    }

    player.ready = data.ready;
  }

  handleGameEnded(data: { winner: string, lifes: PlayerPoints }) {
    this.updateLifes(data.lifes);
  }

  private updateLifes(data: PlayerPoints) {
    for (const [id, lifes] of Object.entries(data)) {
      const player = this.players.get(id);

      if (!player) {
        console.error('Missing player on updateLifes: ', data)
        continue
      }

      player.lifes = lifes;
    }
  }

  handleSetEnded(data: { lifes: PlayerPoints }) {
    setTimeout(() => {
      this.updateLifes(data.lifes)

      this.pile = []
    }, 3000);
    this.setOrRoundEnded = true;
  }

  handleSetStart(data: { upcard: Card }) {
    this.setOrRoundEnded = false;
    this.upcard = data.upcard;

    for (const player of this.players.values()) {
      player.setInfo = null
    }
  }

  handlePlayerDeck(data: Card[]) {
    this.totalCardsInRound = data.length;

    this.cardsPlayer = data;
  }

  getCardImage(card: Card) {
    return `../assets/cards/${getCardImage(card)}.jpg`
  }

  handleRoundEnded(data: PlayerPoints) {
    setTimeout(() => {
      for (const [id, points] of Object.entries(data)) {
        const player = this.players.get(id)

        if (!player) {
          console.error('Missing player on handleRoundEnded: ', data)
          return
        }

        player.setInfo!.points = points;
      }

      this.pile = []
    }, 3000);
    this.setOrRoundEnded = true;
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
    this.setOrRoundEnded = false;
    const yourTurn = data.player_id == this.authService.getID();
    this.possible_bids = yourTurn ? data.possible_bids : null
    this.gameState = GameState.Playing

    for (const [id, player] of this.players) {
      player.turnToPlay = data.player_id == id
    }

    if (yourTurn) {
      this.playAudio(false);
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
    this.setOrRoundEnded = false;
    this.gameState = GameState.Playing;

    const yourTurn = data.player_id == this.authService.getID();

    if (yourTurn) {
      this.playAudio(true);
    }

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
    return Array.from(this.players.values()).filter(p => p.lifes > 0);
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
      setTimeout(() => {
        this.gameService.sendGameMessage({ type: "PlayTurn", data: { card } });
      }, 200);
    }
  }

  moveToCenter(event: Event) {
    const cardElement = event.target as HTMLElement;
    const currentCenterCard = this.cardsContainer.nativeElement.querySelector('.move-to-center');
    if (currentCenterCard) {
      currentCenterCard.classList.remove('move-to-center');
    }
    cardElement.classList.add('move-to-center');

    const audio = new Audio('../assets/sounds/card_animation.mp3');
    audio.play().catch((error) => {
      console.error('Error to play card animation sound:', error);
    });
  }

  handleCardClick(event: MouseEvent, card: Card) {
    const me = this.players.get(this.authService.getID()!);

    if (!me?.turnToPlay || this.bidding()) {
      return;
    }

    this.moveToCenter(event);

    setTimeout(() => {
      if (!this.bidding()) {
        this.playCard(card);
      }
    }, 500);
  }

  getJokerValue(): Rank | null {
    const currentRank = this.upcard?.rank;
    return currentRank ? this.getNextRank(currentRank) : null;
  }

  getNextRank(rank: Rank): Rank | null {
    const rankOrder = [
      Rank.One,
      Rank.Two,
      Rank.Three,
      Rank.Four,
      Rank.Five,
      Rank.Six,
      Rank.Seven,
      Rank.Ten,
      Rank.Eleven,
      Rank.Twelve,
    ];

    const currentIndex = rankOrder.indexOf(rank);

    if (currentIndex >= 0) {
      return rankOrder[(currentIndex + 1) % rankOrder.length];
    }

    return null;
  }

  playAudio(isPlayerTurn: boolean) {
    if (isPlayerTurn && this.selectedAudio?.path) {
      this.playAudioPlayer(this.selectedAudio?.path);
    }
    else {
      this.playAudioPlayer(this.selectedAudioBid?.path!)
    }
  }

  private playAudioPlayer(path: string) {
    this.audioPlayer = new Audio(path);
    if (this.audioPlayer) {
      this.audioPlayer.volume = this.volume / 100;
      this.audioPlayer.play().catch((error: any) => {
        console.error('Error to play audio:', error);
      });
    }
  }

  onVolumeChange() {
    if (this.audioPlayer) {
      this.audioPlayer.volume = this.volume / 100;
    }
  }

}
