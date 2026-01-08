import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContratosPage } from './contratos.page';

const routes: Routes = [
  {
    path: '',
    component: ContratosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContratosPageRoutingModule {}
