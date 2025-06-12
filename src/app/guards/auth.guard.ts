import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    let allow = false;
    if (token) {
      // Síncrono: si tienes el rol guardado en localStorage tras el login
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.role === 'ROLE_ADMIN') {
        allow = true;
      } else {
        alert('Ojito No tienes permisos para acceder a esta página.');
        this.router.navigate(['/atlUserView']);
      }
    } else {
      this.router.navigate(['/login']);
    }
    return allow;
  }
}
