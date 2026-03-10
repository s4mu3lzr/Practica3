import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { SecurityService } from '../../security/security';
import { User } from '../../models/user.model';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule,
        ConfirmDialogModule, MultiSelectModule, InputTextModule, TagModule, ToastModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './user-management.html',
    styleUrls: ['./user-management.css']
})
export class UserManagementComponent implements OnInit {

    users: User[] = [];

    showDialog: boolean = false;
    isEditMode: boolean = false;
    userForm!: FormGroup;

    availablePermissions = [
        { label: 'Grupos (Ver/Crear)', value: 'group:add' },
        { label: 'Grupos (Editar)', value: 'group:edit' },
        { label: 'Grupos (Eliminar)', value: 'group:delete' },
        { label: 'Usuarios (CRUD)', value: 'user:crud' },
        { label: 'Tickets (Crear)', value: 'ticket:create' },
        { label: 'Tickets (Editar)', value: 'ticket:edit' }
    ];

    constructor(
        private dataService: DataService,
        public securityService: SecurityService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.loadUsers();

        this.userForm = this.fb.group({
            id: [''],
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            permissions: [[]]
        });
    }

    loadUsers() {
        this.dataService.getUsers().subscribe(users => {
            this.users = users;
        });
    }

    openNew() {
        this.isEditMode = false;
        this.userForm.reset({
            id: 'u' + Math.floor(Math.random() * 10000),
            permissions: []
        });
        this.showDialog = true;
    }

    editUser(user: User) {
        this.isEditMode = true;
        this.userForm.patchValue({
            id: user.id,
            name: user.name,
            email: user.email,
            permissions: user.permissions || []
        });
        this.showDialog = true;
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: `¿Estás seguro que deseas eliminar a ${user.name}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.dataService.deleteUser(user.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' });
                this.loadUsers();
            }
        });
    }

    saveUser() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        const val = this.userForm.value;
        const userToSave: User = {
            id: val.id,
            name: val.name,
            email: val.email,
            permissions: val.permissions
        };

        if (this.isEditMode) {
            this.dataService.updateUser(userToSave);
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario modificado.' });
        } else {
            this.dataService.addUser(userToSave);
            this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Usuario registrado exitosamente.' });
        }

        this.showDialog = false;
        this.loadUsers();
    }

    hideDialog() {
        this.showDialog = false;
    }
}
