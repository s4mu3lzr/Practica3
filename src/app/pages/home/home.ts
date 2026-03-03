import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card'; // <-- Importamos las Cards de PrimeNG
import { SecurityService } from '../../security/security';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './home.html'
})
export class HomeComponent {
  nombreUsuario = '';

  constructor(private securityService: SecurityService) {
    const user = this.securityService.getCurrentUser();
    if (user) {
      this.nombreUsuario = user.name;
    }
  }
}
