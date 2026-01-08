import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EquipamentosPageRoutingModule } from './equipamentos-routing.module';

import { EquipamentosPage } from './equipamentos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EquipamentosPageRoutingModule
  ],
  declarations: [EquipamentosPage]
})
export class EquipamentosPageModule {}
