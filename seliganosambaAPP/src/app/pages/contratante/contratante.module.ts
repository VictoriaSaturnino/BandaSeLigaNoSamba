import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ContratantePageRoutingModule } from './contratante-routing.module';
import { ContratantePage } from './contratante.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ContratantePageRoutingModule
  ],
  declarations: [ContratantePage]
})
export class ContratantePageModule {}