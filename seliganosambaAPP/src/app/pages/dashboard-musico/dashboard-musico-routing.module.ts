import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardMusicoPage } from './dashboard-musico.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardMusicoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardMusicoPageRoutingModule {}
