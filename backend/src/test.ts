import { messageClient } from './message-client';

const PIPE_PATH = '\\\\.\\pipe\\mynamedpipe';

messageClient(PIPE_PATH, (message) => {
  console.log(message.type, message.data.length);
}, console.error);
