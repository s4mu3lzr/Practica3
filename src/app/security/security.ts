import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  private readonly adminUser = {
    email: 'admin@erp.com',
    phone: '5512345678',
    password: 'admin123',
    name: 'Samuel de Santiago'
  };

  private isAuthenticated = false;

  login(email: string, password: string): boolean {
    if (email === this.adminUser.email && password === this.adminUser.password) {
      this.isAuthenticated = true;
      return true;
    }
    return false;
  }

  // 3. Cerrar sesión
  logout(): void {
    this.isAuthenticated = false;
  }

  // 4. Obtener datos del usuario si está logueado
  getCurrentUser() {
    return this.isAuthenticated ? this.adminUser : null;
  }
}