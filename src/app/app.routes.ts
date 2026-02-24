import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page';
import { LoginComponent } from './pages/auth/login/login';       // <-- Corregido
import { RegisterComponent } from './pages/auth/register/register'; // <-- Corregido

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent }
];