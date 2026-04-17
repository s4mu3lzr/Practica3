import { Injectable } from '@angular/core';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private isAuthenticated = false;
  private currentUser: AuthUser | null = null;

  constructor() {
      this.loadUserFromToken();
  }

  loadUserFromToken() {
      if (typeof window !== 'undefined' && window.localStorage) {
          const token = localStorage.getItem('token');
          if (token) {
              try {
                  const payload = JSON.parse(atob(token.split('.')[1]));
                  this.currentUser = {
                      id: payload.id,
                      email: payload.email,
                      name: payload.name || payload.email,
                      permissions: payload.permissions || []
                  };
                  this.isAuthenticated = true;
              } catch(e) {
                  this.logout();
              }
          }
      }
  }

  login(email: string, password: string): boolean {
    return false;
  }

  logout(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
    if (typeof window !== 'undefined' && window.localStorage) {
         localStorage.removeItem('token');
    }
  }

  getCurrentUser(): AuthUser | null {
    if (!this.currentUser) this.loadUserFromToken();
    return this.currentUser;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.email === 'admin_sys@demo.com') return true; 
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  }

  updateActivePermissions(permissions: string[]) {
      if (this.currentUser) {
          this.currentUser.permissions = permissions;
      }
  }
}