import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdminRoutingModule } from './admin-routing.module';

// Importar PÁGINAS do admin (não módulos)
import { DashboardAdminPage } from './dashboard-admin/dashboard-admin.page';
import { UsuariosPage } from './usuarios/usuarios.page';
import { ContratosPage } from './contratos/contratos.page';
import { AgendaCompletaPage } from './agenda-completa/agenda-completa.page';
import { OrcamentosPage } from './orcamentos/orcamentos.page';
import { EquipamentosPage } from './equipamentos/equipamentos.page';

@NgModule({
  // AQUI vão as PÁGINAS/COMPONENTES
  declarations: [
    DashboardAdminPage,
    UsuariosPage,
    ContratosPage,
    AgendaCompletaPage,
    OrcamentosPage,
    EquipamentosPage
  ],
  
  // AQUI vão os MÓDULOS importados
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }  // Este é um NgModule, NÃO um Component!