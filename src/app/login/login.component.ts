import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-login', // Cambiado a 'app-login'
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,],
  templateUrl: './login.component.html', // Cambiado a 'login.component.html'
  styleUrls: ['./login.component.css'], // Cambiado a 'login.component.css'
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {} // Inyectar el servicio

  ngOnInit(): void {



  const token = localStorage.getItem('token');
  if (token) {
    this.authService.validateUser(token).subscribe({
      next: (userData) => {
        // Redirige según el rol si el usuario ya está autenticado
        localStorage.setItem('userData', JSON.stringify(userData)); // Guarda los datos del usuario
        if (userData.role === 'ROLE_ADMIN') {
          this.router.navigate(['/atlAdminView']);
        } else {
          this.router.navigate(['/atlUserView']);
        }
      },
      error: () => {
        // Si el token no es válido, puedes limpiar el almacenamiento o mostrar un mensaje
        localStorage.removeItem('token');
        this.errorMessage = 'Sesión expirada, por favor inicia sesión de nuevo.';
      }
    });
  }

  }

onSubmit(): void {
  if (this.email && this.password) {
    const credentials = { username: this.email, password: this.password };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        const token = response?.token;
        if (token) {
          localStorage.setItem('token', token);
          this.authService.validateUser(token).subscribe({
            next: (userData) => {
              // Puedes guardar el usuario y rol si lo necesitas
              localStorage.setItem('userData', JSON.stringify(userData));
              if (userData.role === 'ROLE_ADMIN') {
                this.router.navigate(['/atlAdminView']);
              } else {
                this.router.navigate(['/atlUserView']);
              }
            },
            error: () => {
              this.errorMessage = 'Error validando usuario';
            }
          });
        } else {
          this.errorMessage = 'Error al recibir el token';
        }
      },
      error: () => {
        this.errorMessage = 'Credenciales incorrectas';
      }
    });
  } else {
    this.errorMessage = 'Por favor, completa todos los campos.';
  }
}

}
