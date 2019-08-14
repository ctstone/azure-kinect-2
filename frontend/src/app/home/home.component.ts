import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { bodyStruct } from 'src/lib/k4a-bt/body-struct';
import { OrbitControls } from 'src/lib/three/orbit-controls';
import { PointCloud } from 'src/lib/three/point-cloud';
import { BodySkeleton } from 'src/lib/three/body';

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

  private camera: THREE.Camera;
  private ws: WebSocket;
  private pointCloud: PointCloud;
  private bodySkeleton: BodySkeleton;

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
    const scene = new THREE.Scene();

    camera.position.set(100, 100, 1000);

    this.pointCloud = new PointCloud();
    this.bodySkeleton = new BodySkeleton();
    this.bodySkeleton.rotateZ(Math.PI);

    scene.add(new THREE.GridHelper(1000, 100));
    scene.add(new THREE.AxesHelper(1000));
    scene.add(this.pointCloud.points);
    scene.add(this.bodySkeleton);

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
    this.disconnect();
    // this.ws = new WebSocket(`ws://${window.document.location.host}/api`);
    this.ws = new WebSocket('ws://localhost:8080');
    this.ws.binaryType = 'arraybuffer';

    let firstPointCloud = true;

    const drawImage = (data: DataView) => {
      const blob = new Blob([data.buffer]);
      const url = URL.createObjectURL(blob);
      this.imageElement.nativeElement.src = url;
    };

    const drawPointCloud = (data: DataView) => {
      const pointCount = data.byteLength / (3 * 4); // 3=xyz, 4=sizeof(float)
      let i = 0
      this.pointCloud.reset();
      while (this.pointCloud.length < pointCount) {
        const v = new THREE.Vector3();
        v.x = data.getFloat32(i, true);
        i += 4;
        v.y = data.getFloat32(i, true);
        i += 4;
        v.z = data.getFloat32(i, true);
        i += 4;
        this.pointCloud.push(v);
      }
      this.pointCloud.flip();

      if (firstPointCloud) {
        firstPointCloud = false;
        this.camera.position.z = 100;
      }
    };

    const drawBody = (data: DataView) => {
      const body = bodyStruct.parse(data);
      this.bodySkeleton.update(body.skeleton.joints);
      console.log(body.skeleton.joints);
    };

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
    });

    this.ws.addEventListener('close', (event) => {
      console.log(event);
      console.log('WS close');
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
