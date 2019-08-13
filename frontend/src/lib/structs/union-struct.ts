import { Parser, Handler, ParseContext } from './struct';

export class UnionStruct<T = any> implements Parser<T> {

  private readonly handlers: Handler<any>[] = [];

  define<P>(name: string, parser: Parser<P>) {
    this.handlers.push({ name, parser });
    return this;
  }

  parse(dv: DataView, ctx?: ParseContext) {
    ctx = ctx || { offset: 0 };
    const obj = {};
    const offset = ctx.offset;
    for (const { name, parser } of this.handlers) {
      ctx.offset = offset;
      obj[name] = parser.parse(dv, ctx);
    }
    return obj as T;
  }
}
