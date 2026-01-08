import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AgendaCompletaPageRoutingModule } from './agenda-completa-routing.module';

import { AgendaCompletaPage } from './agenda-completa.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AgendaCompletaPageRoutingModule
  ],
  declarations: [AgendaCompletaPage]
})
export class AgendaCompletaPageModule {}
