import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardAdminPage } from './dashboard-admin/dashboard-admin.page';
import { UsuariosPage } from './usuarios/usuarios.page';
import { ContratosPage } from './contratos/contratos.page';
import { AgendaCompletaPage } from './agenda-completa/agenda-completa.page';
import { OrcamentosPage } from './orcamentos/orcamentos.page';
import { EquipamentosPage } from './equipamentos/equipamentos.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardAdminPage
  },
  {
    path: 'usuarios',
    component: UsuariosPage
  },
  {
    path: 'contratos',
    component: ContratosPage
  },
  {
    path: 'agenda-completa', // ← ALTERADO DE 'agenda' PARA 'agenda-completa'
    component: AgendaCompletaPage
  },
  {
    path: 'orcamentos',
    component: OrcamentosPage
  },
  {
    path: 'equipamentos',
    component: EquipamentosPage
  },  {
    path: 'ensaios',
    loadChildren: () => import('./ensaios/ensaios.module').then( m => m.EnsaiosPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }