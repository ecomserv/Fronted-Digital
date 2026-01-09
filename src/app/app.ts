import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow-y: auto; /* Enable scroll on app-root */
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
    }
  `]
})
export class App {
  title = 'ECOMSERV';
}
