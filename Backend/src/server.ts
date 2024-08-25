import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

class App {
    private app: Application;
    private http: http.Server;
    private io: Server;
    private players: { [roomId: string]: { [key: string]: { userName: string, profilePicture: string, position: number, ready: boolean } } } = {};
    private maxPlayers = 10;

    constructor() {
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = new Server(this.http);
        this.listenSocket();
        this.setupRoutes();
        this.setupStaticFiles();
    }

    listenServer() {
        const PORT = process.env.PORT || 3000;
        this.http.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    }

    listenSocket() {
        this.io.on('connection', (socket: Socket) => {
            socket.on('playerJoin', (data: { roomId: string, userName: string, profilePicture: string }) => {
                const { roomId, userName, profilePicture } = data;

                socket.join(roomId);

                if (!this.players[roomId]) {
                    this.players[roomId] = {};
                }

                if (Object.keys(this.players[roomId]).length >= this.maxPlayers) {
                    socket.emit('roomFull');
                    socket.disconnect();
                    return;
                }

                let position = 1;
                while (position <= this.maxPlayers && Object.values(this.players[roomId]).some(player => player.position === position)) {
                    position++;
                }

                this.players[roomId][socket.id] = { userName, profilePicture, position, ready: false };
                socket.data.userName = userName;
                socket.data.roomId = roomId;
                socket.data.profilePicture = profilePicture;

                console.log('user connected =>', socket.id, 'at position', position, 'in room', roomId);
                this.io.to(roomId).emit('message', { id: userName, message: `${userName} joined the lobby`, special: "red" });
                this.io.to(roomId).emit('playerJoined', { position, userName, profilePicture });

                socket.emit('allPlayers', Object.entries(this.players[roomId]).map(([playerId, player]) => ({ playerId, ...player })));

                const totalPlayersCount = Object.keys(this.players[roomId]).length;
                const readyPlayersCount = Object.values(this.players[roomId]).filter(p => p.ready).length;
                this.io.to(roomId).emit('totalPlayersCount', totalPlayersCount);
                this.io.to(roomId).emit('readyPlayersCount', readyPlayersCount);

                socket.on('message', (msg) => {
                    const messageWithId = { id: userName, message: msg.message };
                    this.io.to(roomId).emit('message', messageWithId);
                });

                socket.on('playerReady', () => {
                    const player = this.players[roomId][socket.id];
                    if (player) {
                        player.ready = true;
                        const readyPlayersCount = Object.values(this.players[roomId]).filter(p => p.ready).length;
                        this.io.to(roomId).emit('playerReady', { userName, readyPlayersCount });
                        this.io.to(roomId).emit('readyPlayersCount', readyPlayersCount); // Update all clients
                    }
                });

                socket.on('playerLeave', () => {
                    const playerId = socket.id;
                    const userName = socket.data.userName;
                    this.io.to(roomId).emit('message', { id: userName, message: `${userName} leave the lobby`, special: "red" });
                    delete this.players[roomId][playerId];
                    this.io.to(roomId).emit('playerLeft', { playerId });
                    const totalPlayersCount = Object.keys(this.players[roomId]).length;
                    const readyPlayersCount = Object.values(this.players[roomId]).filter(player => player.ready).length;
                    this.io.to(roomId).emit('totalPlayersCount', totalPlayersCount);
                    this.io.to(roomId).emit('readyPlayersCount', readyPlayersCount);
                });

                socket.on('disconnect', () => {
                    const playerId = socket.id;
                    const position = this.players[roomId]?.[playerId]?.position;
                    const userName = socket.data.userName;
                    delete this.players[roomId][playerId];
                    console.log('user disconnected =>', playerId, 'from room', roomId);
                    this.io.to(roomId).emit('message', { id: userName, message: `${userName} leave the lobby`, special: "red" });
                    this.io.to(roomId).emit('playerLeft', { playerId, position });
                    const totalPlayersCount = Object.keys(this.players[roomId]).length;
                    const readyPlayersCount = Object.values(this.players[roomId]).filter(player => player.ready).length;
                    this.io.to(roomId).emit('totalPlayersCount', totalPlayersCount);
                    this.io.to(roomId).emit('readyPlayersCount', readyPlayersCount);
                });

                socket.emit('totalPlayersCount', totalPlayersCount);
                socket.emit('readyPlayersCount', readyPlayersCount);
            });
        });
    }

    setupRoutes() {
        this.app.get('/', (req: Request, res: Response) => {
            res.sendFile(__dirname + '/index.html');
        });
    }

    setupStaticFiles() {
        this.app.use('/assets', express.static('src/assets'));
        this.app.use(express.static(__dirname));
    }
}

const app = new App();
app.listenServer();
