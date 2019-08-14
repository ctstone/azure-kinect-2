import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { bodyStruct } from 'src/lib/k4a-bt/body-struct';
import * as THREE from 'three';
import { OrbitControls } from 'src/lib/three/orbit-controls';
import { BodySkeleton } from 'src/lib/three/body';

@Component({
  selector: 'k4a-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit, AfterViewInit {

  constructor(private el: ElementRef<HTMLElement>) { }

  async ngOnInit() {

  }

  async ngAfterViewInit() {
    const resp = await fetch('/assets/body.bin');
    const ab = await resp.arrayBuffer();
    const dv = new DataView(ab);
    const body = bodyStruct.parse(dv);

    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    const skeleton = new BodySkeleton();
    skeleton.rotateZ(Math.PI);
    skeleton.update(body.skeleton.joints);

    camera.position.set(100, 100, 1000);

    scene.add(skeleton);
    scene.add(new THREE.GridHelper(10000, 100));
    scene.add(new THREE.AxesHelper(1000));
    scene.add(new THREE.AmbientLight(0x404040));


    renderer.setClearColor(0x333F47, .8);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    this.el.nativeElement.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

  }


}
