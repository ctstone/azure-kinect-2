import * as THREE from 'three';

export class PointCloud {

  get length() { return this.geometry.vertices.length; }

  private readonly geometry = new THREE.Geometry();
  private readonly material = new THREE.PointsMaterial({
    color: 'gray',
    size: 1,
    sizeAttenuation: false,
  });
  readonly points = new THREE.Points(this.geometry, this.material);

  reset() {
    this.geometry.vertices.length = 0;
    this.geometry.verticesNeedUpdate = true;
  }

  push(vector: THREE.Vector3) {
    this.geometry.vertices.push(vector);
    this.geometry.verticesNeedUpdate = true;
  }

  flip() {
    this.geometry.rotateZ(Math.PI);
    this.geometry.verticesNeedUpdate = true;
  }
}
