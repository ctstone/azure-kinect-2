import { getMessages } from './message-client';

const PIPE_PATH = '\\\\.\\pipe\\Pipe';

getMessages(PIPE_PATH, (message) => {
  console.log(message.type, message.data.length);
}, console.error);
