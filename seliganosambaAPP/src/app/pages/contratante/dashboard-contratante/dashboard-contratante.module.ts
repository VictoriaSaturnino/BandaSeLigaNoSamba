import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ← Adicione
import { IonicModule } from '@ionic/angular';
import { DashboardContratantePageRoutingModule } from './dashboard-contratante-routing.module';
import { DashboardContratantePage } from './dashboard-contratante.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // ← ADICIONE ESTA LINHA
    IonicModule,
    DashboardContratantePageRoutingModule
  ],
  declarations: [DashboardContratantePage]
})
export class DashboardContratantePageModule {}