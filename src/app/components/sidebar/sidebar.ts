import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SecurityService } from '../../security/security'; // <-- Para poder cerrar sesión

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  constructor(private securityService: SecurityService, private router: Router) { }

  logout() {
    this.securityService.logout();
    this.router.navigate(['/auth/login']);
  }
}
