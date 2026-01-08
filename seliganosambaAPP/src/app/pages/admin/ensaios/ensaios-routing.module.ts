import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EnsaiosPage } from './ensaios.page';

const routes: Routes = [
  {
    path: '',
    component: EnsaiosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EnsaiosPageRoutingModule {}
