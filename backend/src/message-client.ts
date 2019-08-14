import net from 'net';
import { MessageBuffer, MessageHandler } from "./message-buffer";

export type ErrorHandler = (err: Error) => void;

export function messageClient(path: string, handler: MessageHandler, errors: ErrorHandler) {
  const messages = new MessageBuffer(handler);

  const client = net.connect(path, () => {
    console.log('Client connected');
  });

  // setInterval(() => {
  //   console.log('Socket buffer size:', client.bufferSize);
  // }, 5000);

  client.on('data', (d) => {
    messages.onData(d);
  });

  client.on('end', () => {
    console.log('Client ended');
  });

  client.on('error', (err) => {
    errors(err);
  });

  return { end: () => client.destroy() };
}
