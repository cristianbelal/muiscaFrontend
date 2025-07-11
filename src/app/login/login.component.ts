import { Component, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

declare const google: any;
@Component({
  selector: 'app-login', // Cambiado a 'app-login'
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html', // Cambiado a 'login.component.html'
  styleUrls: ['./login.component.css'], // Cambiado a 'login.component.css'
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {} // Inyectar el servicio

  userData: any = null;

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
          // Si el token no es válido
          localStorage.removeItem('value');
          this.errorMessage =
            'Sesión expirada, por favor inicia sesión de nuevo.';
        },
      });
    }

    // Cargar el script de Google Identity si no está en index.html
    const scriptId = 'google-identity';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      document.body.appendChild(script);
      script.onload = () => this.initializeGoogleSignIn();
    } else {
      this.initializeGoogleSignIn();
    }

    // Definir la función global para el callback de Google
    (window as any).handleCredentialResponse = (response: any) => {
      this.ngZone.run(() => {
        this.handleGoogleCredential(response);
      });
    };
  }

  handleGoogleCredential(response: any) {
    // Mostrar el token en consola
    console.log('Token de Google recibido:', response.credential);

    // Llamar al servicio para enviar el token al backend
    this.authService.signInWithGoogle(response.credential).subscribe({
      next: (res) => {
        console.log('Respuesta del backend:', res);
        // Aquí puedes guardar el token de tu backend o redirigir al usuario
      },
      error: (err) => {
        console.error('Error al autenticar con Google:', err);
      },
    });
  }

  onGoogleSignIn(response: any) {
    console.log('onGoogleSing');
    const credential = response.credential;
    console.log('Token de Google recibido:', credential); // Aquí se imprime el token
    this.authService.signInWithGoogle(credential).subscribe({
      next: (backendResponse) => {
        // Maneja la respuesta del backend (por ejemplo, guarda el token JWT propio)
        localStorage.setItem('token', backendResponse.token);
        this.router.navigate(['/atlUserView']);
      },
      error: () => {
        this.errorMessage = 'Error al iniciar sesión con Google';
      },
    });
  }

  parseJwt(token: string) {
    // Decodifica el JWT para obtener los datos del usuario
    console.log('metodo parse JWt');
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
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
              },
            });
          } else {
            this.errorMessage = 'Error al recibir el token';
          }
        },
        error: () => {
          this.errorMessage = 'Credenciales incorrectas';
        },
      });
    } else {
      this.errorMessage = 'Por favor, completa todos los campos.';
    }
  }
  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id:
        '928310748438-5smhnfqq6hui1vok3q9vf7333apuibis.apps.googleusercontent.com',
      callback: (response: any) => this.onGoogleSignIn(response),
    });
  }
  signInWithGoogle() {
    // Si quieres usar el botón personalizado, puedes invocar el prompt de Google:
    // @ts-ignore
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // @ts-ignore
      window.google.accounts.id.prompt();
    }
  }
}
