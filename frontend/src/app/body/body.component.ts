import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { body } from 'src/lib/k4a-bt/body-struct';
import * as THREE from 'three';
import { Joint } from 'src/lib/k4a-bt/joints';

const PAN_BY = 100;
const ROTATE_BY = .05;

@Component({
  selector: 'k4a-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit, AfterViewInit {

  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  constructor(private el: ElementRef<HTMLElement>) { }

  async ngOnInit() {

  }

  async ngAfterViewInit() {
    const resp = await fetch('/assets/body.bin');
    const ab = await resp.arrayBuffer();
    const dv = new DataView(ab);
    const value = body.parse(dv);

    console.log(value);

    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;

    const camera = this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    const scene = this.scene = new THREE.Scene();
    const geometry = new THREE.Geometry();
    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // geometry.vertices.push(
    //   new THREE.Vector3(0, -10, 0),
    //   new THREE.Vector3(10, 0, 0),
    //   new THREE.Vector3(0, 10, 0));

    for (const joint of value.skeleton.joints) {
      const { x, y, z } = joint.position.xyz;
      geometry.vertices.push(new THREE.Vector3(x, y, z));
    }

    const head = value.skeleton.joints[Joint.K4ABT_JOINT_HEAD].position.xyz;
    const neck = value.skeleton.joints[Joint.K4ABT_JOINT_NECK].position.xyz;

    // geometry.vertices.push(
    //   new THREE.Vector3(head.x, head.y, head.z),
    //   new THREE.Vector3(neck.x, neck.y, neck.z),
    // );

    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: 0x0000ff,
      linewidth: 10,
    }));

    scene.add(line);


    // console.log(head, neck);
    camera.position.set(head.x, head.y, head.z - 50);
    camera.lookAt(head.x, head.y, head.z);
    // camera.position.set(-60, -70, -180);
    // camera.rotation.set(2.2, -1.36, -2.52);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    this.el.nativeElement.appendChild(renderer.domElement);

    renderer.render(scene, camera);

  }

  cameraPanLeft() {
    this.camera.position.x -= PAN_BY;
    this.render();
  }

  cameraPanRight() {
    this.camera.position.x += PAN_BY;
    this.render();
  }

  cameraPanUp() {
    this.camera.position.y += PAN_BY;
    this.render();
  }

  cameraPanDown() {
    this.camera.position.y -= PAN_BY;
    this.render();
  }

  cameraPanIn() {
    this.camera.position.z -= PAN_BY;
    this.render();
  }

  cameraPanOut() {
    this.camera.position.z += PAN_BY;
    this.render();
  }

  cameraRotateLeft() {
    this.camera.rotateX(-ROTATE_BY);
    this.render();
  }

  cameraRotateRight() {
    this.camera.rotateX(ROTATE_BY);
    this.render();
  }

  cameraRotateUp() {
    this.camera.rotateY(ROTATE_BY);
    this.render();
  }

  cameraRotateDown() {
    this.camera.rotateY(-ROTATE_BY);
    this.render();
  }

  cameraRotateIn() {
    this.camera.rotateZ(ROTATE_BY);
    this.render();
  }

  cameraRotateOut() {
    this.camera.rotateZ(-ROTATE_BY);
    this.render();
  }

  private render() {
    const { x: px, y: py, z: pz } = this.camera.position;
    const { x: rx, y: ry, z: rz } = this.camera.rotation;

    console.log('POSITION', px, py, pz);
    console.log('ROTATION', rx, ry, rz);
    this.renderer.render(this.scene, this.camera);
  }

}
