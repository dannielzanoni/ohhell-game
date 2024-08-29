import { Turn } from '../models/turn';

// Client Game Message
export type ClientGameMessage =
    | { type: "PlayTurn"; data: { game_id: string; turn: Turn } }
    | { type: "PutBid"; data: { game_id: string; player_id: string; bid: number } };


// Function to serialize to the expected format
export function serializeMessage(message: ClientGameMessage): string {
    return JSON.stringify({
        type: message.type,
        data: message.data,
    });
}
