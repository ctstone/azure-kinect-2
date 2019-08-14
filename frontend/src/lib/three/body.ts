import * as THREE from 'three';
import { SkeletonJoint } from '../k4a-bt/body-struct';
import { Joint, SEGMENTS } from '../k4a-bt/joints';

export interface DotSettings {
  radius?: number;
  color?: string;
}

export interface LineSettings {
  width?: number,
  color?: string;
}

export class BodySkeleton extends THREE.Group {

  readonly dot: DotSettings = {};
  readonly line: LineSettings = {};

  private readonly dots = new THREE.Group();
  private readonly lines = new THREE.Group();

  constructor(color?: string) {
    super();
    this.dots.name = 'dots';
    this.lines.name = 'lines';
    this.dot.radius = 15;
    this.dot.color = 'gray';
    this.line.width = 2;
    this.line.color = color || 'orange';

    // init dots (joints)
    for (let i = 0; i < Joint.K4ABT_JOINT_COUNT; i++) {
      const geometry = new THREE.SphereGeometry(this.dot.radius);
      const material = new THREE.MeshBasicMaterial({ color: this.dot.color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.visible = false;
      this.dots.add(sphere);
    }

    // init lines (bones)
    for (const s of SEGMENTS) {
      const geometry = new THREE.Geometry();
      const material = new THREE.LineBasicMaterial({
        color: this.line.color,
        linewidth: this.line.width,
      });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      this.lines.add(line);
    }

    this.add(this.dots, this.lines);
  }

  update(joints: SkeletonJoint[]) {
    const dots = this.getObjectByName('dots').children as THREE.Mesh[];
    const lines = this.getObjectByName('lines').children as THREE.Line[];
    for (let i = 0; i < dots.length; i += 1) {
      const [x, y, z] = joints[i].position.v;
      const sphere = dots[i];
      const geometry = sphere.geometry as THREE.SphereGeometry;
      sphere.position.set(x, y, z);
      sphere.visible = true;
      geometry.verticesNeedUpdate = true;
    }

    for (let i = 0; i < lines.length; i += 1) {
      const [a, b] = SEGMENTS[i];
      const [xA, yA, zA] = joints[a].position.v;
      const [xB, yB, zB] = joints[b].position.v;
      const line = lines[i];
      const geometry = line.geometry as THREE.Geometry;
      geometry.vertices = [
        new THREE.Vector3(xA, yA, zA),
        new THREE.Vector3(xB, yB, zB),
      ];
      geometry.verticesNeedUpdate = true;
      line.visible = true;
    }
  }
}