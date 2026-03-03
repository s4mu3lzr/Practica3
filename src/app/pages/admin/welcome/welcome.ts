import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SecurityService } from '../../../security/security'; // <-- ¡SIN EL .service!

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './welcome.html'
})
export class WelcomeComponent {
  adminName = '';

  constructor(private securityService: SecurityService, private router: Router) {
    const user = this.securityService.getCurrentUser();
    
    if (user) {
      this.adminName = user.name;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  onLogout() {
    this.securityService.logout();
    this.router.navigate(['/auth/login']);
  }
}