import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

class App {
    private app: Application;
    private http: http.Server;
    private io: Server;
    private players: { [roomId: string]: { [key: string]: { userName: string, position: number } } } = {};
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
            socket.on('playerJoin', (data: { roomId: string, userName: string }) => {
                const { roomId, userName } = data;

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

                this.players[roomId][socket.id] = { userName, position };
                socket.data.userName = userName; // Store userName in socket data
                socket.data.roomId = roomId; // Store roomId in socket data

                console.log('user connected =>', socket.id, 'at position', position, 'in room', roomId);

                socket.emit('allPlayers', Object.entries(this.players[roomId]).map(([playerId, player]) => ({ playerId, ...player })));
                this.io.to(roomId).emit('playerJoined', { playerId: socket.id, position, userName });

                socket.on('message', (msg) => {
                    const messageWithId = { id: userName, message: msg.message };
                    this.io.to(roomId).emit('message', messageWithId);
                });

                socket.on('playerLeave', () => {
                    const playerId = socket.id;
                    const userName = socket.data.userName; // Get userName from socket data
                    this.io.to(roomId).emit('message', { id: userName, message: `${userName} leave the lobby`, special: "red" });
                    delete this.players[roomId][playerId];
                    this.io.to(roomId).emit('playerLeft', { playerId });
                });

                socket.on('disconnect', () => {
                    const playerId = socket.id;
                    const position = this.players[roomId]?.[playerId]?.position;
                    const userName = socket.data.userName; // Get userName from socket data
                    delete this.players[roomId][playerId];
                    console.log('user disconnected =>', playerId, 'from room', roomId);
                    this.io.to(roomId).emit('message', { id: userName, message: `${userName} leave the lobby`, special: "red" });
                    this.io.to(roomId).emit('playerLeft', { playerId, position });
                });
            });
        });
    }

    setupRoutes() {
        this.app.get('/', (req: Request, res: Response) => {
            res.sendFile(__dirname + '/index.html');
        });
    }

    setupStaticFiles() {
        this.app.use(express.static(__dirname));
    }
}

const app = new App();
app.listenServer();
