import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.page.html',
  styleUrls: ['./dashboard-admin.page.scss'],
  standalone  : false
})
export class DashboardAdminPage implements OnInit {
  usuario: any;
  estatisticas = {
    totalUsuarios: 0,
    totalAgendamentos: 0,
    totalContratos: 0,
    totalOrcamentos: 0,
    totalEquipamentos: 0
  };
  
  // Adicione o item de Ensaio no array menuItems
menuItems = [
  {
    title: 'Usuários',
    icon: 'people-outline',
    color: 'primary',
    route: '/admin/usuarios',
    count: 0,
    description: 'Gerencie todos os usuários do sistema'
  },
  {
    title: 'Contratos',
    icon: 'document-text-outline',
    color: 'secondary',
    route: '/admin/contratos',
    count: 0,
    description: 'Visualize e gerencie contratos'
  },
  {
    title: 'Agenda Completa',
    icon: 'calendar-outline',
    color: 'success',
    route: '/admin/agenda-completa',
    count: 0,
    description: 'Veja todos os agendamentos'
  },
  {
    title: 'Orçamentos',
    icon: 'cash-outline',
    color: 'warning',
    route: '/admin/orcamentos',
    count: 0,
    description: 'Gerencie propostas e orçamentos'
  },
  {
    title: 'Equipamentos',
    icon: 'hardware-chip-outline',
    color: 'danger',
    route: '/admin/equipamentos',
    count: 0,
    description: 'Controle de equipamentos'
  },
  {
    title: 'Ensaios',
    icon: 'musical-notes-outline',
    color: 'tertiary',
    route: '/admin/ensaios',
    count: 0,
    description: 'Gerencie os ensaios da banda'
  },
];


  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarUsuario();
    this.carregarEstatisticas();
  }

  carregarUsuario() {
    this.usuario = this.authService.currentUserValue;
  }

  carregarEstatisticas() {
    // Carregar total de usuários
    this.apiService.getAllUsuarios().subscribe(usuarios => {
      this.estatisticas.totalUsuarios = usuarios.length;
      this.menuItems[0].count = usuarios.length;
    });

    // Carregar total de agendamentos
    this.apiService.getAllAgendamentos().subscribe(agendamentos => {
      this.estatisticas.totalAgendamentos = agendamentos.length;
      this.menuItems[2].count = agendamentos.length;
    });

    // Carregar total de contratos
    this.apiService.getAllContratos().subscribe(contratos => {
      this.estatisticas.totalContratos = contratos.length;
      this.menuItems[1].count = contratos.length;
    });

    // Carregar total de equipamentos
    this.apiService.getAllEquipamentos().subscribe(equipamentos => {
      this.estatisticas.totalEquipamentos = equipamentos.length;
      this.menuItems[4].count = equipamentos.length;
    });
  }

  logout() {
    this.authService.logout();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  // Calcular orçamentos pendentes
  getOrcamentosPendentes(): void {
    this.apiService.getAllAgendamentos().subscribe(agendamentos => {
      const pendentes = agendamentos.filter(a => !a.aprovado);
      this.estatisticas.totalOrcamentos = pendentes.length;
      this.menuItems[3].count = pendentes.length;
    });
  }
}