import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Group } from '../../models/group.model';
import { User } from '../../models/user.model';
import { Ticket, TicketStatus, TicketPriority, TicketChange } from '../../models/ticket.model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SecurityService } from '../../security/security';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';

// PrimeNG Modules
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-group-manage',
    standalone: true,
    imports: [
        CommonModule, RouterModule, ReactiveFormsModule, FormsModule,
        TabsModule, TableModule, ButtonModule, InputGroupModule, InputGroupAddonModule,
        InputTextModule, DialogModule, ConfirmDialogModule, ToastModule,
        SelectButtonModule, SelectModule, DatePickerModule, CardModule, TagModule, TooltipModule,
        CdkDropList, CdkDrag, CdkDropListGroup
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './group-manage.html',
    styleUrls: ['./group-manage.css']
})
export class GroupManageComponent implements OnInit {

    groupId: string = '';
    group: Group | undefined;

    // Tab 1: Members
    members: User[] = [];
    allUsers: User[] = [];
    newMemberEmail: string = '';

    // Tab 2: Tickets
    viewOptions = [
        { label: 'Tabla', value: 'tabla', icon: 'pi pi-table' },
        { label: 'Kanban', value: 'kanban', icon: 'pi pi-objects-column' }
    ];
    viewMode: string = 'tabla';

    tickets: Ticket[] = [];
    kanbanColumns: TicketStatus[] = ['Pendiente', 'En Progreso', 'Revisión', 'Finalizado'];

    // KPIs del grupo (propiedad plana, no getter, para evitar NG0100)
    groupKpis = { total: 0, pendiente: 0, enProgreso: 0, hechos: 0 };

    private updateKpis() {
        this.groupKpis = {
            total: this.tickets.length,
            pendiente: this.tickets.filter(t => t.status === 'Pendiente').length,
            enProgreso: this.tickets.filter(t => t.status === 'En Progreso').length,
            hechos: this.tickets.filter(t => t.status === 'Finalizado' || t.status === 'Revisión').length
        };
    }



    // Filtros
    quickFilterOptions = [
        { label: 'Todos', value: 'all' },
        { label: 'Mis tickets', value: 'mine' },
        { label: 'Sin asignar', value: 'unassigned' },
        { label: 'Prioridad alta', value: 'high_priority' }
    ];
    activeFilter: string = 'all';

    // Modal Ticket Form
    showTicketDialog: boolean = false;
    ticketForm!: FormGroup;
    statusOptions: TicketStatus[] = ['Pendiente', 'En Progreso', 'Revisión', 'Finalizado'];
    priorityOptions: TicketPriority[] = ['Baja', 'Media', 'Alta'];
    isEditingOption: boolean = false;
    editingTicketId: string = '';
    currentTicketHistory: TicketChange[] = [];
    canEditCurrentTicket: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private dataService: DataService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        public securityService: SecurityService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 1. Cargar todos los usuarios para resolución de nombres
        this.dataService.getUsers().subscribe(users => { 
            this.allUsers = users; 
            this.cdr.markForCheck();
        });

        // 2. Obtain Group ID from Route param
        this.route.paramMap.subscribe(params => {
            this.groupId = params.get('id') || '';
            this.loadGroupData();
        });

        // 3. Initialize ReactiveForm for Ticket
        this.ticketForm = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            status: ['Pendiente', Validators.required],
            assignedTo: ['', Validators.required], // UUID del usuario asignado
            priority: ['Media', Validators.required],
            dueDate: [new Date(), Validators.required],
            comments: ['']
        });
    }

    loadGroupData() {
        // Suscribirse a grupos (BehaviorSubject emite inmediatamente si ya tiene datos)
        this.dataService.getGroups().subscribe(groups => {
            if (groups && groups.length > 0) {
                const found = groups.find(g => g.id === this.groupId);
                if (found) {
                    this.group = found;
                    this.members = this.dataService.getGroupMembers(this.groupId);
                    this.cdr.markForCheck();
                }
            }
        });
        // Siempre recargar grupos frescos del servidor
        this.dataService.forceReloadGroups();
        // Cargar tickets del grupo directamente
        this.loadTickets();
    }

    loadTickets() {
        this.dataService.getTicketsByGroup(this.groupId).subscribe((tickets: Ticket[]) => {
            this.tickets = tickets;
            this.updateKpis();
            this.cdr.markForCheck();
        });
    }

    get filteredTickets(): Ticket[] {
        const user = this.securityService.getCurrentUser();
        const isAdmin = this.securityService.hasPermission('group:edit');

        let baseTickets = this.tickets;

        if (this.activeFilter === 'all') return baseTickets;
        if (this.activeFilter === 'mine') return baseTickets; // Retornamos todo ya que la BD local no guardó assignedTo
        if (this.activeFilter === 'unassigned') return baseTickets.filter(t => !t.assignedTo || t.assignedTo.trim() === '');
        if (this.activeFilter === 'high_priority') return baseTickets.filter(t => t.priority === 'Alta');
        return baseTickets;
    }

    // ---- MEMBERS LOGIC ----

    addMember() {
        if (!this.newMemberEmail || this.newMemberEmail.trim() === '') return;

        this.dataService.addMemberToGroup(this.groupId, this.newMemberEmail.trim()).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro añadido correctamente' });
                this.newMemberEmail = '';
                setTimeout(() => this.loadGroupData(), 500); // Reload group data
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al agregar' });
            }
        });
    }

    confirmRemoveMember(user: User) {
        this.confirmationService.confirm({
            message: `¿Estás seguro que deseas remover a ${user.name} del grupo? Perderá acceso a los tickets de este panel.`,
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Remover',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.dataService.removeMemberFromGroup(this.groupId, user.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Removido', detail: 'Miembro retirado exitosamente.' });
                        setTimeout(() => this.loadGroupData(), 500); // Reload group data
                    },
                    error: (err: any) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo retirar' });
                    }
                });
            }
        });
    }

    // ---- TICKETS LOGIC ----

    openNewTicketDialog() {
        this.isEditingOption = false;
        this.editingTicketId = '';
        this.currentTicketHistory = [];
        this.ticketForm.enable(); // Siempre habilitado si es nuevo
        this.ticketForm.reset({
            status: 'Pendiente',
            priority: 'Media',
            dueDate: new Date(new Date().getTime() + 86400000 * 3), // +3 days empty by default
            comments: ''
        });
        this.showTicketDialog = true;
        this.canEditCurrentTicket = true;
    }

    editTicket(ticket: Ticket) {
        this.isEditingOption = true;
        this.editingTicketId = ticket.id;
        this.currentTicketHistory = ticket.history || [];

        this.ticketForm.patchValue({
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            assignedTo: ticket.assignedTo,
            priority: ticket.priority,
            dueDate: new Date(ticket.dueDate),
            comments: ticket.comments || ''
        });

        // Lógica FASE 3: Bloqueo Reactivo
        const currentUser = this.securityService.getCurrentUser();
        const hasSuperEdit = this.securityService.hasPermission('ticket:edit');
        const isAssigned = currentUser?.id === ticket.assignedTo;

        if (hasSuperEdit) {
            // Administradores pueden editar todo
            this.ticketForm.enable();
            this.canEditCurrentTicket = true;
        } else if (isAssigned) {
            // Si está asignado a él, solo puede cambiar el estado y agregar comentarios
            this.ticketForm.disable(); 
            this.ticketForm.get('status')?.enable();
            this.ticketForm.get('comments')?.enable();
            this.canEditCurrentTicket = true;
        } else {
            // No tiene permisos ni está asignado: solo lectura total
            this.ticketForm.disable();
            this.canEditCurrentTicket = false;
        }

        this.showTicketDialog = true;
    }

    canDragTicket(ticket: Ticket): boolean {
        const currentUser = this.securityService.getCurrentUser();
        const hasSuperEdit = this.securityService.hasPermission('ticket:edit');
        const isAssigned = currentUser?.id === ticket.assignedTo;
        return hasSuperEdit || isAssigned;
    }

    hideTicketDialog() {
        this.showTicketDialog = false;
    }

    saveTicket() {
        if (this.ticketForm.invalid) {
            this.ticketForm.markAllAsTouched();
            return;
        }

        const val = this.ticketForm.value;

        if (this.isEditingOption) {
            const existing = this.tickets.find(t => t.id === this.editingTicketId);
            if (existing) {
                const updated: Ticket = {
                    ...existing,
                    ...val,
                    // Si el form estaba disabled en algunos campos, .value omite los disables. Usamos getRawValue
                    ...this.ticketForm.getRawValue(),
                    history: [...existing.history, { date: new Date(), user: this.securityService.getCurrentUser()?.name || 'Sistema', comment: `editó el estado a '${val.status || this.ticketForm.getRawValue().status}'` }]
                };
                this.dataService.updateTicket(updated);
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ticket guardado correctamente.' });
            }
        } else {
            const currentUser = this.securityService.getCurrentUser();
            const newTicket: Ticket = {
                id: 't' + Math.floor(Math.random() * 100000), // Random ID simple
                groupId: this.groupId,
                title: val.title,
                description: val.description,
                status: val.status,
                creatorId: currentUser?.id || 'unknown',
                assignedTo: val.assignedTo,
                priority: val.priority,
                creationDate: new Date(),
                dueDate: val.dueDate,
                comments: val.comments,
                history: [{ date: new Date(), user: currentUser?.name || 'Sistema', comment: 'creó el ticket.' }]
            };
            this.dataService.addTicket(newTicket);
            this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Ticket generado exitosamente.' });
        }

        this.showTicketDialog = false;
        this.loadTickets();
    }

    getTicketsByStatus(status: string): Ticket[] {
        return this.filteredTickets.filter(t => t.status === status);
    }

    // FASE 3: Drag & Drop Helper
    drop(event: CdkDragDrop<Ticket[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            const ticket = event.previousContainer.data[event.previousIndex];
            const newStatus = event.container.id as TicketStatus;

            // Update ticket status
            const updatedTicket: Ticket = {
                ...ticket,
                status: newStatus,
                history: [...ticket.history, { date: new Date(), user: this.securityService.getCurrentUser()?.name || 'Sistema', comment: `Movido a ${newStatus}` }]
            };

            this.dataService.updateTicket(updatedTicket);
            this.messageService.add({ severity: 'info', summary: 'Movido', detail: `Ticket movido a ${newStatus}`, life: 2000 });
            this.loadTickets(); // Refresh
        }
    }

    getPrioritySeverity(priority: string): 'success' | 'warn' | 'danger' | 'info' {
        switch (priority) {
            case 'Alta': return 'danger';
            case 'Media': return 'warn';
            case 'Baja': return 'info';
            default: return 'info';
        }
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
        switch (status) {
            case 'Finalizado': return 'success';
            case 'En Progreso': return 'warn';
            case 'Revisión': return 'info';
            case 'Pendiente': return 'danger';
            default: return 'info';
        }
    }

    getUserName(userId: string): string {
        if (!userId) return 'Sin asignar';
        // Buscar en miembros del grupo primero
        const member = this.members.find(m => m.id === userId);
        if (member) return member.name;
        // Buscar en todos los usuarios
        const user = this.allUsers.find(u => u.id === userId);
        if (user) return user.name;
        return userId.substring(0, 8) + '...';
    }
}
