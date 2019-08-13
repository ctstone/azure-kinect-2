import express from 'express';
import WebSocket from 'ws';
import { MessageHandler } from './message-buffer';
import { ErrorHandler, messageClient } from './message-client';

const PORT = 8080;
const PIPE_PATH = '\\\\.\\pipe\\Pipe';

const server = express()
  .get('/', (req, res, next) => {
    res.json({ hello: 'world' });
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}`));

new WebSocket.Server({ server })
  .on('connection', (socket) => {
    console.log('Client connected');

    const onMessage: MessageHandler = (message) => {
      socket.send(message.data);
    };

    const onError: ErrorHandler = (error) => {
      console.error('Socket Error: ' + error.message);
      socket.close();
    };

    const pipe = messageClient(PIPE_PATH, onMessage, onError);

    socket.on('close', () => {
      console.log('Client left');
      pipe.end();
    });

    socket.on('message', (message) => {
      console.log('Client said', message);
    });
  });
