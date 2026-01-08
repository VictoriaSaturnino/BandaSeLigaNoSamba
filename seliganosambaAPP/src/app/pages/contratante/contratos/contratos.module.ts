import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ← Adicione
import { IonicModule } from '@ionic/angular';
import { ContratosPageRoutingModule } from './contratos-routing.module';
import { ContratosPage } from './contratos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // ← ADICIONE ESTA LINHA
    IonicModule,
    ContratosPageRoutingModule
  ],
  declarations: [ContratosPage]
})
export class ContratosPageModule {}