import net from 'net';
import { MessageBuffer, MessageHandler } from "./message-buffer";

export function getMessages(path: string, handler: MessageHandler) {
  const messages = new MessageBuffer(handler);

  const client = net.connect(path, () => {
    console.log('Client connected');
  });

  client.on('data', (d) => {
    messages.onData(d);
  });

  client.on('end', () => {
    console.log('Client ended');
  });

}
