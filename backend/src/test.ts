import { messageClient } from './message-client';

const PIPE_PATH = '\\\\.\\pipe\\Pipe';

messageClient(PIPE_PATH, (message) => {
  console.log(message.type, message.data.length);
}, console.error);
