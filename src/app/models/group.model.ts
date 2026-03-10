export interface Group {
    id: string;
    name: string;
    description: string;
    nivel: string;
    autor: string;
    membersCount: number; // Derived or updated
    memberIds?: string[];
}
