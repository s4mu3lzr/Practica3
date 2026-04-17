import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SecurityService } from '../../security/security';
import { DataService } from '../../services/data.service';
import { Group } from '../../models/group.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
  nombreUsuario = '';
  kpis = { total: 0, pendiente: 0, enProgreso: 0, revision: 0 };
  groups: Group[] = [];

  constructor(
    private securityService: SecurityService,
    private dataService: DataService
  ) {
    const user = this.securityService.getCurrentUser();
    if (user) {
      this.nombreUsuario = user.name;
    }
  }

  ngOnInit() {
    const user = this.securityService.getCurrentUser();
    const isAdmin = this.securityService.hasPermission('group:edit');

    this.dataService.getTickets().subscribe(tickets => {
        // En esta versión simplificada del ERP, todos ven todos los tickets 
        // para facilitar la demostración, ya que la BD no guarda la columna assignedTo.
        let relevantTickets = tickets;
        this.kpis = {
            total: relevantTickets.length,
            pendiente: relevantTickets.filter(t => t.status === 'Pendiente').length,
            enProgreso: relevantTickets.filter(t => t.status === 'En Progreso').length,
            revision: relevantTickets.filter(t => t.status === 'Revisión').length
        };
    });

    this.dataService.getGroups().subscribe(g => {
        this.groups = g; // Mostrar todos los grupos por simplicidad para la revisión
    });
  }
}
