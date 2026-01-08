import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardProdutorPageRoutingModule } from './dashboard-produtor-routing.module';

import { DashboardProdutorPage } from './dashboard-produtor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardProdutorPageRoutingModule
  ],
  declarations: [DashboardProdutorPage]
})
export class DashboardProdutorPageModule {}
