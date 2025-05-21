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
      this.router.navigate(['/atl']);
    }/*else{
      this.router.navigate(['/atl']);
    }*/
  }

  onSubmit(): void {
    if (this.email && this.password) {
      const credentials = { username: this.email, password: this.password };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          const token = response?.token; // Asegúrate de que la respuesta tenga el token
          if (token) {
            console.log('Token recibido:', token);
            localStorage.setItem('token', token); // Guardar el token en el almacenamiento local
            this.router.navigate(['/atl']); // Redirigir a la ruta deseada
          }else{
            console.error('Token no recibido en la respuesta');
            this.errorMessage = 'Error al recibir el token';
          }

        },
        error: (error) => {
          console.error('Error en el login:', error);
          this.errorMessage = 'Credenciales incorrectas';
        },
      });
    } else {
      console.error('Por favor, completa todos los campos.');
      this.errorMessage = 'Por favor, completa todos los campos.';
    }
  }

}
