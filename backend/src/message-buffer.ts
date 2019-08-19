import assert from 'assert';

export type MessageType = 1 | 2;

export interface Message {
  type: MessageType;
  data: Buffer;
}

export type MessageHandler = (message: Message) => void;

export class MessageBuffer {

  private position = 0;
  private wrote = 0;
  private message: Message;
  private size = 0;

  constructor(private handler: MessageHandler) { }

  onData(buf: Buffer) {

    console.log('onData', buf.length);

    let offset = 0;
    if (!this.message) {
      this.message = {
        type: buf.readUInt32LE(offset) as MessageType,
        data: null,
      };
      offset += 4;

      console.log('TYPE', this.message.type);
    }

    if (offset >= buf.length) {
      console.log('SKIP A');
      return;
    }

    if (!this.message.data) {
      this.size = buf.readUInt32LE(offset);
      console.log('SIZE', this.size);
      this.message.data = Buffer.alloc(this.size + 4 + 4); // 2 extra bytes for TYPE and SIZE
      this.message.data.writeUInt32LE(this.message.type, this.position);
      this.position += 4;
      this.message.data.writeUInt32LE(this.size, this.position);
      this.position += 4;
      offset += 4;
    }

    if (offset >= buf.length) {
      console.log('SKIP B');
      return;
    }

    const remaining = this.size - this.wrote;
    const end = Math.min(offset + remaining, buf.length);
    console.log('END', end);
    assert(end <= buf.length, `Write must not exceed buffer: buffer.length=${buf.length}, end=${end}, offset=${offset}, size=${this.size}, remaining=${remaining}`);
    const extra = buf.length - end;
    assert(extra >= 0, 'Extra bytes must not be <0');
    const wrote = buf.copy(this.message.data, this.position, offset, end);
    this.position += wrote;
    this.wrote += wrote;

    if (this.wrote === this.size) {
      this.handler(this.message);
      this.message = null;
      this.wrote = 0;
      this.position = 0;
      this.size = null;
    }

    if (extra) {
      this.onData(buf.slice(-extra));
    }
  }
}
