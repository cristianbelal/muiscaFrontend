import { Component } from '@angular/core';
//import { PruebaComponent } from './prueba/prueba.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'], // Cambiado a styleUrls
})
export class AppComponent {
  title = 'zenodoMuisca';
}
