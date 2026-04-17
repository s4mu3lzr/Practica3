import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService],
  templateUrl: './login.html'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Llena todos los campos correctamente' });
      return;
    }

    const { email, password } = this.loginForm.value;

    this.http.post('http://localhost:4000/api/users/login', { email, password }).subscribe({
      next: (res: any) => {
        if (res && res.data && res.data.length > 0 && res.data[0].token) {
          localStorage.setItem('token', res.data[0].token);
          this.messageService.add({ severity: 'success', summary: 'Bienvenido', detail: 'Acceso autorizado' });
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1000);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Formato de respuesta inválido' });
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Acceso Denegado', detail: err.error?.message || 'Credenciales incorrectas' });
      }
    });
  }
}