import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { bodyStruct, SkeletonJoint } from 'src/lib/k4a-bt/body-struct';
import { OrbitControls } from 'src/lib/three/orbit-controls';
import { BodySkeleton } from 'src/lib/three/body';
import { Joint } from 'src/lib/k4a-bt/joints';
import { Vector3 } from 'three';

@Component({
  selector: 'k4a-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('canvasElement', { static: false })
  canvasElement: ElementRef<HTMLCanvasElement>;

  @ViewChild('imageElement', { static: false })
  imageElement: ElementRef<HTMLImageElement>;

  position: number[];
  connected: boolean;

  private camera: THREE.Camera;
  private ws: WebSocket;
  // private pointCloud: PointCloud;
  private bodySkeletons = new Map<number, BodySkeleton>();
  private scene: THREE.Scene;
  private pointsGeometry: THREE.BufferGeometry;

  constructor(
    private cdr: ChangeDetectorRef,
    private el: ElementRef<HTMLElement>) { }

  ngOnInit() {
    this.position = [];
  }

  ngOnDestroy() {
  }

  ngAfterViewInit() {
    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;

    const camera = this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    const scene = this.scene = new THREE.Scene();

    camera.position.set(100, 100, 100);

    // this.pointCloud = new PointCloud();
    const pointsGeometry = this.pointsGeometry = new THREE.BufferGeometry();
    const pointsMaterial = new THREE.PointsMaterial({ color: 'gray', size: 1, sizeAttenuation: false });
    const pointsMesh = new THREE.Points(this.pointsGeometry, pointsMaterial);

    const w = 512;
    const h = 512;
    const max_points = w * h;
    const positions = new Float32Array(max_points * 3);
    pointsGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));


    scene.add(new THREE.GridHelper(5000, 100));
    scene.add(new THREE.AxesHelper(1000));
    // scene.add(this.pointCloud.points);
    scene.add(pointsMesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvasElement.nativeElement });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    setInterval(() => {
      this.position = this.camera ? this.camera.position.toArray() : [];
      this.cdr.markForCheck();
    }, 50);

  }

  connect() {
    const colors = ['pink', 'orange', 'green', 'red', 'blue'];
    const lastSeen = new Map<number, number>();
    const positions = new Map<number, SkeletonJoint[]>();

    this.disconnect();
    this.ws = new WebSocket('ws://localhost:8080');
    this.ws.binaryType = 'arraybuffer';

    let imageFrames = 0;
    const drawImage = (data: DataView) => {
      const blob = new Blob([data.buffer]);
      const url = URL.createObjectURL(blob);
      this.imageElement.nativeElement.src = url;
      imageFrames += 1;
    };

    const drawPointCloud = (data: DataView) => {
      const geometry = this.pointsGeometry;
      const position = geometry.attributes.position as THREE.BufferAttribute;
      const array = position.array as Float32Array;
      const pointCount = data.byteLength / (3 * 4); // 3=xyz, 4=sizeof(float)

      console.log(`PC: ${data.byteLength} bytes, ${pointCount} points`);

      geometry.setDrawRange(0, pointCount);

      let iPoint = 0;
      let iBuffer = 0;
      while (iPoint < pointCount * 3) {
        array[iPoint] = data.getFloat32(iBuffer, true);
        iPoint += 1;
        iBuffer += 4;
      }

      geometry.rotateZ(Math.PI);

      position.needsUpdate = true;
    };

    let bodyFrames = 0;
    let firstBody = true;
    const drawBody = (data: DataView) => {
      const body = bodyStruct.parse(data);
      let skeleton: BodySkeleton;

      if (this.bodySkeletons.has(body.id)) {
        skeleton = this.bodySkeletons.get(body.id);
      } else {
        const color = colors[this.bodySkeletons.size % colors.length];
        skeleton = new BodySkeleton(color).rotateZ(Math.PI);
        skeleton.name = `skeleton:${body.id}`;
        this.bodySkeletons.set(body.id, skeleton);
        this.scene.add(this.bodySkeletons.get(body.id));
      }

      skeleton.update(body.skeleton.joints);
      bodyFrames += 1;

      if (firstBody) {
        this.camera.position.x = skeleton.position.x;
        this.camera.position.y = skeleton.position.y;
        this.camera.position.x = skeleton.position.z * 2;
        this.camera.lookAt(skeleton.position);
        firstBody = false;
      }

      lastSeen.set(body.id, new Date().getTime());
      positions.set(body.id, body.skeleton.joints);
    };

    setInterval(() => {
      if (bodyFrames || imageFrames) {
        console.log(`FPS: body=${bodyFrames}, image=${imageFrames}`)
      }
      bodyFrames = 0;
      imageFrames = 0;

      const now = new Date().getTime();
      for (const [id, ts] of lastSeen.entries()) {
        if (now - ts > 1500) {
          console.log(`Deleting stale skeleton: ${id}`);
          const skeleton = this.bodySkeletons.get(id);
          this.scene.remove(skeleton);
          this.bodySkeletons.delete(id);
          lastSeen.delete(id);
        }
      }
    }, 1000);

    setInterval(() => {
      for (const [id, joints] of positions.entries()) {
        const wristL = joints[Joint.K4ABT_JOINT_WRIST_LEFT];
        const wristR = joints[Joint.K4ABT_JOINT_WRIST_RIGHT];
        const shoulderL = joints[Joint.K4ABT_JOINT_SHOULDER_LEFT];
        const shoulderR = joints[Joint.K4ABT_JOINT_SHOULDER_RIGHT];

        let upL = false;
        let upR = false;
        if (wristL.position.xyz.y < shoulderL.position.xyz.y) {
          console.log("LEFT UP", id);
          upL = true;
        }

        if (wristR.position.xyz.y < shoulderR.position.xyz.y) {
          console.log("RIGHT UP", id);
          upR = true;
        }

        if (upL && upR) {
          console.log('BOTH UP');
        }
      }
    }, 250);

    this.ws.addEventListener('message', (event) => {

      const dv = new DataView(event.data as ArrayBuffer);
      const type = dv.getUint32(0, true);
      const payload = new DataView(dv.buffer.slice(8)); // chop 4 bytes for TYPE and 4 for SIZE

      if (type === 1) {
        drawImage(payload);
      } else if (type === 2) {
        drawPointCloud(payload);
      } else if (type == 3) {
        drawBody(payload);
      }
    });

    this.ws.addEventListener('open', () => {
      console.log('WS open');
      this.connected = true;
    });

    this.ws.addEventListener('close', (event) => {
      console.log(event);
      console.log('WS close');
      this.connected = false;
    });

    this.ws.addEventListener('error', (err) => {
      console.warn('WS error', err);
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
