import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'k4a-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('canvasElement', { static: false })
  canvasElement: ElementRef<HTMLCanvasElement>;

  @ViewChild('imageElement', { static: false })
  imageElement: ElementRef<HTMLImageElement>;

  private ws: WebSocket;

  constructor() { }

  ngOnInit() {
  }

  connect() {
    this.disconnect();
    this.ws = new WebSocket(`ws://${window.document.location.host}/api`);

    const ctx = this.canvasElement.nativeElement.getContext('2d');

    this.ws.addEventListener('message', (event) => {
      // console.log(event);
      const url = URL.createObjectURL(event.data);
      this.imageElement.nativeElement.src = url;
      console.log(this.imageElement.nativeElement);
      ctx.drawImage(this.imageElement.nativeElement, 100, 100);

    });

    this.ws.addEventListener('open', () => {
      console.log('open');
    });

    this.ws.addEventListener('close', () => {
      console.log('close');
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

}
