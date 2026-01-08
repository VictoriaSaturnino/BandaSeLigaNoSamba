import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdminRoutingModule } from './admin-routing.module';

// Importar todas as páginas do admin
import { DashboardAdminPage } from './dashboard-admin/dashboard-admin.page';
import { UsuariosPage } from './usuarios/usuarios.page';
import { ContratosPage } from './contratos/contratos.page';
import { AgendaCompletaPage } from './agenda-completa/agenda-completa.page';
import { OrcamentosPage } from './orcamentos/orcamentos.page';
import { EquipamentosPage } from './equipamentos/equipamentos.page';

@NgModule({
  declarations: [
    DashboardAdminPage,
    UsuariosPage,
    ContratosPage,
    AgendaCompletaPage,
    OrcamentosPage,
    EquipamentosPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }