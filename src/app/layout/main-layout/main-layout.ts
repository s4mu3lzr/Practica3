import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { SecurityService } from '../../security/security';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent implements OnInit {
  currentUserInitial = 'U';
  currentUserName = 'Usuario';
  currentUserRole = 'Sin rol';

  constructor(private securityService: SecurityService) { }

  ngOnInit() {
    const user = this.securityService.getCurrentUser();
    if (user) {
      this.currentUserName = user.name || user.email;
      this.currentUserInitial = this.currentUserName.charAt(0).toUpperCase();
      const isAdmin = this.securityService.hasPermission('user:crud');
      this.currentUserRole = isAdmin ? 'Administrador' : 'Colaborador';
    }
  }
}
