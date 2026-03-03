import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, AvatarModule, DividerModule, TagModule],
    templateUrl: './user.html',
    styleUrl: './user.css'
})
export class UserComponent {
    // Datos mockeados del perfil
    userProfile = {
        fullName: 'Samuel de Santiago',
        username: 'samuelds',
        email: 'admin@erp.com',
        address: 'Av. Universidad 123, Ciudad de México',
        phone: '5512345678',
        age: 28,
        password: '********', // Contraseña enmascarada por seguridad
        role: 'Administrador Principal',
        status: 'Activo',
        skills: ['Angular', 'TypeScript', 'Gestión de Proyectos', 'Base de Datos']
    };
}
