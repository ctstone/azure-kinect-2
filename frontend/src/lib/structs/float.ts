import { Parser, ParseContext } from './struct';

export class FloatLE implements Parser<number> {
  parse(dv: DataView, ctx: ParseContext) {
    const val = dv.getFloat32(ctx.offset, true);
    ctx.offset += 4;
    return val;
  }
}