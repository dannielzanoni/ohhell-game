import { Card, Turn } from '../models/turn';

// Client Game Message
export type ClientGameMessage =
  | { type: 'PlayTurn'; data: { card: Card } }
  | { type: 'PutBid'; data: { bid: number } }
  | { type: 'PlayerStatusChange'; data: { ready: boolean } };

// Function to serialize to the expected format
export function serializeMessage(message: ClientGameMessage): string {
  return JSON.stringify({
    type: message.type,
    data: message.data,
  });
}

export type ClientMessage =
  | { type: 'Game'; data: ClientGameMessage }
  | { type: 'Auth'; data: { token: string } };
