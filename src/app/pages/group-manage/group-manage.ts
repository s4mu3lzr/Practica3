import { Component, OnInit } from '@angular/core';
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
    newMemberEmail: string = '';

    // Tab 2: Tickets
    viewOptions = [
        { label: 'Tabla', value: 'tabla', icon: 'pi pi-table' },
        { label: 'Kanban', value: 'kanban', icon: 'pi pi-objects-column' }
    ];
    viewMode: string = 'tabla';

    tickets: Ticket[] = [];
    kanbanColumns: TicketStatus[] = ['Pendiente', 'En Progreso', 'Revisión', 'Finalizado'];

    // FASE 5: Dashboard del Grupo (KPIs locales)
    get groupKpis() {
        const user = this.securityService.getCurrentUser();
        const isAdmin = this.securityService.hasPermission('group:edit');
        const relevantTickets = isAdmin ? this.tickets : this.tickets.filter(t => t.assignedTo === user?.email);

        return {
            total: relevantTickets.length,
            pendiente: relevantTickets.filter(t => t.status === 'Pendiente').length,
            enProgreso: relevantTickets.filter(t => t.status === 'En Progreso').length,
            hechos: relevantTickets.filter(t => t.status === 'Finalizado' || t.status === 'Revisión').length
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

    constructor(
        private route: ActivatedRoute,
        private dataService: DataService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        public securityService: SecurityService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // 1. Obtain Group ID from Route param
        this.route.paramMap.subscribe(params => {
            this.groupId = params.get('id') || '';
            this.loadGroupData();
        });

        // 2. Initialize ReactiveForm for Ticket
        this.ticketForm = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            status: ['Pendiente', Validators.required],
            assignedTo: ['', Validators.required], // Holds Email or User ID
            priority: ['Media', Validators.required],
            dueDate: [new Date(), Validators.required],
            comments: ['']
        });
    }

    loadGroupData() {
        this.group = this.dataService.getGroupById(this.groupId);
        if (this.group) {
            this.members = this.dataService.getGroupMembers(this.groupId);
            this.loadTickets();
        }
    }

    loadTickets() {
        this.dataService.getTicketsByGroup(this.groupId).subscribe((tickets: Ticket[]) => {
            this.tickets = tickets;
        });
    }

    get filteredTickets(): Ticket[] {
        const user = this.securityService.getCurrentUser();
        const isAdmin = this.securityService.hasPermission('group:edit');

        let baseTickets = this.tickets;
        if (!isAdmin) {
            baseTickets = this.tickets.filter(t => t.assignedTo === user?.email);
        }

        if (this.activeFilter === 'all') return baseTickets;
        if (this.activeFilter === 'mine') return baseTickets.filter(t => t.assignedTo === user?.email);
        if (this.activeFilter === 'unassigned') return baseTickets.filter(t => !t.assignedTo || t.assignedTo.trim() === '');
        if (this.activeFilter === 'high_priority') return baseTickets.filter(t => t.priority === 'Alta');
        return baseTickets;
    }

    // ---- MEMBERS LOGIC ----

    addMember() {
        if (!this.newMemberEmail || this.newMemberEmail.trim() === '') return;

        const result = this.dataService.addMemberToGroup(this.groupId, this.newMemberEmail.trim());

        if (result.success) {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: result.message });
            this.newMemberEmail = '';
            this.members = this.dataService.getGroupMembers(this.groupId); // Refresh local state
        } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: result.message });
        }
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
                const success = this.dataService.removeMemberFromGroup(this.groupId, user.id);
                if (success) {
                    this.messageService.add({ severity: 'success', summary: 'Removido', detail: 'Miembro retirado exitosamente.' });
                    this.members = this.dataService.getGroupMembers(this.groupId);
                }
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
        const isCreator = currentUser?.id === ticket.creatorId;

        if (hasSuperEdit || isCreator) {
            this.ticketForm.enable();
        } else {
            // Es un simple asignado o invitado sin permisos fuertes
            this.ticketForm.disable(); // Bloquea todo por defecto

            // Habilita unicamente estado (y futuros comentarios)
            this.ticketForm.get('status')?.enable();
            this.ticketForm.get('comments')?.enable();
        }

        this.showTicketDialog = true;
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
}
