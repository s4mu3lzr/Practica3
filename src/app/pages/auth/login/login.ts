import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SecurityService } from '../../../security/security'; // <-- ¡SIN EL .service!

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
    private securityService: SecurityService
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

    if (this.securityService.login(email, password)) {
      this.messageService.add({ severity: 'success', summary: 'Bienvenido', detail: 'Acceso autorizado' });

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1000);

    } else {
      this.messageService.add({ severity: 'error', summary: 'Acceso Denegado', detail: 'Credenciales incorrectas' });
    }
  }
}