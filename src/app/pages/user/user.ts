import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

function ageValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (!control.value) return null;
    const dobText = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - dobText.getFullYear();
    const m = today.getMonth() - dobText.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobText.getDate())) {
        age--;
    }
    return age >= 18 ? null : { underaged: true };
}

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';

import { ConfirmationService, MessageService } from 'primeng/api';
import { DataService } from '../../services/data.service';
import { Ticket } from '../../models/ticket.model';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        AvatarModule,
        DividerModule,
        TagModule,
        InputTextModule,
        InputNumberModule,
        DatePickerModule,
        ConfirmDialogModule,
        ToastModule,
        TableModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './user.html',
    styleUrl: './user.css'
})
export class UserComponent implements OnInit {
    profileForm!: FormGroup;

    // Datos mockeados del perfil
    userProfile = {
        fullName: 'Samuel de Santiago',
        username: 'samuelds',
        email: 'admin@erp.com',
        address: 'Av. Universidad 123, Ciudad de México',
        phone: '5512345678',
        dob: new Date(1995, 9, 15),
        permissions: ['group:add', 'group:edit', 'group:delete', 'user:crud', 'ticket:create', 'ticket:edit'],
        status: 'Activo',
        skills: ['Angular', 'TypeScript', 'Gestión de Proyectos', 'Base de Datos']
    };

    // FASE 4: Métricas de Carga de Trabajo
    assignedTickets: Ticket[] = [];

    get ticketsOpen() { return this.assignedTickets.filter(t => t.status === 'Pendiente').length; }
    get ticketsInProgress() { return this.assignedTickets.filter(t => t.status === 'En Progreso').length; }
    get ticketsDone() { return this.assignedTickets.filter(t => t.status === 'Finalizado').length; }

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private router: Router,
        private dataService: DataService
    ) { }

    ngOnInit() {
        this.profileForm = this.fb.group({
            fullName: [this.userProfile.fullName, [Validators.required, Validators.minLength(3)]],
            username: [this.userProfile.username, [Validators.required, Validators.minLength(4)]],
            email: [this.userProfile.email, [Validators.required, Validators.email]],
            phone: [this.userProfile.phone, [Validators.required, Validators.pattern('^[0-9]{10}$')]],
            address: [this.userProfile.address, Validators.required],
            dob: [this.userProfile.dob, [Validators.required, ageValidator]]
        });

        // FASE 4: Cargar tickets
        this.dataService.getTicketsByUserEmail(this.userProfile.email).subscribe(tickets => {
            this.assignedTickets = tickets;
        });
    }

    saveChanges() {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        // Simular actualización
        this.userProfile = {
            ...this.userProfile,
            ...this.profileForm.value
        };

        this.messageService.add({ severity: 'success', summary: 'Perfil Actualizado', detail: 'Tus datos han sido guardados correctamente.', life: 3000 });
    }

    deleteAccount() {
        this.confirmationService.confirm({
            message: '¿Estás completamente seguro de que deseas dar de baja tu cuenta? Esta acción es irreversible y perderás acceso a todos los datos del sistema.',
            header: 'Advertencia Crítica: Dar de baja cuenta',
            icon: 'pi pi-exclamation-circle',
            acceptLabel: 'Sí, dar de baja',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.messageService.add({ severity: 'error', summary: 'Cuenta Eliminada', detail: 'Redirigiendo al login...', life: 2000 });
                // Simulate delay before redirecting
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 1500);
            }
        });
    }
}
