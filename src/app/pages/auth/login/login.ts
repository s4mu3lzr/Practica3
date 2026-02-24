import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // <-- Importante para formularios
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast'; // <-- Para las alertas
import { MessageService } from 'primeng/api'; // <-- Servicio de alertas

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService], // <-- Proveedor del servicio de mensajes
  templateUrl: './login.html'
})
export class LoginComponent { 
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private messageService: MessageService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Llena todos los campos correctamente' });
      return;
    }

    const { email, password } = this.loginForm.value;

    // --- CREDENCIALES HARDCODEADAS (QUEMADAS) ---
    if (email === 'admin@erp.com' && password === 'admin123') {
      this.messageService.add({ severity: 'success', summary: 'Bienvenido', detail: 'Credenciales correctas' });
      
      // Simulamos redirección al Dashboard después de 1 segundo
      setTimeout(() => {
        // Aquí iría this.router.navigate(['/dashboard']); cuando lo tengas
        console.log("Navegando al dashboard...");
      }, 1500);

    } else {
      this.messageService.add({ severity: 'error', summary: 'Acceso Denegado', detail: 'Correo o contraseña incorrectos' });
    }
  }
}