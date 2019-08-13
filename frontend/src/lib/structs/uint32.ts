import { Parser, ParseContext } from './struct';

export class UInt32LE implements Parser<number> {

  parse(dv: DataView, ctx: ParseContext) {
    const val = dv.getUint32(ctx.offset, true);
    ctx.offset += 4;
    return val;
  }
}