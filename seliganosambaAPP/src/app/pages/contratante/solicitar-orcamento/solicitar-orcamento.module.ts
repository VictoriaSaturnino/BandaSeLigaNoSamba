import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ← Adicione ReactiveFormsModule
import { IonicModule } from '@ionic/angular';
import { SolicitarOrcamentoPageRoutingModule } from './solicitar-orcamento-routing.module';
import { SolicitarOrcamentoPage } from './solicitar-orcamento.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // ← ADICIONE ESTA LINHA
    IonicModule,
    SolicitarOrcamentoPageRoutingModule
  ],
  declarations: [SolicitarOrcamentoPage]
})
export class SolicitarOrcamentoPageModule {}