import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardProdutorPage } from './dashboard-produtor.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardProdutorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardProdutorPageRoutingModule {}
