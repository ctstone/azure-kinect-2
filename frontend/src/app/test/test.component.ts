import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'src/lib/three/orbit-controls';
import { PointCloud2 } from 'src/lib/three/point-cloud';

// https://codepen.io/seanseansean/pen/EaBZEY?editors=0010

@Component({
  selector: 'k4a-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit, AfterViewInit {

  position: number[];

  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;

  constructor(
    private cdr: ChangeDetectorRef,
    private el: ElementRef<HTMLElement>) { }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    const resp = await fetch('/assets/points5.ply');
    const text = await resp.text();

    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;

    const camera = this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 7500);
    const scene = this.scene = new THREE.Scene();

    camera.position.set(100, 100, 1000);
    scene.add(new THREE.AmbientLight(0x404040));
    scene.add(new THREE.GridHelper(10000, 10));
    scene.add(new THREE.AxesHelper(1000));

    const w = 512;
    const h = 512;
    const pointCloud = new PointCloud2(w * h, {
      color: 'gray',
      size: 1,
      sizeAttenuation: false,
    });

    const headers: string[] = [];
    let endHeader = false;
    let line = '';
    let j = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const n = text[i + 1];
      if (endHeader && c === ' ') {

        pointCloud.set(j, parseFloat(line));
        j += 1;
        line = '';
      }
      if (c === '\n' || (c === '\r' && n === '\n')) {
        if (endHeader) {
          pointCloud.set(j, parseFloat(line));
          j += 1;

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

    pointCloud.rotateZ(Math.PI);
    scene.add(pointCloud);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    const renderer = this.renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    this.el.nativeElement.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();


    animate();

    setInterval(() => {
      this.position = this.camera ? this.camera.position.toArray() : [];
      this.cdr.markForCheck();
    }, 50);

    function animate() {

      requestAnimationFrame(animate);

      controls.update();
      renderer.render(scene, camera);
    }
  }
}
