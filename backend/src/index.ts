import express from 'express';
import WebSocket from 'ws';
import { getMessages } from './message-client';

const PORT = 8080;
const PIPE_PATH = '\\\\.\\pipe\\Pipe';

const server = express()
  .get('/', (req, res, next) => {
    res.json({ hello: 'world' });
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}`));

new WebSocket.Server({ server })
  .on('connection', (socket) => {

    getMessages(PIPE_PATH, (message) => {
      console.log(message.data.length);
      if (message.type === 1) {
        socket.send(message.data);
      } else {
        console.log(message.type, message.data.length);
      }
    });

    socket.on('message', (message) => {
      console.log('client said', message);
    });
  });
