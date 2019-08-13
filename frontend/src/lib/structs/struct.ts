export interface ParseContext {
  offset: number;
}

export interface Parser<T> {
  parse(dv: DataView, ctx: ParseContext): T;
}

export interface Handler<T> {
  name: string;
  parser: Parser<T>;
}

export class Struct<T = any> implements Parser<T> {

  private readonly handlers: Handler<any>[] = [];

  define<P>(name: string, parser: Parser<P>) {
    this.handlers.push({ name, parser });
    return this;
  }

  parse(dv: DataView, ctx?: ParseContext) {
    ctx = ctx || { offset: 0 };
    const obj = {};
    for (const { name, parser } of this.handlers) {
      obj[name] = parser.parse(dv, ctx);
    }
    return obj as T;
  }
}
