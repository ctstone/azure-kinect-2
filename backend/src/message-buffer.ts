export type MessageType = 1 | 2;

export interface Message {
  type: MessageType;
  data: Buffer;
}

export type MessageHandler = (message: Message) => void;

export class MessageBuffer {

  private wrote = 0;
  private message: Message;

  constructor(private handler: MessageHandler) { }

  onData(buf: Buffer) {
    console.log('DATA', buf.length);
    let offset = 0;
    if (!this.message) {
      this.message = {
        type: buf.readUInt32LE(offset) as MessageType,
        data: null,
      };
      offset += 4;
    }

    if (offset >= buf.length) {
      return;
    }

    if (!this.message.data) {
      const size = buf.readUInt32LE(offset);
      this.message.data = Buffer.alloc(size);
      offset += 4;
    }

    if (offset >= buf.length) {
      return;
    }

    const remaining = this.message.data.length - this.wrote;
    const end = offset + Math.min(remaining, buf.length);
    const extra = buf.length - end;
    this.wrote += buf.copy(this.message.data, this.wrote, offset, end);

    if (this.wrote === this.message.data.length) {
      this.handler(this.message);
      this.message = null;
      this.wrote = 0;
    }

    if (extra) {
      this.onData(buf.slice(extra));
    }
  }
}
