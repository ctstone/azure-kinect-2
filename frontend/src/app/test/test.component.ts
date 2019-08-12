import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';

// https://codepen.io/seanseansean/pen/EaBZEY?editors=0010

@Component({
  selector: 'k4a-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit, AfterViewInit {

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    return;
    const resp = await fetch('/assets/points.ply');
    const text = await resp.text();

    const width = this.el.nativeElement.parentElement.clientWidth;
    const height = 600;
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    camera.position.z = 1200;

    const scene = new THREE.Scene();
    const geometry = new THREE.Geometry();
    const material = new THREE.PointsMaterial({
      color: 'gray',
      size: 2,
      sizeAttenuation: false,
    });


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
      if (c === '\r' && n === '\n') {
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
        i += 1;
      } else {
        line += c;
      }
    }

    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    this.el.nativeElement.appendChild(renderer.domElement);



    animate();

    function animate() {

      requestAnimationFrame(animate);

      pointCloud.rotateY(.002);

      renderer.render(scene, camera);

    }

  }

}
