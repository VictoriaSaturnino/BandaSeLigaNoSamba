import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardMusicoPageRoutingModule } from './dashboard-musico-routing.module';

import { DashboardMusicoPage } from './dashboard-musico.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardMusicoPageRoutingModule
  ],
  declarations: [DashboardMusicoPage]
})
export class DashboardMusicoPageModule {}
