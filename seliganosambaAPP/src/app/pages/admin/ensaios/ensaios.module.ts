import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { EnsaiosPageRoutingModule } from './ensaios-routing.module';
import { EnsaiosPage } from './ensaios.page'; // Importe o componente correto

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EnsaiosPageRoutingModule
  ],
  declarations: [EnsaiosPage] // Declare o componente
})
export class EnsaiosPageModule {}