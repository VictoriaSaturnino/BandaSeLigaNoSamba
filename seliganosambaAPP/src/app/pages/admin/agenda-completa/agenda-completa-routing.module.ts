import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AgendaCompletaPage } from './agenda-completa.page';

const routes: Routes = [
  {
    path: '',
    component: AgendaCompletaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AgendaCompletaPageRoutingModule {}
