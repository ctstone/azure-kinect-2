import express from 'express';
import WebSocket from 'ws';
import { MessageHandler } from './message-buffer';
import { ErrorHandler, getMessages } from './message-client';

const PORT = 8080;
const PIPE_PATH = '\\\\.\\pipe\\Pipe';

const server = express()
  .get('/', (req, res, next) => {
    res.json({ hello: 'world' });
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}`));

new WebSocket.Server({ server })
  .on('connection', (socket) => {

    const onMessage: MessageHandler = (message) => {
      socket.send(message.data);
    };

    const onError: ErrorHandler = (error) => {
      console.error(error.message);
      socket.close();
    };

    const end = getMessages(PIPE_PATH, onMessage, onError);

    socket.on('close', () => {
      console.log('Client left');
      end();
    });

    socket.on('message', (message) => {
      console.log('client said', message);
    });
  });
