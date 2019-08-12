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

    // console.log(`buffer.length=${buf.length}`);

    let offset = 0;
    if (!this.message) {
      // console.log(`reading type, buffer.length=${buf.length}`)
      this.message = {
        type: buf.readUInt32LE(offset) as MessageType,
        data: null,
      };
      offset += 4;
      // console.log(`type=${this.message.type}`);
    }

    if (offset >= buf.length) {
      // console.log('skip A');
      return;
    }

    if (!this.message.data) {
      // console.log('reading size');
      this.size = buf.readUInt32LE(offset);
      this.message.data = Buffer.alloc(this.size + 4 + 4); // 2 extra bytes for TYPE and SIZE
      this.message.data.writeUInt32LE(this.message.type, this.position);
      this.position += 4;
      this.message.data.writeUInt32LE(this.size, this.position);
      this.position += 4;
      offset += 4;
      // console.log(`size=${this.size}`);
    }

    if (offset >= buf.length) {
      // console.log('skip B');
      return;
    }

    const remaining = this.size - this.wrote;
    const end = Math.min(offset + remaining, buf.length);
    assert(end <= buf.length, `Write must not exceed buffer: buffer.length=${buf.length}, end=${end}, offset=${offset}, size=${this.size}, remaining=${remaining}`);
    const extra = buf.length - end;
    assert(extra >= 0, 'Extra bytes must not be <0');
    const wrote = buf.copy(this.message.data, this.position, offset, end);

    // console.log(`position=${this.position}, wrote=${this.wrote}, end=${end}, offset=${offset}, size=${this.size}, remaining=${remaining}`);

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
      console.log(`extra=${extra}, buffer.length=${buf.length}`);
      // throw new Error();
      this.onData(buf.slice(-extra));
    }
  }
}
