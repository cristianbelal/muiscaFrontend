import { Component, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

declare const FB: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  userData: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Validar token existente
    const token = localStorage.getItem('token');
    if (token) {
      this.authService.validateUser(token).subscribe({
        next: (userData) => {
          localStorage.setItem('userData', JSON.stringify(userData));
          if (userData.role === 'ROLE_ADMIN') {
            this.router.navigate(['/atlAdminView']);
          } else {
            this.router.navigate(['/atlUserView']);
          }
        },
        error: () => {
          localStorage.removeItem('token');
          this.errorMessage =
            'Sesión expirada, por favor inicia sesión de nuevo.';
        },
      });
    }

    this.initializeGoogleLogin();
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

  initializeGoogleLogin() {
    const clientId =
      '928310748438-5smhnfqq6hui1vok3q9vf7333apuibis.apps.googleusercontent.com';

    const waitForGoogle = () => {
      if (window.hasOwnProperty('google')) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            this.ngZone.run(() => this.handleCredentialResponse(response));
          },
        });

        // Renderizar botón si deseas
        // @ts-ignore
        window.google.accounts.id.renderButton(
          document.getElementById('googleButton'),
          { theme: 'outline', size: 'large' }
        );
      } else {
        setTimeout(waitForGoogle, 100);
      }
    };

    waitForGoogle();
  }

  handleCredentialResponse(response: any) {
    const credential = response.credential;

    if (!credential) {
      this.errorMessage = 'No se recibió token de Google';
      return;
    }

    // Llama al backend para validar el token de Google y obtener tu JWT
    this.authService.signInWithGoogle(credential).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/atlUserView']);
      },
      error: () => {
        this.errorMessage = 'Error al iniciar sesión con Google';
      },
    });
  }

  signInWithGoogle() {
    // @ts-ignore
    if (window.google && window.google.accounts.id) {
      // @ts-ignore
      window.google.accounts.id.prompt();
    } else {
      this.errorMessage = 'Google Identity Services no está disponible';
    }
  }

  signInWithFacebook() {
    FB.login(
      (response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;

          // Enviar el token de Facebook a tu backend
          this.authService.signInWithFacebook(accessToken).subscribe({
            next: (res) => {
              localStorage.setItem('token', res.token);
              this.router.navigate(['/atlUserView']);
            },
            error: () => {
              this.errorMessage = 'Error al iniciar sesión con Facebook';
            },
          });
        } else {
          this.errorMessage = 'Inicio de sesión con Facebook cancelado.';
        }
      },
      { scope: 'public_profile,email' }
    );
  }
}

/*
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
    console.log('me llamaron ngOnInit');
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

    //this.initializeGoogleSignIn();

    // Inicializa Google Identity
    // @ts-ignore
    google.accounts.id.initialize({
      client_id:
        '928310748438-5smhnfqq6hui1vok3q9vf7333apuibis.apps.googleusercontent.com',
      callback: (response: any) => {
        const token = response.credential;
        this.authService.signInWithGoogle(token).subscribe({
          next: (res) => {
            // Maneja la respuesta (guardar token, redirigir, etc.)
          },
          error: () => {
            this.errorMessage = 'Error al iniciar sesión con Google';
          },
        });
      },
    });
  }

  onGoogleSignIn(response: any) {
    const credential = response.credential;
    if (!credential) {
      this.errorMessage = 'No se recibió token de Google.';
      return;
    }
    this.authService.signInWithGoogle(credential).subscribe({
      next: (backendResponse) => {
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
    let callbackCalled = false;
    google.accounts.id.initialize({
      client_id:
        '928310748438-5smhnfqq6hui1vok3q9vf7333apuibis.apps.googleusercontent.com',
      callback: (response: any) => {
        callbackCalled = true;
        console.log('Token de Google recibido:', response.credential);
        this.onGoogleSignIn(response);
      },
    });

    setTimeout(() => {
      if (!callbackCalled) {
        this.errorMessage =
          'No se pudo iniciar sesión con Google. Verifica el client_id o los permisos en Google Cloud Console.';
      }
    }, 10000);
  }
  signInWithGoogle() {
    // Llama al prompt de Google Identity Services, ojo que solo se hace una vez
    // @ts-ignore
    // @ts-ignore
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // @ts-ignore
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.errorMessage =
            'El inicio de sesión fue cancelado. Recarga la página para intentarlo de nuevo.';
        }
      });
    } else {
      this.errorMessage = 'Google Identity Services no está cargado.';
    }
  }
}
*/
