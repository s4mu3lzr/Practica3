import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { Ticket, TicketStatus } from '../models/ticket.model';
import { SecurityService } from '../security/security';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly API = 'http://localhost:4000';

    private usersSubject = new BehaviorSubject<User[]>([]);
    private groupsSubject = new BehaviorSubject<Group[]>([]);
    private ticketsSubject = new BehaviorSubject<Ticket[]>([]);

    private usersLoaded = false;
    private groupsLoaded = false;
    private ticketsLoaded = false;

    constructor(private http: HttpClient, private securityService: SecurityService) {
        // Solo carga usuarios y grupos al inicio (no todos los tickets — muy costoso)
        this.loadUsers();
        this.loadGroups();

        // Polling constante para mantener permisos/usuarios frescos si otro admin los cambia
        if (typeof window !== 'undefined') {
            setInterval(() => {
                // Forzar recarga silenciosa en segundo plano
                this.usersLoaded = false;
                this.loadUsers();
            }, 10000); // Cada 10 segundos actualiza permisos
        }
    }

    private getHeaders() {
        const token = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('token') : null;
        return {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${token || ''}`
            })
        };
    }

    // ─────────────────────────────────────────────────────────
    // USUARIOS
    // ─────────────────────────────────────────────────────────
    loadUsers() {
        if (this.usersLoaded) return;
        this.usersLoaded = true;
        this.http.get<{ statusCode: number, data: any[] }>(`${this.API}/api/users`, this.getHeaders())
            .subscribe({
                next: (res) => {
                    const users = (res.data || []).map((u: any) => ({
                        id: u.id,
                        name: u.name || u.nombre_completo || u.email,
                        email: u.email,
                        permissions: Array.isArray(u.permissions) ? u.permissions : []
                    }));
                    // Actualizar permisos en vivo para el usuario activo si está en la sesión
                    const currentUser = this.securityService.getCurrentUser();
                    if (currentUser) {
                        const activeUserInList = users.find((u: User) => u.email === currentUser.email);
                        if (activeUserInList) {
                            this.securityService.updateActivePermissions(activeUserInList.permissions);
                        }
                    }

                    this.usersSubject.next(users);
                },
                error: (err) => { this.usersLoaded = false; }
            });
    }

    getUsers(): Observable<User[]> {
        return this.usersSubject.asObservable();
    }

    /** Fuerza recarga desde servidor */
    forceReloadUsers() {
        this.usersLoaded = false;
        this.loadUsers();
    }

    addUser(user: any) {
        // POST /api/users/add con nombre_completo, email, username, password, permissions
        const payload = {
            nombre_completo: user.name,
            email: user.email,
            username: user.username || user.email.split('@')[0],
            password: user.password || 'TempPass1234!',
            permissions: user.permissions || []
        };
        return this.http.post<any>(`${this.API}/api/users/add`, payload, this.getHeaders())
            .subscribe({
                next: () => this.loadUsers(),
                error: (err) => console.error('Error al agregar usuario:', err)
            });
    }

    addUserObservable(user: any): Observable<any> {
        const payload = {
            nombre_completo: user.name,
            email: user.email,
            username: user.username || user.email.split('@')[0],
            password: user.password || 'TempPass1234!',
            permissions: user.permissions || []
        };
        return this.http.post<any>(`${this.API}/api/users/add`, payload, this.getHeaders());
    }

    updateUser(user: User) {
        return this.http.put<any>(`${this.API}/api/users/${user.id}`, {
            name: user.name,
            email: user.email,
            permissions: user.permissions
        }, this.getHeaders())
            .subscribe({
                next: () => this.loadUsers(),
                error: (err) => console.error('Error al actualizar usuario:', err)
            });
    }

    updateUserObservable(user: User): Observable<any> {
        return this.http.put<any>(`${this.API}/api/users/${user.id}`, {
            name: user.name,
            email: user.email,
            permissions: user.permissions
        }, this.getHeaders());
    }

    deleteUser(id: string) {
        this.http.delete(`${this.API}/api/users/${id}`, this.getHeaders())
            .subscribe({
                next: () => this.loadUsers(),
                error: (err) => console.error('Error al eliminar usuario:', err)
            });
    }

    // ─────────────────────────────────────────────────────────
    // GRUPOS
    // ─────────────────────────────────────────────────────────
    loadGroups() {
        if (this.groupsLoaded) return;
        this.groupsLoaded = true;
        this.http.get<{ statusCode: number, data: any[] }>(`${this.API}/api/groups`, this.getHeaders())
            .subscribe({
                next: (res) => {
                    const mapped = (res.data || []).map((g: any) => ({
                        id: g.id,
                        name: g.nombre || g.name,
                        description: g.descripcion || g.description,
                        nivel: g.nivel || 'Básico',
                        autor: g.creador_id || g.autor || 'Sistema',
                        membersCount: g.membersCount || (g.memberIds ? g.memberIds.length : 0),
                        memberIds: g.memberIds || []
                    }));
                    this.groupsSubject.next(mapped);
                },
                error: (err) => { this.groupsLoaded = false; }
            });
    }

    getGroups(): Observable<Group[]> {
        return this.groupsSubject.asObservable();
    }

    /** Fuerza recarga desde servidor (ignora flag de cacheado) */
    forceReloadGroups() {
        this.groupsLoaded = false;
        this.loadGroups();
    }

    addGroup(group: any) {
        const currentUser = this.getCurrentUserId();
        const payload = {
            nombre: group.name,
            descripcion: group.description,
            creador_id: currentUser
        };
        this.http.post(`${this.API}/api/groups`, payload, this.getHeaders())
            .subscribe({
                next: () => this.loadGroups(),
                error: (err) => console.error('Error al agregar grupo:', err)
            });
    }

    updateGroup(group: Group) {
        this.http.put(`${this.API}/api/groups/${group.id}`, {
            nombre: group.name,
            descripcion: group.description
        }, this.getHeaders())
            .subscribe({
                next: () => this.loadGroups(),
                error: (err) => console.error('Error al actualizar grupo:', err)
            });
    }

    deleteGroup(groupId: string) {
        this.http.delete(`${this.API}/api/groups/${groupId}`, this.getHeaders())
            .subscribe({
                next: () => this.loadGroups(),
                error: (err) => console.error('Error al eliminar grupo:', err)
            });
    }

    getGroupById(id: string): Group | undefined {
        return this.groupsSubject.value.find(g => g.id === id);
    }

    getGroupMembers(groupId: string): User[] {
        const group = this.getGroupById(groupId);
        if (!group || !group.memberIds) return [];
        return this.usersSubject.value.filter(u => group.memberIds?.includes(u.id));
    }

    addMemberToGroup(groupId: string, email: string): Observable<any> {
        return this.http.post(`${this.API}/api/groups/${groupId}/members`, { email }, this.getHeaders());
    }

    removeMemberFromGroup(groupId: string, userId: string): Observable<any> {
        return this.http.delete(`${this.API}/api/groups/${groupId}/members/${userId}`, this.getHeaders());
    }

    // ─────────────────────────────────────────────────────────
    // TICKETS
    // ─────────────────────────────────────────────────────────
    loadTickets() {
        // Resetear flag para permitir re-carga explícita
        this.ticketsLoaded = false;
        this.http.get<{ statusCode: number, data: any[] }>(`${this.API}/api/tickets`, this.getHeaders())
            .subscribe({
                next: (res) => {
                    const mapped = this.mapTickets(res.data || []);
                    this.ticketsSubject.next(mapped);
                    this.ticketsLoaded = true;
                },
                error: (err) => {}
            });
    }

    private mapTickets(rawTickets: any[]): Ticket[] {
        return rawTickets.map((t: any) => ({
            id: t.id,
            groupId: t.grupo_id,
            title: t.titulo,
            description: t.descripcion,
            // Normalizar estado: puede venir como texto del join o como nombre
            status: (t.estado_nombre || t.estado_id || 'Pendiente') as TicketStatus,
            creatorId: t.autor_id,
            assignedTo: t.asignado_id || t.assigned_to || '',
            priority: t.prioridad_nombre || t.prioridad_id || 'Media',
            creationDate: new Date(t.created_at || t.creado_en || Date.now()),
            dueDate: t.due_date || t.fecha_final ? new Date(t.due_date || t.fecha_final) : new Date(Date.now() + 86400000),
            comments: t.comments || '',
            history: t.history || []
        }));
    }

    getTickets(): Observable<Ticket[]> {
        return this.ticketsSubject.asObservable();
    }

    getTicketsByGroup(groupId: string): Observable<Ticket[]> {
        // Fetch tickets for a specific group
        return new Observable(observer => {
            this.http.get<{ statusCode: number, data: any[] }>(`${this.API}/api/tickets/group/${groupId}`, this.getHeaders())
                .subscribe({
                    next: (res) => {
                        const mapped = this.mapTickets(res.data || []);
                        observer.next(mapped);
                        observer.complete();
                    },
                    error: (err) => {
                        // Fallback: filtrar del cache local
                        const filtered = this.ticketsSubject.value.filter(t => t.groupId === groupId);
                        observer.next(filtered);
                        observer.complete();
                    }
                });
        });
    }

    getTicketsByUserEmail(email: string | undefined): Observable<Ticket[]> {
        if (!email) return new BehaviorSubject<Ticket[]>([]).asObservable();
        const filtered = this.ticketsSubject.value.filter(t => t.assignedTo === email);
        return new BehaviorSubject<Ticket[]>(filtered).asObservable();
    }

    addTicket(ticket: Ticket) {
        // Mapear el modelo del frontend al schema de la BD
        const currentUserId = this.getCurrentUserId();
        const payload: any = {
            titulo: ticket.title,
            descripcion: ticket.description,
            grupo_id: ticket.groupId,
            estado_id: ticket.status || 'Pendiente',     // tickets-service resolverá el UUID
            prioridad_id: ticket.priority || 'Media',     // tickets-service resolverá el UUID
            autor_id: ticket.creatorId || currentUserId,
            asignado_id: ticket.assignedTo || null,
            fecha_final: ticket.dueDate ? new Date(ticket.dueDate).toISOString() : null
        };

        this.http.post(`${this.API}/api/tickets`, payload, this.getHeaders())
            .subscribe({
                next: () => this.loadTickets(),
                error: (err) => console.error('Error al agregar ticket:', err)
            });
    }

    updateTicket(ticket: Ticket) {
        const payload: any = {
            titulo: ticket.title,
            descripcion: ticket.description,
            estado_id: ticket.status,     // tickets-service resolverá UUID
            prioridad_id: ticket.priority, // tickets-service resolverá UUID
            asignado_id: ticket.assignedTo || null,
            fecha_final: ticket.dueDate ? new Date(ticket.dueDate).toISOString() : null
        };

        this.http.put(`${this.API}/api/tickets/${ticket.id}`, payload, this.getHeaders())
            .subscribe({
                next: () => this.loadTickets(),
                error: (err) => console.error('Error al actualizar ticket:', err)
            });
    }

    getDashboardKPIs(userEmail?: string): { total: number, pendiente: number, enProgreso: number, revision: number } {
        const tickets = this.ticketsSubject.value;
        const relevantTickets = userEmail ? tickets.filter(t => t.assignedTo === userEmail) : tickets;
        return {
            total: relevantTickets.length,
            pendiente: relevantTickets.filter(t => t.status === 'Pendiente').length,
            enProgreso: relevantTickets.filter(t => t.status === 'En Progreso').length,
            revision: relevantTickets.filter(t => t.status === 'Revisión').length
        };
    }

    private getCurrentUserId(): string {
        if (typeof window !== 'undefined' && window.localStorage) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return payload.id || '';
                } catch (e) { }
            }
        }
        return '';
    }
}
