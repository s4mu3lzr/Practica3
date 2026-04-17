import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Validador personalizado para mayores de 18 años
function ageValidator(control: AbstractControl): { [key: string]: boolean } | null {
  if (!control.value) return null;
  const dob = new Date(control.value);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18 ? null : { underaged: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, ToastModule, DatePickerModule],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private messageService: MessageService,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(10)]],
      dob: [null, [Validators.required, ageValidator]], // <-- Date Picker con validador de +18
      password: ['', [
        Validators.required, 
        Validators.minLength(10), 
        Validators.pattern(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const val = this.registerForm.value;
      const payload = {
        nombre_completo: val.fullName,
        email: val.email,
        username: val.username,
        password: val.password
      };
      
      console.log('Enviando Payload:', payload);
      this.http.post('http://localhost:4000/api/users/register', payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Registro Exitoso', detail: 'Usuario creado correctamente' });
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error de Registro', detail: err.error?.message || 'Error al registrar el usuario' });
        }
      });
    } else {
      this.registerForm.markAllAsTouched(); // Marca todos para que se pongan rojos
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Revisa los campos marcados en rojo' });
    }
  }
}