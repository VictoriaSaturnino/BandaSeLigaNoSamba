import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardContratantePage } from './dashboard-contratante.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardContratantePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardContratantePageRoutingModule {}