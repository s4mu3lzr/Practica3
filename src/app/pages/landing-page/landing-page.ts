import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- Importamos para la navegación
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule], // <-- Agregamos RouterModule
  templateUrl: './landing-page.html' // <-- Corregido para que coincida con tu archivo
})
export class LandingPageComponent { }