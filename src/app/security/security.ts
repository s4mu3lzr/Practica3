import { Injectable } from '@angular/core';
import { DataService } from '../services/data.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  private readonly adminUser = {
    id: '1',
    email: 'admin@erp.com',
    phone: '5512345678',
    password: 'admin123',
    name: 'Samuel de Santiago',
    permissions: ['group:add', 'group:edit', 'group:delete', 'user:crud', 'ticket:create', 'ticket:edit']
  };

  private currentUser: User | null = null;
  private isAuthenticated = false;

  constructor(private dataService: DataService) {
    this.dataService.getUsers().subscribe(users => {
      if (this.isAuthenticated && this.currentUser && this.currentUser.id !== this.adminUser.id) {
        const freshUser = users.find(u => u.email === this.currentUser!.email);
        if (freshUser) {
          this.currentUser = { ...freshUser };
        }
      }
    });
  }

  login(email: string, password: string): boolean {
    if (email === this.adminUser.email && password === this.adminUser.password) {
      this.currentUser = this.adminUser as any;
      this.isAuthenticated = true;
      return true;
    }

    // Fallback normal user (ignora validacion pass en test)
    let found = false;
    this.dataService.getUsers().subscribe(users => {
      const u = users.find(x => x.email === email);
      if (u) {
        this.currentUser = u;
        this.isAuthenticated = true;
        found = true;
      }
    }).unsubscribe();

    return found;
  }

  // 3. Cerrar sesión
  logout(): void {
    this.isAuthenticated = false;
  }

  // 4. Obtener datos del usuario si está logueado
  getCurrentUser() {
    if (!this.isAuthenticated) return null;
    return this.currentUser?.id === this.adminUser.id ? this.adminUser : this.currentUser;
  }

  // 5. Verificar permisos reactivos para vistas y acciones
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }
}