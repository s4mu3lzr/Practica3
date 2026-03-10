import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { HomeComponent } from './pages/home/home';
import { GroupComponent } from './pages/group/group';
import { GroupManageComponent } from './pages/group-manage/group-manage';
import { UserComponent } from './pages/user/user';
import { UserManagementComponent } from './pages/user-management/user-management';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },

  // --- RUTAS CON LAYOUT ---
  {
    path: 'home',
    component: MainLayoutComponent, // Primero carga el cascarón (Sidebar)
    children: [
      { path: '', component: HomeComponent } // Adentro carga el Home
    ]
  },
  {
    path: 'group',
    component: MainLayoutComponent,
    children: [
      { path: '', component: GroupComponent },
      { path: 'manage/:id', component: GroupManageComponent }
    ]
  },
  {
    path: 'user',
    component: MainLayoutComponent,
    children: [
      { path: '', component: UserComponent }
    ]
  },
  {
    path: 'admin/users',
    component: MainLayoutComponent,
    children: [
      { path: '', component: UserManagementComponent }
    ]
  }
];