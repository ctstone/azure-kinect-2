import { Struct } from "../structs/struct";
import { FloatLE } from "../structs/float";
import { StructFloatLEArray } from "../structs/float-array";
import { UInt32LE } from "../structs/uint32";
import { StructArray } from "../structs/array";
import { UnionStruct } from '../structs/union-struct';
import { Joint } from './joints';

export interface Body {
  id: number;
  skeleton: Skeleton;
}

export interface Skeleton {
  joints: SkeletonJoint[];
}

export interface SkeletonJoint {
  orientation: Orientation;
  position: Position;
}

export interface Orientation {
  wxyz: WXYZ;
  v: Float32Array[];
}

export interface Position {
  xyz: XYZ;
  v: Float32Array;
}

export interface WXYZ {
  w: number;
  x: number;
  y: number;
  z: number;
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

const float3 = new UnionStruct<Position>()
  .define('xyz', new Struct<XYZ>()
    .define('x', new FloatLE())
    .define('y', new FloatLE())
    .define('z', new FloatLE()))
  .define('v', new StructFloatLEArray(3));

const quaternion = new UnionStruct<Orientation>()
  .define('wxyz', new Struct<WXYZ>()
    .define('w', new FloatLE())
    .define('x', new FloatLE())
    .define('y', new FloatLE())
    .define('z', new FloatLE()))
  .define('v', new StructFloatLEArray(4));

export const body = new Struct<Body>()
  .define('id', new UInt32LE())
  .define('skeleton', new Struct<Skeleton>()
    .define('joints', new StructArray(Joint.K4ABT_JOINT_COUNT, new Struct<SkeletonJoint>()
      .define('position', float3)
      .define('orientation', quaternion))));