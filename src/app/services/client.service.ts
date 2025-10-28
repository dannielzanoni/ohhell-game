import { Card } from '../models/turn';

// Client Game Message
export type ClientMessage =
  | { type: 'PlayTurn'; data: { card: Card } }
  | { type: 'PutBid'; data: { bid: number } }
  | { type: 'PlayerStatusChange'; data: { ready: boolean } }
  | { type: 'Reconnect'; data: null };

// Function to serialize to the expected format
export function serializeMessage(message: ClientMessage): string {
  return JSON.stringify({
    type: message.type,
    data: message.data,
  });
}
