import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

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
  errorMessage: string = '';

  constructor(private authService: AuthService) {} // Inyectar el servicio


  onSubmit(): void {
    if (this.email && this.password) {
      const credentials = { username: this.email, password: this.password };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          // Aquí puedes manejar el token o redirigir al usuario
        },
        error: (error) => {
          console.error('Error en el login:', error);
          this.errorMessage = 'Credenciales incorrectas';
        },
      });
    } else {
      console.error('Por favor, completa todos los campos.');
    }
  }
}
