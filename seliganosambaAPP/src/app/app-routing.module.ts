import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';

import { LoginPage } from './pages/login/login.page';
import { BiografiaPage } from './pages/biografia/biografia.page';
import { HomePage } from './home/home.page';

const routes: Routes = [
  // Públicas
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },

  { path: 'login', component: LoginPage },
  { path: 'biografia', component: BiografiaPage },
  
  // Rota de Equipamentos (DEVE VIR ANTES DO CATCH-ALL)
  {
    path: 'equipamentos',
    loadChildren: () => import('./pages/equipamentos/equipamentos.module').then(m => m.EquipamentosPageModule),
    canActivate: [AuthGuard], // Adicione os guards necessários
    data: { expectedRoles: ['PRODUTOR', 'ADMIN'] } // Apenas produtor/admin pode acessar
  },

    {
    path: 'cadastro',
    loadChildren: () => import('./pages/cadastro/cadastro.module').then( m => m.CadastroPageModule)
  },
  
  // Admin
  { 
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN'] }
  },
  
  // Dashboard Produtor
  { 
    path: 'produtor', 
    loadChildren: () => import('./pages/dashboard-produtor/dashboard-produtor.module').then(m => m.DashboardProdutorPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['PRODUTOR'] }
  },
  
  // Área do Contratante
  { 
    path: 'contratante', 
    loadChildren: () => import('./pages/contratante/contratante.module').then(m => m.ContratantePageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['CONTRATANTE'] }
  },
  
  // Dashboard Músico
  { 
    path: 'musico', 
    loadChildren: () => import('./pages/dashboard-musico/dashboard-musico.module').then(m => m.DashboardMusicoPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['MUSICO'] }
  },
  
  // Redireciona para home se rota não encontrada (DEVE SER A ÚLTIMA ROTA)
  { path: '**', redirectTo: 'home' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }