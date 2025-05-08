import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login', // Cambiado a 'app-login'
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html', // Cambiado a 'login.component.html'
  styleUrls: ['./login.component.css'], // Cambiado a 'login.component.css'
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  onSubmit(): void {
    console.log('Formulario enviado');
    if (this.email && this.password) {
      console.log('Correo:', this.email);
      console.log('Contraseña:', this.password);
      // Aquí puedes agregar la lógica para autenticar al usuario
    } else {
      console.error('Por favor, completa todos los campos.');
    }
  }
}
