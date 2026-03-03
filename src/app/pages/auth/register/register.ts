import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password'; // <-- Usaremos el componente PRO de password
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, ToastModule],
  providers: [MessageService],
  templateUrl: './register.html'
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      address: ['', Validators.required],
      // Validación: Solo números y 10 dígitos (ajusta el 10 según tu país)
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.maxLength(10), Validators.minLength(10)]],
      // Validación: Mayor de edad (>= 18)
      age: ['', [Validators.required, Validators.min(18)]],
      // Validación: Mínimo 10 caracteres y al menos un símbolo especial
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/) // Regex símbolos
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para comparar passwords
  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      console.log('Datos válidos:', this.registerForm.value);
      this.messageService.add({ severity: 'success', summary: 'Registro Exitoso', detail: 'Usuario creado correctamente' });
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Revisa los campos marcados en rojo' });
    }
  }
}