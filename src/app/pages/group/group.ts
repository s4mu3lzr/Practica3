import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { ConfirmationService, MessageService } from 'primeng/api';
import { DataService } from '../../services/data.service';
import { SecurityService } from '../../security/security';
import { Group } from '../../models/group.model';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-group',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        TableModule,
        DialogModule,
        ConfirmDialogModule,
        ToastModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        ToolbarModule,
        TagModule,
        SelectModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './group.html',
    styleUrl: './group.css'
})
export class GroupComponent implements OnInit {
    groups: Group[] = [];
    allUsers: User[] = [];
    nivelOptions = ['Básico', 'Intermedio', 'Avanzado'];

    groupDialog: boolean = false;
    groupForm: FormGroup;
    editingGroup: Group | null = null;

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private dataService: DataService,
        public securityService: SecurityService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        this.groupForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            nivel: ['Básico', Validators.required]
        });
    }

    ngOnInit() {
        this.dataService.getUsers().subscribe(u => {
            this.allUsers = u;
            this.cdr.markForCheck();
        });
        this.loadGroups();
    }

    loadGroups() {
        this.dataService.getGroups().subscribe(g => {
            this.groups = g;
            this.cdr.markForCheck();
        });
    }

    openNew() {
        this.editingGroup = null;
        this.groupForm.reset();
        this.groupDialog = true;
    }

    editGroup(group: Group) {
        this.editingGroup = { ...group };
        this.groupForm.patchValue(this.editingGroup);
        this.groupDialog = true;
    }

    deleteGroup(group: Group) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que deseas eliminar el grupo "${group.name}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.dataService.deleteGroup(group.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo eliminado', life: 3000 });
            }
        });
    }

    hideDialog() {
        this.groupDialog = false;
    }

    saveGroup() {
        if (this.groupForm.invalid) {
            this.groupForm.markAllAsTouched();
            return;
        }

        const formValue = this.groupForm.value;

        if (this.editingGroup?.id) {
            // Update
            const updatedGroup = { ...this.editingGroup, ...formValue };
            this.dataService.updateGroup(updatedGroup);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo actualizado', life: 3000 });
        } else {
            // Create
            const newGroup: Group = {
                id: this.createId(),
                name: formValue.name,
                description: formValue.description,
                nivel: formValue.nivel,
                autor: this.securityService.getCurrentUser()?.name || 'Sistema',
                membersCount: 0,
                memberIds: []
            };
            this.dataService.addGroup(newGroup);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo creado', life: 3000 });
        }

        this.groupDialog = false;
    }

    createId(): string {
        return Math.random().toString(36).substring(2, 9);
    }

    getAuthorName(authorId: string): string {
        if (!authorId || authorId === 'Sistema') return 'Sistema';
        const user = this.allUsers.find(u => u.id === authorId);
        return user ? user.name : authorId.substring(0, 8) + '...';
    }
}
