import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SolicitarOrcamentoPage } from './solicitar-orcamento.page';

const routes: Routes = [
  {
    path: '',
    component: SolicitarOrcamentoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SolicitarOrcamentoPageRoutingModule {}
