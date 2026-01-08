import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrcamentosPageRoutingModule } from './orcamentos-routing.module';

import { OrcamentosPage } from './orcamentos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrcamentosPageRoutingModule
  ],
  declarations: [OrcamentosPage]
})
export class OrcamentosPageModule {}
