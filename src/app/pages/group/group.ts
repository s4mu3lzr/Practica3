import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
    selector: 'app-group',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, ProgressBarModule, FormsModule, InputNumberModule],
    templateUrl: './group.html',
    styleUrl: './group.css'
})
export class GroupComponent {
    inputNumero: number | null = null;
}
