import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ContratosPageRoutingModule } from './contratos-routing.module';

import { ContratosPage } from './contratos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ContratosPageRoutingModule
  ],
  declarations: [ContratosPage]
})
export class ContratosPageModule {}
