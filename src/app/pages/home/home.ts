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

    this.kpis = this.dataService.getDashboardKPIs(isAdmin ? undefined : user?.email);

    this.dataService.getGroups().subscribe(g => {
      if (isAdmin) {
        this.groups = g;
      } else {
        this.groups = g.filter(group => group.memberIds?.includes(user?.id || ''));
      }
    });
  }
}
