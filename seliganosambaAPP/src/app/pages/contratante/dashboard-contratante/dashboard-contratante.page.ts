import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService, Agendamento, Contrato, Usuario } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

interface Atividade {
  descricao: string;
  tempo: string;
  tipo: string;
  icone: string;
}

@Component({
  selector: 'app-dashboard-contratante',
  templateUrl: './dashboard-contratante.page.html',
  styleUrls: ['./dashboard-contratante.page.scss'],
  standalone: false
})
export class DashboardContratantePage implements OnInit {
  usuario: Usuario | null = null;
  
  estatisticas = {
    totalAgendamentos: 0,
    totalContratos: 0,
    agendamentosAprovados: 0,
    agendamentosPendentes: 0,
    valorTotalContratos: 0
  };
  
  agendamentos: Agendamento[] = [];
  contratos: Contrato[] = [];
  contratosPendentes: Contrato[] = [];
  proximosEventos: Agendamento[] = [];
  atividadesRecentes: Atividade[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarUsuario();
    this.carregarDados();
  }

  carregarUsuario() {
    this.usuario = this.authService.currentUserValue;
  }

  async carregarDados() {
    if (!this.usuario?.idUsuario) return;
    
    try {
      // Carrega agendamentos do usuário
      const agendamentos = await this.apiService.getAgendamentosByUsuario(this.usuario.idUsuario).toPromise();
      this.agendamentos = agendamentos || [];
      
      // Carrega contratos
      await this.carregarContratos();
      
      // Calcula estatísticas
      this.calcularEstatisticas();
      
      // Filtra próximos eventos (próximos 30 dias)
      this.filtrarProximosEventos();
      
      // Filtra contratos pendentes
      this.filtrarContratosPendentes();
      
      // Carrega atividades recentes
      this.carregarAtividadesRecentes();
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  }

  async carregarContratos() {
    if (!this.usuario?.idUsuario) return;
    
    try {
      const contratosPromises = this.agendamentos.map(agendamento => 
        this.apiService.getContratoByAgendamento(agendamento.idAgendamento!).toPromise()
      );
      
      const contratosResultados = await Promise.all(contratosPromises);
      this.contratos = contratosResultados.filter(contrato => contrato !== null && contrato !== undefined) as Contrato[];
      
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    }
  }

  calcularEstatisticas() {
    this.estatisticas.totalAgendamentos = this.agendamentos.length;
    this.estatisticas.totalContratos = this.contratos.length;
    
    this.estatisticas.agendamentosAprovados = this.agendamentos.filter(a => a.aprovado === true).length;
    this.estatisticas.agendamentosPendentes = this.agendamentos.filter(a => 
      a.aprovado === false || a.aprovado === null
    ).length;
    
    this.estatisticas.valorTotalContratos = this.contratos.reduce((total, c) => total + (c.valor || 0), 0);
  }

  filtrarProximosEventos() {
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);
    
    this.proximosEventos = this.agendamentos
      .filter(agendamento => {
        const dataEvento = new Date(agendamento.dataEvento);
        return dataEvento >= hoje && dataEvento <= trintaDias;
      })
      .sort((a, b) => new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime())
      .slice(0, 3); // Limita a 3 eventos
  }

  filtrarContratosPendentes() {
    this.contratosPendentes = this.contratos.filter(contrato => 
      !contrato.assinaturaContratante
    ).slice(0, 2); // Limita a 2 contratos
  }

  carregarAtividadesRecentes() {
    this.atividadesRecentes = [
      {
        descricao: this.agendamentos.length > 0 
          ? `Evento "${this.agendamentos[0].nomeEvento}" agendado` 
          : 'Bem-vindo ao Se Liga No Samba!',
        tempo: 'Hoje',
        tipo: 'primary',
        icone: 'calendar-outline'
      },
      {
        descricao: this.contratos.length > 0 
          ? `Contrato #${this.contratos[0].idContrato} criado` 
          : 'Nenhum contrato ainda',
        tempo: this.contratos.length > 0 ? 'Ontem' : '--',
        tipo: 'secondary',
        icone: 'document-text-outline'
      }
    ];
  }

  // Métodos auxiliares
  getNomeEvento(idAgendamento: number): string {
    const agendamento = this.agendamentos.find(a => a.idAgendamento === idAgendamento);
    return agendamento?.nomeEvento || 'Evento não encontrado';
  }

  getDiaMes(data: string): string {
    const date = new Date(data);
    return date.getDate().toString().padStart(2, '0');
  }

  getMes(data: string): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const date = new Date(data);
    return meses[date.getMonth()];
  }

  formatarValor(valor: number | undefined): string {
    if (!valor) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // Ações
  async solicitarOrcamento() {
    this.router.navigate(['/contratante/solicitar-orcamento']);
  }

  verDetalhesEvento(evento: Agendamento) {
    const alert = this.alertController.create({
      header: evento.nomeEvento,
      subHeader: `${this.formatarData(evento.dataEvento)} - ${evento.horario}`,
      message: `
        <p><strong>Local:</strong> ${evento.rua}, ${evento.numero} - ${evento.bairro}, ${evento.cidade}</p>
        <p><strong>Convidados:</strong> ${evento.quantidadeConvidados} pessoas</p>
        <p><strong>Tipo:</strong> ${evento.tipoEvento}</p>
        <p><strong>Orçamento:</strong> ${this.formatarValor(evento.orcamento)}</p>
        <p><strong>Sonorização:</strong> ${evento.sonorizacao ? 'Sim' : 'Não'}</p>
        <p><strong>Status:</strong> ${evento.aprovado ? 'Aprovado' : 'Pendente'}</p>
      `,
      buttons: ['OK']
    });

    alert.then(alert => alert.present());
  }

  async assinarContrato(contrato: Contrato) {
    const alert = await this.alertController.create({
      header: 'Assinar Contrato',
      message: `Deseja assinar o contrato #${contrato.idContrato}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Assinar',
          handler: () => {
            this.assinarContratoConfirmado(contrato.idContrato!);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async assinarContratoConfirmado(idContrato: number) {
    try {
      await this.apiService.updateAssinaturasContrato(
        idContrato,
        true, // Mantém assinatura do produtor
        true  // Adiciona assinatura do contratante
      ).toPromise();
      
      // Recarrega os dados
      this.carregarDados();
      
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
    }
  }

  verAtividades() {
    // Navega para página de atividades ou mostra mais detalhes
    console.log('Ver todas atividades');
  }

  formatarData(data: string): string {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}