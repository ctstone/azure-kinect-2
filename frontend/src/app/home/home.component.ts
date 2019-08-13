import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { body, Skeleton } from 'src/lib/k4a-bt/body-struct';
import { Joint } from 'src/lib/k4a-bt/joints';

const PAN_BY = 100;
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

  private body1Geometry: THREE.Geometry;
  private body1Line: THREE.Line;

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    this.camera.position.set(-60, -70, -180);
    this.camera.rotation.set(2.2, -1.36, -2.52);

    this.scene = new THREE.Scene();
    // const plane = new THREE.GridHelper(100, 10);
    // this.scene.add(plane);

    const axes = new THREE.AxesHelper(1000);
    this.scene.add(axes);


    this.geometry = new THREE.Geometry();
    const material = new THREE.PointsMaterial({
      color: 'gray',
      size: 2,
      sizeAttenuation: false,
    });



    const pointCloud = new THREE.Points(this.geometry, material);
    this.scene.add(pointCloud);

    this.body1Geometry = new THREE.Geometry();
    // this.body1Line = new THREE.Line(this.body1Geometry, new THREE.LineBasicMaterial({
    //   color: 0x0000ff,
    //   linewidth: 10,
    // }));
    const body1Material = new THREE.PointsMaterial({
      color: 'blue',
      size: 20,
      sizeAttenuation: false,
    });
    const body1Points = new THREE.Points(this.body1Geometry, body1Material);
    this.scene.add(body1Points);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvasElement.nativeElement });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.render();
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
    const bodies = new Array<Skeleton>(10);

    let imageData: DataView;
    let pointData: DataView;

    function animate() {
      drawImage();
      drawPointCloud();
      drawBodies();
      // requestAnimationFrame(animate);

    }

    let first = true;

    const drawBodies = () => {
      const body = bodies.find((x) => !!x);
      if (body) {
        this.body1Geometry.vertices.length = 0;
        for (const joint of body.joints) {
          this.body1Geometry.vertices.push(new THREE.Vector3(...joint.position.v));
        }

        // this.body1Geometry.vertices.push(
        //   new THREE.Vector3(...body.joints[Joint.K4ABT_JOINT_HEAD].position.v),
        //   new THREE.Vector3(...body.joints[Joint.K4ABT_JOINT_NECK].position.v),
        //   new THREE.Vector3(...body.joints[Joint.K4ABT_JOINT_WRIST_LEFT].position.v),
        //   new THREE.Vector3(...body.joints[Joint.K4ABT_JOINT_WRIST_RIGHT].position.v),
        //   new THREE.Vector3(...body.joints[Joint.K4ABT_JOINT_NECK].position.v),
        // );

        this.body1Geometry.verticesNeedUpdate = true;

        if (first) {
          const head = body.joints[Joint.K4ABT_JOINT_HEAD].position.xyz;
          camera.position.set(head.x, head.y, head.z - 500);
          camera.lookAt(head.x, head.y, head.z);
          first = false;
        }

        renderer.render(scene, camera);
      }
    };

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
      } else if (type == 3) {
        const data = new DataView(dv.buffer.slice(8));
        const b = body.parse(data);
        // bodies[b.id] = b.skeleton;
        bodies[0] = b.skeleton;
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
