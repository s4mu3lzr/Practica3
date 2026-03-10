import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { Ticket, TicketStatus } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private users: User[] = [
        { id: '1', name: 'Alce Ruiz', email: 'alce@demo.com', permissions: ['group:add', 'group:edit', 'group:delete', 'user:crud', 'ticket:create', 'ticket:edit'] },
        { id: '2', name: 'Maria Lopez', email: 'maria@demo.com', permissions: ['ticket:create', 'ticket:edit'] },
        { id: '3', name: 'Juan Perez', email: 'juan@demo.com', permissions: ['ticket:create'] }
    ];

    private groups: Group[] = [
        { id: 'g1', name: 'IT Support', description: 'Technical support team', nivel: 'Avanzado', autor: 'Alce Ruiz', membersCount: 2, memberIds: ['1', '2'] },
        { id: 'g2', name: 'Marketing', description: 'Marketing operations', nivel: 'Intermedio', autor: 'Alce Ruiz', membersCount: 1, memberIds: ['1'] }
    ];

    private tickets: Ticket[] = [
        {
            id: 't1',
            groupId: 'g1',
            title: 'Fix Login Bug',
            description: 'Users cannot log in with AD credentials',
            status: 'Pendiente',
            creatorId: '1',
            assignedTo: 'alce@demo.com',
            priority: 'Alta',
            creationDate: new Date(),
            dueDate: new Date(new Date().getTime() + 86400000), // tomorrow
            comments: '',
            history: []
        },
        {
            id: 't2',
            groupId: 'g1',
            title: 'Update Server OS',
            description: 'Update Linux to 22.04',
            status: 'En Progreso',
            creatorId: '2',
            assignedTo: 'maria@demo.com',
            priority: 'Media',
            creationDate: new Date(),
            dueDate: new Date(new Date().getTime() + 86400000 * 3), // 3 days
            comments: '',
            history: []
        }
    ];

    private usersSubject = new BehaviorSubject<User[]>(this.users);
    private groupsSubject = new BehaviorSubject<Group[]>(this.groups);
    private ticketsSubject = new BehaviorSubject<Ticket[]>(this.tickets);

    constructor() { }

    getUsers(): Observable<User[]> {
        return this.usersSubject.asObservable();
    }

    addUser(user: User) {
        this.users.push(user);
        this.usersSubject.next([...this.users]);
    }

    updateUser(user: User) {
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx > -1) {
            this.users[idx] = user;
            this.usersSubject.next([...this.users]);
        }
    }

    deleteUser(id: string) {
        this.users = this.users.filter(u => u.id !== id);
        this.usersSubject.next([...this.users]);
    }

    getGroups(): Observable<Group[]> {
        return this.groupsSubject.asObservable();
    }

    addGroup(group: Group) {
        this.groups.push(group);
        this.groupsSubject.next([...this.groups]);
    }

    updateGroup(group: Group) {
        const idx = this.groups.findIndex(g => g.id === group.id);
        if (idx > -1) {
            this.groups[idx] = group;
            this.groupsSubject.next([...this.groups]);
        }
    }

    deleteGroup(groupId: string) {
        this.groups = this.groups.filter(g => g.id !== groupId);
        this.groupsSubject.next([...this.groups]);
    }

    getTickets(): Observable<Ticket[]> {
        return this.ticketsSubject.asObservable();
    }

    getGroupById(id: string): Group | undefined {
        return this.groups.find(g => g.id === id);
    }

    getTicketsByGroup(groupId: string): Observable<Ticket[]> {
        const filtered = this.tickets.filter(t => t.groupId === groupId);
        return new BehaviorSubject<Ticket[]>(filtered).asObservable();
    }

    getGroupMembers(groupId: string): User[] {
        const group = this.getGroupById(groupId);
        if (!group || !group.memberIds) return [];
        return this.users.filter(u => group.memberIds?.includes(u.id));
    }

    addMemberToGroup(groupId: string, email: string): { success: boolean, message: string } {
        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return { success: false, message: 'Usuario no encontrado en el sistema.' };
        }

        const group = this.getGroupById(groupId);
        if (!group) {
            return { success: false, message: 'Grupo no existe.' };
        }

        if (!group.memberIds) group.memberIds = [];
        if (group.memberIds.includes(user.id)) {
            return { success: false, message: 'El usuario ya es integrante de este grupo.' };
        }

        group.memberIds.push(user.id);
        group.membersCount = group.memberIds.length;
        this.groupsSubject.next([...this.groups]);
        return { success: true, message: 'Usuario añadido exitosamente.' };
    }

    removeMemberFromGroup(groupId: string, userId: string): boolean {
        const group = this.getGroupById(groupId);
        if (group && group.memberIds) {
            group.memberIds = group.memberIds.filter(id => id !== userId);
            group.membersCount = group.memberIds.length;
            this.groupsSubject.next([...this.groups]);
            return true;
        }
        return false;
    }

    addTicket(ticket: Ticket) {
        this.tickets.push(ticket);
        this.ticketsSubject.next([...this.tickets]);
    }

    // FASE 4: Traer todos los tickets asignados globalmente a un correo
    getTicketsByUserEmail(email: string | undefined): Observable<Ticket[]> {
        if (!email) return new BehaviorSubject<Ticket[]>([]).asObservable();
        const filtered = this.tickets.filter(t => t.assignedTo === email);
        return new BehaviorSubject<Ticket[]>(filtered).asObservable();
    }

    updateTicket(ticket: Ticket) {
        const idx = this.tickets.findIndex(t => t.id === ticket.id);
        if (idx > -1) {
            this.tickets[idx] = ticket;
            this.ticketsSubject.next([...this.tickets]);
        }
    }

    getDashboardKPIs(): { total: number, pendiente: number, enProgreso: number, revision: number } {
        return {
            total: this.tickets.length,
            pendiente: this.tickets.filter(t => t.status === 'Pendiente').length,
            enProgreso: this.tickets.filter(t => t.status === 'En Progreso').length,
            revision: this.tickets.filter(t => t.status === 'Revisión').length
        };
    }
}
