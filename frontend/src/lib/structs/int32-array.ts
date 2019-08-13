import { Parser, ParseContext } from "./struct";
import { FloatLE } from './float';
import { UInt32LE } from './uint32';

export class StructInt32LEArray implements Parser<Int32Array> {

  private readonly parser = new FloatLE();

  constructor(private length: number) {
  }

  parse(dv: DataView, ctx: ParseContext) {
    const array = new Int32Array(this.length);
    for (let n = 0; n < this.length; n += 1) {
      array[n] = this.parser.parse(dv, ctx);
    }
    return array;
  }
}
