import * as THREE from 'three';

export class PointCloud2 extends THREE.Object3D {
  private readonly geometry = new THREE.BufferGeometry;
  private readonly material: THREE.PointsMaterial;
  private get positionAttribute() { return this.geometry.attributes.position as THREE.BufferAttribute; }
  private get array() { return this.positionAttribute.array as Float32Array; }

  constructor(maxPoints: number, parameters?: THREE.PointsMaterialParameters) {
    super();
    this.material = new THREE.PointsMaterial(parameters);

    const array = new Float32Array(maxPoints * 3);
    this.geometry.addAttribute('position', new THREE.BufferAttribute(array, 3));
    this.add(new THREE.Points(this.geometry, this.material));
  }

  set(i: number, value: number) {
    this.array[i] = value;
    this.positionAttribute.needsUpdate = true;
  }
}

// export class PointCloud {

//   get length() { return this.geometry.vertices.length; }

//   private readonly geometry = new THREE.Geometry();
//   private readonly material = new THREE.PointsMaterial({
//     color: 'red',
//     size: 10,
//     sizeAttenuation: false,
//   });
//   readonly points = new THREE.Points(this.geometry, this.material);

//   reset() {
//     this.geometry.vertices.length = 0;
//     this.geometry.verticesNeedUpdate = true;
//   }

//   push(vector: THREE.Vector3) {
//     this.geometry.vertices.push(vector);
//     this.geometry.verticesNeedUpdate = true;
//   }

//   flip() {
//     this.geometry.rotateZ(Math.PI);
//     this.geometry.verticesNeedUpdate = true;
//   }
// }
