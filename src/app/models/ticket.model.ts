export type TicketStatus = 'Pendiente' | 'En Progreso' | 'Revisión' | 'Finalizado';
export type TicketPriority = 'Alta' | 'Media' | 'Baja';

export interface TicketChange {
    date: Date;
    comment: string;
    user: string;
}

export interface Ticket {
    id: string;
    groupId: string;
    title: string;
    description: string;
    status: TicketStatus;
    creatorId: string;
    assignedTo: string; // UserId or Email
    priority: TicketPriority;
    creationDate: Date;
    dueDate: Date;
    comments: string;
    history: TicketChange[];
}
