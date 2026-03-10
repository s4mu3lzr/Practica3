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
    this.kpis = this.dataService.getDashboardKPIs();
    this.dataService.getGroups().subscribe(g => this.groups = g);
  }
}
