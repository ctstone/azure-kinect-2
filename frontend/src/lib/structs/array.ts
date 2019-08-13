import { Parser, ParseContext } from "./struct";

export class StructArray<T = any> implements Parser<T[]> {

  constructor(private length: number, private parser: Parser<T>) {
  }

  parse(dv: DataView, ctx: ParseContext) {
    const array = new Array(this.length) as T[];
    for (let n = 0; n < this.length; n += 1) {
      array[n] = this.parser.parse(dv, ctx);
    }
    return array;
  }
}