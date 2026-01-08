import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContratantePage } from './contratante.page';

const routes: Routes = [
  {
    path: '',
    component: ContratantePage,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard-contratante/dashboard-contratante.module').then(m => m.DashboardContratantePageModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('./perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      {
        path: 'contratos',
        loadChildren: () => import('./contratos/contratos.module').then(m => m.ContratosPageModule)
      },
      {
        path: 'solicitar-orcamento',
        loadChildren: () => import('./solicitar-orcamento/solicitar-orcamento.module').then(m => m.SolicitarOrcamentoPageModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContratantePageRoutingModule {}