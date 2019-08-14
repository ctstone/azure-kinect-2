import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';

// https://codepen.io/seanseansean/pen/EaBZEY?editors=0010

const PAN_BY = 10;
const ROTATE_BY = .05;

@Component({
  selector: 'k4a-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit, AfterViewInit {

  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    const resp = await fetch('/assets/points.ply');
    const text = await resp.text();

    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    const camera = this.camera;

    camera.position.z = 250;

    this.scene = new THREE.Scene();

    this.scene.add(new THREE.AmbientLight(0x404040));

    const scene = this.scene
    const geometry = new THREE.Geometry();
    const material = new THREE.PointsMaterial({
      color: 'gray',
      size: 2,
      sizeAttenuation: false,
    });

    // sphere test
    const sphereGeo = new THREE.SphereGeometry(50);
    const sphereMat = new THREE.MeshLambertMaterial({ color: 0x0087E6 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphereGeo.vertices.push(new THREE.Vector3(10, 10, 10));
    this.scene.add(sphere);

    // /sphere


    const headers: string[] = [];
    let endHeader = false;
    let line = '';
    let vertex: THREE.Vector3;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const n = text[i + 1];
      if (endHeader && c === ' ') {
        if (!vertex) {
          vertex = new THREE.Vector3();
          vertex.x = parseFloat(line);
          line = '';
        } else if (!vertex.y) {
          vertex.y = parseFloat(line);
          line = '';
        }
      }
      if (c === '\n' || (c === '\r' && n === '\n')) {
        if (endHeader) {
          vertex.z = parseFloat(line);
          geometry.vertices.push(vertex);
          vertex = null;

        } else if (line === 'end_header') {
          endHeader = true;
        } else {
          if (line.startsWith('element vertex')) {
            const size = parseInt(line.substring(15));
          }
          headers.push(line);
        }
        line = '';
        if (c === '\r') {
          i += 1;
        }
      } else {
        line += c;
      }
    }

    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    const renderer = this.renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    this.el.nativeElement.appendChild(renderer.domElement);

    // let mouseX = 0;
    // let mouseY = 0;
    // let windowHalfX = 1;
    // let windowHalfY = 1;

    // document.addEventListener('mousemove', (event) => {
    //   mouseX = event.clientX - windowHalfX;
    //   mouseY = event.clientY - windowHalfY;
    // });

    // document.addEventListener('resize', (event) => {
    //   windowHalfX = window.innerWidth / 2;
    //   windowHalfY = window.innerHeight / 2;
    // });



    animate();

    function animate() {

      requestAnimationFrame(animate);

      // pointCloud.rotateY(.002);

      // camera.position.x += (mouseX - camera.position.x) * 0.05;
      // camera.position.y += (-mouseY - camera.position.y) * 0.05;

      renderer.render(scene, camera);

    }

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
