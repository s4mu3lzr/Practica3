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
import { PasswordModule } from 'primeng/password';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, RouterModule,
        TableModule, ButtonModule, DialogModule,
        ConfirmDialogModule, MultiSelectModule, InputTextModule, TagModule, ToastModule, PasswordModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './user-management.html',
    styleUrls: ['./user-management.css']
})
export class UserManagementComponent implements OnInit {

    users: User[] = [];
    loading: boolean = false;

    showDialog: boolean = false;
    isEditMode: boolean = false;
    userForm!: FormGroup;

    availablePermissions = [
        { label: '👥 Grupos (Ver/Crear)', value: 'group:add' },
        { label: '✏️ Grupos (Editar)', value: 'group:edit' },
        { label: '🗑️ Grupos (Eliminar)', value: 'group:delete' },
        { label: '👤 Usuarios (CRUD)', value: 'user:crud' },
        { label: '🎫 Tickets (Crear)', value: 'ticket:create' },
        { label: '📝 Tickets (Editar)', value: 'ticket:edit' }
    ];

    constructor(
        private dataService: DataService,
        public securityService: SecurityService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.userForm = this.fb.group({
            id: [''],
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            permissions: [[]]
        });
        this.loadUsers();
    }

    loadUsers() {
        this.loading = true;
        this.dataService.forceReloadUsers();
        this.dataService.getUsers().subscribe(users => {
            if (users && users.length > 0) {
                this.users = users;
                this.loading = false;
            } else if (!this.loading) {
                // Datos vacíos tras carga completa
                this.users = [];
            }
        });
        // Safety timeout: si en 8s no llegan datos, quitar spinner
        setTimeout(() => { this.loading = false; }, 8000);
    }

    openNew() {
        this.isEditMode = false;
        this.userForm.reset({ permissions: [] });
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
        this.userForm.get('password')?.updateValueAndValidity();
        this.showDialog = true;
    }

    editUser(user: User) {
        this.isEditMode = true;
        this.userForm.patchValue({
            id: user.id,
            name: user.name,
            email: user.email,
            password: '',
            permissions: user.permissions || []
        });
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
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
                setTimeout(() => this.loadUsers(), 500);
            }
        });
    }

    saveUser() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        const val = this.userForm.value;

        if (this.isEditMode) {
            const userToUpdate: User = {
                id: val.id,
                name: val.name,
                email: val.email,
                permissions: val.permissions || []
            };
            this.dataService.updateUserObservable(userToUpdate).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario y permisos actualizados.' });
                    this.showDialog = false;
                    setTimeout(() => this.loadUsers(), 500);
                },
                error: (err: any) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' });
                }
            });
        } else {
            const newUser = {
                name: val.name,
                email: val.email,
                password: val.password,
                permissions: val.permissions || []
            };
            this.dataService.addUserObservable(newUser).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Usuario registrado exitosamente.' });
                    this.showDialog = false;
                    setTimeout(() => this.loadUsers(), 500);
                },
                error: (err: any) => {
                    const msg = err.error?.data?.[0]?.error || 'Error al crear usuario';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
                }
            });
        }
    }

    getPermissionLabel(perm: string): string {
        const found = this.availablePermissions.find(p => p.value === perm);
        return found ? found.label : perm;
    }

    getPermSeverity(perm: string): 'success' | 'info' | 'warn' | 'danger' {
        if (perm.includes('delete')) return 'danger';
        if (perm.includes('crud') || perm.includes('edit')) return 'warn';
        if (perm.includes('create') || perm.includes('add')) return 'success';
        return 'info';
    }

    hideDialog() {
        this.showDialog = false;
    }
}
