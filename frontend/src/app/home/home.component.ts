import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';

const PAN_BY = 10;
const ROTATE_BY = .05;

@Component({
  selector: 'k4a-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('canvasElement', { static: false })
  canvasElement: ElementRef<HTMLCanvasElement>;

  @ViewChild('imageElement', { static: false })
  imageElement: ElementRef<HTMLImageElement>;

  private ws: WebSocket;
  private geometry: THREE.Geometry;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    this.camera.position.set(-60, -70, -180);
    this.camera.rotation.set(2.2, -1.36, -2.52);

    // POSITION -60 -70 -180
    // ROTATION 2.225605772464909 -1.3622570802366978 -2.522103271392193

    this.scene = new THREE.Scene();
    this.geometry = new THREE.Geometry();
    const material = new THREE.PointsMaterial({
      color: 'gray',
      size: 2,
      sizeAttenuation: false,
    });

    const pointCloud = new THREE.Points(this.geometry, material);
    this.scene.add(pointCloud);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvasElement.nativeElement });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  connect() {
    this.disconnect();
    this.ws = new WebSocket(`ws://${window.document.location.host}/api`);
    this.ws.binaryType = 'arraybuffer';

    // const ctx = this.canvasElement.nativeElement.getContext('2d');

    const imageElement = this.imageElement;
    const geometry = this.geometry;
    const renderer = this.renderer;
    const scene = this.scene;
    const camera = this.camera;

    let imageData: DataView;
    let pointData: DataView;

    function animate() {
      drawImage();
      drawPointCloud();
      // requestAnimationFrame(animate);
    }

    function drawImage() {
      if (imageData) {
        const blob = new Blob([imageData.buffer.slice(8)]);
        const url = URL.createObjectURL(blob);
        imageElement.nativeElement.src = url;
      }
    }

    function drawPointCloud() {
      if (pointData) {
        const size = pointData.getUint32(4, true);
        const point_count = size / (3 * 4); // 3=xyz, 4=sizeof(float)
        let i = 0; // offset by 2 bytes for TYPE and SIZE
        geometry.vertices.length = 0;
        while (geometry.vertices.length < point_count) {
          const v = new THREE.Vector3();
          v.x = pointData.getFloat32(i += 4, true);
          v.y = pointData.getFloat32(i += 4, true);
          v.z = pointData.getFloat32(i += 4, true);
          geometry.vertices.push(v);
        }

        geometry.verticesNeedUpdate = true;
        renderer.render(scene, camera);
      }
    }

    this.ws.addEventListener('message', (event) => {

      const dv = new DataView(event.data as ArrayBuffer);
      const type = dv.getUint32(0, true);

      if (type === 1) {
        imageData = dv;
        pointData = null;
      } else if (type === 2) {
        pointData = dv;
        imageData = null;
      }

      animate();
    });

    this.ws.addEventListener('open', () => {
      console.log('WS open');
    });

    this.ws.addEventListener('close', () => {
      console.log('WS close');
    });

    animate();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
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
