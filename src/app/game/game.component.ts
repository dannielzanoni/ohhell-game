import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameConnectionState, GameService } from '../services/game.service';
import { LobbyService } from '../services/lobby.service';
import { GameInfoDto, MatchSnapshot, PlayerStatusMap, ServerMessage } from '../services/server.service';
import { Card, getCardImage, Rank, Turn } from '../models/turn';
import { getPlayerId, getPlayerInfo, getPlayerNickname, getPlayerPicture, Player, PlayerInfo, PlayerPoints } from '../models/player';
import { AuthService } from '../services/auth.service';
import { Subscription, of } from 'rxjs';
import { concatMap, delay } from 'rxjs/operators';
import { LobbyInfo } from '../services/lobby.service';

enum GameState {
  NotPlaying,
  Bidding,
  Playing,
}

interface AudioInfo {
  name: string;
  path: string;
}

type GameEndSummary = {
  winners: PlayerInfo[];
  winnerNames: string;
  noWinners: boolean;
};

type LifeLossHighlight = {
  player: PlayerInfo;
  lost: number;
};

@Component({
  selector: 'app-room',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnDestroy {
  private readonly eventDelayStorageKey = 'GAME_EVENT_DELAY_MS';
  readonly maxEventDelayMs = 3000;
  players: Map<string, PlayerInfo> = new Map;
  ready: boolean = false;
  totalCardsInRound: number = 0;
  cardsPlayer: Card[] = [];
  pile: Turn[] = [];
  upcard: Card | null = null;
  possible_bids: number[] = [];
  gameState = GameState.NotPlaying;
  collapsed: boolean = true;
  volume: number = 40;
  audios: AudioInfo[] = [];
  selectedAudio: AudioInfo | null = null;
  selectedAudioBid: AudioInfo | null = null;
  audioPlayer: HTMLAudioElement | null = null;
  audiosBid: AudioInfo[] = [];
  gameEndSummary: GameEndSummary | null = null;
  eventDelayMs = this.loadEventDelayMs();
  lifeLossHighlight: LifeLossHighlight | null = null;
  connectionState: GameConnectionState = 'disconnected';
  private lifeLossHighlightTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly lifeLossHighlightThreshold = 3;
  private readonly subscriptions = new Subscription();

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
    this.subscriptions.add(
      this.gameService.emitter.pipe(
        concatMap(event => {
          switch (event.type) {
            case 'RoundEnded':
            case 'SetEnded':
            case 'GameEnded':
              return of(event).pipe(delay(this.eventDelayMs))
            default:
              return of(event)
          }
        })
      ).subscribe(x => {
        this.handleServerGameMessage(x);
      })
    );

    this.subscriptions.add(
      this.gameService.connectionState$.subscribe(state => {
        this.connectionState = state;
      })
    );
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.gameService.disconnect();
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
    this.lobbyService.joinLobby(roomId).subscribe({
      next: lobby => {
        this.applyLobbyInfo(lobby);
        void this.gameService.auth();
      },
      error: error => {
        console.error('Could not join lobby: ', error);
        this.router.navigate(['viewgames']);
      }
    });
  }

  private applyLobbyInfo(lobby: LobbyInfo) {
    switch (lobby.type) {
      case 'NotStarted':
        this.applyWaitingSnapshot(lobby.data);
        return;
      case 'Playing':
        this.applyGameInfo(lobby.data);
        return;
    }
  }

  private applySnapshot(snapshot: MatchSnapshot) {
    switch (snapshot.type) {
      case 'Waiting':
        this.applyWaitingSnapshot(snapshot.data);
        return;
      case 'Playing':
        this.applyPlayers(snapshot.data.players);
        this.applyGameInfo(snapshot.data.game);
        return;
    }
  }

  private applyWaitingSnapshot(players: PlayerStatusMap) {
    this.gameEndSummary = null;
    this.hideLifeLossHighlight();
    this.applyPlayers(players);
    this.gameState = GameState.NotPlaying;
    this.cardsPlayer = [];
    this.pile = [];
    this.upcard = null;
    this.possible_bids = [];
  }

  private applyPlayers(players: PlayerStatusMap) {
    this.players = new Map(Object.entries(players).map(([id, status]) => [id, getPlayerInfo(status.player, status.ready)]));
    this.ready = this.players.get(this.authService.getID() || '')?.ready || false;
  }

  private applyGameInfo(gameInfo: GameInfoDto) {
    switch (gameInfo.stage.type) {
      case "Dealing":
        this.gameState = GameState.Playing;
        this.possible_bids = [];
        break;
      case "Bidding": {
        this.gameState = GameState.Bidding;
        const yourTurn = gameInfo.current_player == this.authService.getID();
        this.possible_bids = yourTurn ? gameInfo.stage.data.possible_bids : [];
        break;
      }
    }

    this.gameEndSummary = null;

    this.cardsPlayer = gameInfo.deck || [];
    this.upcard = gameInfo.upcard;

    for (const player of this.players.values()) {
      player.turnToPlay = false;
    }

    for (const info of gameInfo.info) {
      const player = this.ensurePlayer(info.id);

      player.turnToPlay = info.id == gameInfo.current_player;
      player.lifes = info.lifes;
      player.ready = true;
      player.setInfo = info.bid == null && info.rounds == null
        ? null
        : { points: info.rounds || 0, bid: info.bid || 0 };
    }

    this.totalCardsInRound = this.cardsPlayer.length;
    setTimeout(() => this.adjustCardSize());
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

  canPlayCards() {
    const playerId = this.authService.getID();

    return this.isConnected() && this.playing() && !!playerId && !!this.players.get(playerId)?.turnToPlay;
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
      case 'PlayerLeft':
        return this.handlePlayerLeft(message.data);
      case 'Snapshot':
        return this.applySnapshot(message.data)
      case 'Error':
        return this.handleError(message.data)
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

  handlePlayerLeft(data: { player_id: string }) {
    this.players.delete(data.player_id);
  }

  handlePlayerStatusChange(data: { player_id: string; ready: boolean }) {
    const player = this.ensurePlayer(data.player_id)

    player.ready = data.ready;

    if (data.player_id == this.authService.getID()) {
      this.ready = data.ready;
    }
  }

  handleGameEnded(data: { lifes: PlayerPoints }) {
    this.updateLifes(data.lifes);
    this.hideLifeLossHighlight();
    this.gameEndSummary = this.createGameEndSummary(data.lifes);
    this.gameState = GameState.NotPlaying;
    this.ready = false;
    this.possible_bids = [];

    for (const player of this.players.values()) {
      player.turnToPlay = false;
    }
  }

  private createGameEndSummary(lifes: PlayerPoints): GameEndSummary {
    const maxLife = Math.max(...Object.values(lifes));
    const winnerIds = maxLife > 0
      ? Object.entries(lifes).filter(([, life]) => life === maxLife).map(([id]) => id)
      : [];
    const winners = winnerIds.map(id => this.ensurePlayer(id));
    const names = winners.map(player => this.getPlayerNickname(player));

    return {
      winners,
      winnerNames: names.join(', '),
      noWinners: winners.length === 0,
    };
  }

  private updateLifes(data: PlayerPoints) {
    for (const [id, lifes] of Object.entries(data)) {
      const player = this.ensurePlayer(id);

      player.lifes = lifes;
    }
  }

  handleSetEnded(data: { lifes: PlayerPoints }) {
    this.showLifeLossHighlight(data.lifes);
    this.updateLifes(data.lifes)

    this.pile = []
  }

  private showLifeLossHighlight(lifes: PlayerPoints) {
    for (const [id, currentLifes] of Object.entries(lifes)) {
      const player = this.ensurePlayer(id);
      const previousLifes = player.lifes ?? currentLifes;
      const lost = previousLifes - currentLifes;

      if (lost < this.lifeLossHighlightThreshold) {
        continue;
      }

      this.lifeLossHighlight = { player, lost };

      if (this.lifeLossHighlightTimeout) {
        clearTimeout(this.lifeLossHighlightTimeout);
      }

      this.lifeLossHighlightTimeout = setTimeout(() => this.hideLifeLossHighlight(), 3600);
      return;
    }
  }

  private hideLifeLossHighlight() {
    this.lifeLossHighlight = null;

    if (this.lifeLossHighlightTimeout) {
      clearTimeout(this.lifeLossHighlightTimeout);
      this.lifeLossHighlightTimeout = null;
    }
  }

  handleSetStart(data: { upcard: Card }) {
    this.gameState = GameState.Bidding;
    this.possible_bids = [];
    this.upcard = data.upcard;
    this.pile = [];

    for (const player of this.players.values()) {
      player.setInfo = null
      player.turnToPlay = false
    }
  }

  handlePlayerDeck(data: Card[]) {
    this.totalCardsInRound = data.length;

    this.cardsPlayer = data;
    setTimeout(() => this.adjustCardSize());
  }

  getCardImage(card: Card) {
    return `../assets/cards/${getCardImage(card)}.jpg`
  }

  getCardLabel(card: Card) {
    return `${card.rank} of ${card.suit}`;
  }

  getTurnPlayerNickname(turn: Turn) {
    const player = this.players.get(turn.player_id);

    return player ? this.getPlayerNickname(player) : turn.player_id;
  }

  handleRoundEnded(data: PlayerPoints) {
    for (const [id, points] of Object.entries(data)) {
      const player = this.ensurePlayer(id)

      player.setInfo = { bid: player.setInfo?.bid || 0, points };
    }

    this.pile = []
  }

  handlePlayerBidded(data: { player_id: string; bid: number; }) {
    //mostrar valor na tela para os outros tchos
    const player = this.ensurePlayer(data.player_id)

    if (player?.setInfo) {
      player.setInfo.bid = data.bid
    }
    else {
      player!.setInfo = { bid: data.bid, points: 0 }
    }

    player.turnToPlay = false;
  }

  handlePlayerBiddingTurn(data: { player_id: string; possible_bids: number[] }) {
    const yourTurn = data.player_id == this.authService.getID();
    this.possible_bids = yourTurn ? data.possible_bids : []
    this.gameState = GameState.Bidding

    for (const [id, player] of this.players) {
      player.turnToPlay = data.player_id == id
    }

    if (yourTurn) {
      this.playAudio(false);
      this.gameState = GameState.Bidding;
    }
  }

  sendBid(bid: number) {
    if (!this.isConnected()) {
      return;
    }

    this.possible_bids = [];
    const playerId = this.authService.getID();

    if (playerId) {
      const player = this.players.get(playerId);

      if (player) {
        player.turnToPlay = false;
      }
    }

    this.gameService.sendMessage({ type: "PutBid", data: { bid } })
  }

  bidTurn() {
    return this.isConnected() && this.bidding() && this.possible_bids.length > 0
  }

  handleTurnPlayed(data: { pile: Turn[] }) {
    //fazer animacao da carta
    this.pile = data.pile
  }

  handlePlayerTurn(data: { player_id: string; }) {
    this.gameState = GameState.Playing;
    this.possible_bids = [];

    const yourTurn = data.player_id == this.authService.getID();

    if (yourTurn) {
      this.playAudio(true);
    }

    for (const [id, player] of this.players) {
      player.turnToPlay = data.player_id == id
    }
  }

  getHearts(lifes: number | null) {
    return Array(lifes ?? 0).fill(null)
  }

  shouldShowLifes(player: PlayerInfo) {
    return !this.notReady() && player.lifes !== null;
  }

  getPoints(player: PlayerInfo) {
    if (player.setInfo) {
      return Array(player.setInfo.points).fill(null)
    }
    return []
  }

  getMapEntries() {
    return Array.from(this.players.values())
      .filter(p => p.lifes === null || p.lifes > 0)
      .sort((a, b) => getPlayerId(a.data).localeCompare(getPlayerId(b.data)));
  }

  markAsReady() {
    if (!this.isConnected()) {
      return;
    }

    this.ready = !this.ready;
    this.gameService.sendMessage({ type: "PlayerStatusChange", data: { ready: this.ready } })
  }

  goToMenu() {
    this.gameService.disconnect();
    this.router.navigate(['/']);
  }

  playersToStart() {
    return this.isConnected() && this.players.size > 1
  }

  ngAfterViewInit() {
    this.adjustCardSize();
  }

  adjustCardSize() {
    if (!this.cardsContainer) {
      return;
    }

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

    if (!this.isConnected() || !me?.turnToPlay || !this.playing()) {
      return;
    }

    me.turnToPlay = false;
    this.moveToCenter(event);
    this.cardsPlayer.splice(this.cardsPlayer.indexOf(card), 1)
    this.gameService.sendMessage({ type: "PlayTurn", data: { card } });
  }

  getPlayerPicture(player: PlayerInfo) {
    return getPlayerPicture(player.data);
  }

  getPlayerNickname(player: PlayerInfo) {
    return getPlayerNickname(player.data);
  }

  private ensurePlayer(id: string) {
    const existing = this.players.get(id);

    if (existing) {
      return existing;
    }

    const playerClaims = this.authService.getClaims();
    const player: Player = playerClaims && getPlayerId(playerClaims) == id
      ? playerClaims
      : { type: 'Anonymous', data: { id, data: { nickname: id, picture: '' } } };
    const info = getPlayerInfo(player, true, null);

    this.players.set(id, info);

    return info;
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

  onEventDelayChange(value: number | undefined) {
    this.eventDelayMs = this.clampEventDelay(value ?? this.maxEventDelayMs);
    localStorage.setItem(this.eventDelayStorageKey, this.eventDelayMs.toString());
  }

  private loadEventDelayMs() {
    const storedValue = localStorage.getItem(this.eventDelayStorageKey);

    if (storedValue == null) {
      return this.maxEventDelayMs;
    }

    const stored = Number(storedValue);

    if (Number.isNaN(stored)) {
      return this.maxEventDelayMs;
    }

    return this.clampEventDelay(stored);
  }

  private clampEventDelay(value: number) {
    return Math.max(0, Math.min(this.maxEventDelayMs, Math.round(value)));
  }

  isConnected() {
    return this.connectionState == 'connected';
  }

  connectionBannerText() {
    switch (this.connectionState) {
      case 'connecting':
        return 'Connecting to match...';
      case 'reconnecting':
        return 'Reconnecting to match...';
      default:
        return null;
    }
  }

}
