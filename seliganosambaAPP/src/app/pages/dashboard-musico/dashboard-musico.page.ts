import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Agendamento, Contrato, Usuario } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface DiaCalendario {
  data: Date | null;
  dia: number;
  hoje: boolean;
  temEvento: boolean;
}

@Component({
  selector: 'app-dashboard-musico',
  templateUrl: './dashboard-musico.page.html',
  styleUrls: ['./dashboard-musico.page.scss'],
  standalone: false
})
export class DashboardMusicoPage implements OnInit {
  usuario: Usuario | null = null;
  eventos: Agendamento[] = [];
  eventosFiltrados: Agendamento[] = [];
  contratos: Contrato[] = [];
  todosUsuarios: Usuario[] = [];
  loading: boolean = true;
  
  // Filtros
  filtroBusca: string = '';
  filtroAtivo: string = 'todos';
  visualizacao: string = 'calendario';
  ordenacao: string = 'data';
  
  // Calendário
  mesAtual: string = '';
  anoAtual: number = 0;
  dataAtual: Date = new Date();
  diasDoMes: DiaCalendario[] = [];
  
  // Estatísticas
  estatisticas = {
    totalEventos: 0,
    eventosEsteMes: 0,
    proximos7Dias: 0,
    receitaTotal: 0
  };
  
  // Eventos filtrados por período
  eventosHoje: Agendamento[] = [];
  eventosProximos7Dias: Agendamento[] = [];
  eventosProximoMes: Agendamento[] = [];
  
  // Modal
  eventoSelecionado: Agendamento | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarUsuario();
    this.carregarAgenda();
    this.inicializarCalendario();
  }

  async carregarUsuario() {
    this.usuario = this.authService.currentUserValue;
    
    if (!this.usuario) {
      this.mostrarToast('Faça login para acessar a agenda', 'warning');
      this.router.navigate(['/login']);
    }
  }

  async carregarAgenda() {
    this.loading = true;
    
    try {
      // Carrega todos os agendamentos aprovados
      const todosAgendamentos = await this.apiService.getAllAgendamentos().toPromise();
      
      // Filtra apenas os aprovados
      const agendamentosAprovados = (todosAgendamentos || []).filter(ag => ag.aprovado === true);
      
      // Carrega todos os contratos
      const todosContratos = await this.apiService.getAllContratos().toPromise();
      this.contratos = todosContratos || [];
      
      // Carrega todos os usuários (para dados dos contratantes)
      this.todosUsuarios = await this.apiService.getAllUsuarios().toPromise() || [];
      
      // Filtra eventos que têm contrato assinado pelo ADMIN e CONTRATANTE
      this.eventos = await this.filtrarEventosComContratoAssinado(agendamentosAprovados);
      
      // Calcula estatísticas
      this.calcularEstatisticas();
      
      // Inicializa lista filtrada
      this.eventosFiltrados = [...this.eventos];
      this.filtrarEventosPorPeriodo();
      
      // Ordena por padrão
      this.ordenarEventos();
      
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      this.mostrarToast('Erro ao carregar agenda da banda', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async filtrarEventosComContratoAssinado(agendamentos: Agendamento[]): Promise<Agendamento[]> {
    const eventosFiltrados: Agendamento[] = [];
    
    for (const agendamento of agendamentos) {
      if (!agendamento.idAgendamento) continue;
      
      try {
        // Busca contrato do agendamento
        const contrato = await this.apiService.getContratoByAgendamento(agendamento.idAgendamento).toPromise();
        
        // Verifica se o contrato existe e está assinado por ADMIN e CONTRATANTE
        if (contrato && contrato.assinaturaProdutor && contrato.assinaturaContratante) {
          eventosFiltrados.push(agendamento);
        }
      } catch (error) {
        console.error(`Erro ao buscar contrato para agendamento ${agendamento.idAgendamento}:`, error);
      }
    }
    
    return eventosFiltrados;
  }

  calcularEstatisticas() {
    const hoje = new Date();
    const fimProximos7Dias = new Date();
    fimProximos7Dias.setDate(hoje.getDate() + 7);
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    this.estatisticas.totalEventos = this.eventos.length;
    
    this.estatisticas.eventosEsteMes = this.eventos.filter(evento => {
      const dataEvento = new Date(evento.dataEvento);
      return dataEvento >= inicioMes && dataEvento <= fimMes;
    }).length;
    
    this.estatisticas.proximos7Dias = this.eventos.filter(evento => {
      const dataEvento = new Date(evento.dataEvento);
      return dataEvento >= hoje && dataEvento <= fimProximos7Dias;
    }).length;
    
    this.estatisticas.receitaTotal = this.eventos.reduce((total, evento) => {
      const contrato = this.contratos.find(c => c.idAgendamento === evento.idAgendamento);
      return total + (contrato?.valor || 0);
    }, 0);
  }

  filtrarEventosPorPeriodo() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const fimProximos7Dias = new Date();
    fimProximos7Dias.setDate(hoje.getDate() + 7);
    fimProximos7Dias.setHours(23, 59, 59, 999);
    
    const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    const fimProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
    
    this.eventosHoje = this.eventos.filter(evento => {
      const dataEvento = new Date(evento.dataEvento);
      dataEvento.setHours(0, 0, 0, 0);
      return dataEvento.getTime() === hoje.getTime();
    });
    
    this.eventosProximos7Dias = this.eventos.filter(evento => {
      const dataEvento = new Date(evento.dataEvento);
      return dataEvento >= hoje && dataEvento <= fimProximos7Dias;
    });
    
    this.eventosProximoMes = this.eventos.filter(evento => {
      const dataEvento = new Date(evento.dataEvento);
      return dataEvento >= inicioProximoMes && dataEvento <= fimProximoMes;
    });
  }

  aplicarFiltro(filtro: string) {
    this.filtroAtivo = filtro;
    this.filtroBusca = '';
    this.filtrarEventos();
  }

  filtrarEventos() {
    let eventosTemp = [...this.eventos];
    
    // Aplica filtro de período
    switch (this.filtroAtivo) {
      case 'hoje':
        eventosTemp = this.eventosHoje;
        break;
      case 'proximos7':
        eventosTemp = this.eventosProximos7Dias;
        break;
      case 'proximo-mes':
        eventosTemp = this.eventosProximoMes;
        break;
    }
    
    // Aplica filtro de busca
    if (this.filtroBusca.trim()) {
      const termo = this.filtroBusca.toLowerCase().trim();
      eventosTemp = eventosTemp.filter(evento =>
        evento.nomeEvento.toLowerCase().includes(termo) ||
        evento.cidade.toLowerCase().includes(termo) ||
        evento.bairro.toLowerCase().includes(termo) ||
        evento.tipoEvento.toLowerCase().includes(termo)
      );
    }
    
    this.eventosFiltrados = eventosTemp;
    this.ordenarEventos();
  }

  ordenarEventos() {
    this.eventosFiltrados.sort((a, b) => {
      switch (this.ordenacao) {
        case 'nome':
          return a.nomeEvento.localeCompare(b.nomeEvento);
        case 'cidade':
          return a.cidade.localeCompare(b.cidade);
        default: // 'data'
          const dataA = new Date(a.dataEvento).getTime();
          const dataB = new Date(b.dataEvento).getTime();
          return dataA - dataB; // Mais antigo primeiro
      }
    });
  }

  // Métodos do calendário
  inicializarCalendario() {
    this.atualizarCalendario();
  }

  atualizarCalendario() {
    const mes = this.dataAtual.getMonth();
    const ano = this.dataAtual.getFullYear();
    
    // Nome do mês
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    this.mesAtual = meses[mes];
    this.anoAtual = ano;
    
    // Primeiro dia do mês
    const primeiroDia = new Date(ano, mes, 1);
    // Último dia do mês
    const ultimoDia = new Date(ano, mes + 1, 0);
    
    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, ...)
    const primeiroDiaSemana = primeiroDia.getDay();
    
    // Total de dias no mês
    const totalDias = ultimoDia.getDate();
    
    // Dias do mês anterior para preencher o início
    const mesAnterior = new Date(ano, mes, 0);
    const diasMesAnterior = mesAnterior.getDate();
    
    this.diasDoMes = [];
    
    // Dias do mês anterior
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      this.diasDoMes.push({
        data: null,
        dia: diasMesAnterior - i,
        hoje: false,
        temEvento: false
      });
    }
    
    // Dias do mês atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    for (let dia = 1; dia <= totalDias; dia++) {
      const dataDia = new Date(ano, mes, dia);
      const temEvento = this.verificarSeDiaTemEvento(dataDia);
      
      this.diasDoMes.push({
        data: dataDia,
        dia: dia,
        hoje: dataDia.getTime() === hoje.getTime(),
        temEvento: temEvento
      });
    }
    
    // Dias do próximo mês para completar 6 semanas (42 dias)
    const totalCelulas = 42; // 6 semanas * 7 dias
    const diasRestantes = totalCelulas - this.diasDoMes.length;
    
    for (let dia = 1; dia <= diasRestantes; dia++) {
      this.diasDoMes.push({
        data: null,
        dia: dia,
        hoje: false,
        temEvento: false
      });
    }
  }

verificarSeDiaTemEvento(data: Date): boolean {
  const diaParam = data.getDate();
  const mesParam = data.getMonth();
  const anoParam = data.getFullYear();
  
  return this.eventos.some(evento => {
    const dataEvento = new Date(evento.dataEvento);
    const diaEvento = dataEvento.getDate();
    const mesEvento = dataEvento.getMonth();
    const anoEvento = dataEvento.getFullYear();
    
    return diaEvento === diaParam && 
           mesEvento === mesParam && 
           anoEvento === anoParam;
  });
}

getEventosDoDia(data: Date | null): Agendamento[] {
  if (!data) return [];
  
  const diaParam = data.getDate();
  const mesParam = data.getMonth();
  const anoParam = data.getFullYear();
  
  return this.eventos.filter(evento => {
    const dataEvento = new Date(evento.dataEvento);
    const diaEvento = dataEvento.getDate();
    const mesEvento = dataEvento.getMonth();
    const anoEvento = dataEvento.getFullYear();
    
    return diaEvento === diaParam && 
           mesEvento === mesParam && 
           anoEvento === anoParam;
  });
}

  mesAnterior() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    this.atualizarCalendario();
  }

  mesSeguinte() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.atualizarCalendario();
  }

  irParaHoje() {
    this.dataAtual = new Date();
    this.atualizarCalendario();
  }

  alternarVisualizacao() {
    // Atualiza os eventos quando alterna a visualização
    this.filtrarEventos();
  }

  // Métodos auxiliares
  getValorContrato(evento: Agendamento): string {
    const contrato = this.contratos.find(c => c.idAgendamento === evento.idAgendamento);
    if (!contrato?.valor) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(contrato.valor);
  }

  getNomeContratante(idUsuario: number): string {
    const usuario = this.todosUsuarios.find(u => u.idUsuario === idUsuario);
    return usuario?.nome || 'Contratante não encontrado';
  }

  getEmailContratante(idUsuario: number): string {
    const usuario = this.todosUsuarios.find(u => u.idUsuario === idUsuario);
    return usuario?.email || '';
  }

  getTelefoneContratante(idUsuario: number): string {
    const usuario = this.todosUsuarios.find(u => u.idUsuario === idUsuario);
    return usuario?.telefone || '';
  }

  getDiaMes(data: string): string {
    const date = new Date(data);
    return date.getDate().toString().padStart(2, '0');
  }

  getMesAbreviado(data: string): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const date = new Date(data);
    return meses[date.getMonth()];
  }

  getDiaSemana(data: string): string {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const date = new Date(data);
    return dias[date.getDay()];
  }

  formatarDataCompleta(data: string): string {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusCor(evento: Agendamento): string {
    const hoje = new Date();
    const dataEvento = new Date(evento.dataEvento);
    
    if (dataEvento < hoje) {
      return 'medium'; // Evento passado
    } else if (this.isEventoHoje(evento)) {
      return 'warning'; // Evento hoje
    } else if (this.isEventoProximo(evento)) {
      return 'success'; // Evento próximo (próximos 7 dias)
    } else {
      return 'primary'; // Evento futuro
    }
  }

  getStatusIcon(evento: Agendamento): string {
    const hoje = new Date();
    const dataEvento = new Date(evento.dataEvento);
    
    if (dataEvento < hoje) {
      return 'checkmark-done-outline';
    } else if (this.isEventoHoje(evento)) {
      return 'alarm-outline';
    } else if (this.isEventoProximo(evento)) {
      return 'time-outline';
    } else {
      return 'calendar-outline';
    }
  }

  getStatusTexto(evento: Agendamento): string {
    const hoje = new Date();
    const dataEvento = new Date(evento.dataEvento);
    
    if (dataEvento < hoje) {
      return 'Realizado';
    } else if (this.isEventoHoje(evento)) {
      return 'Hoje';
    } else if (this.isEventoProximo(evento)) {
      return 'Próximo';
    } else {
      return 'Agendado';
    }
  }

  getCorEvento(evento: Agendamento): string {
    // Gera uma cor baseada no tipo de evento
    const cores = {
      'PUBLICO': '#3880ff',
      'PRIVADO': '#3dc2ff',
      'CASAMENTO': '#ffc409',
      'ANIVERSARIO': '#eb445a',
      'FORMATURA': '#2dd36f',
      'CORPORATIVO': '#92949c'
    };
    
    const tipo = evento.tipoEvento?.toUpperCase();
    return cores[tipo as keyof typeof cores] || '#3880ff';
  }

  isEventoHoje(evento: Agendamento): boolean {
    const hoje = new Date();
    const dataEvento = new Date(evento.dataEvento);
    
    hoje.setHours(0, 0, 0, 0);
    dataEvento.setHours(0, 0, 0, 0);
    
    return hoje.getTime() === dataEvento.getTime();
  }

  isEventoProximo(evento: Agendamento): boolean {
    const hoje = new Date();
    const dataEvento = new Date(evento.dataEvento);
    const diferencaDias = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    return diferencaDias > 0 && diferencaDias <= 7;
  }

  getDiasRestantes(evento: Agendamento): number {
    const hoje = new Date();
    const dataEvento = new Date(evento.dataEvento);
    const diferencaDias = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    return Math.max(0, diferencaDias);
  }

  // Ações
  verDetalhesEvento(evento: Agendamento) {
    this.eventoSelecionado = evento;
  }

  fecharDetalhes() {
    this.eventoSelecionado = null;
  }

// Método atualizado para ter o nome correto
verEventosDoDia(dia: DiaCalendario) {
  if (!dia.data) return;
  
  const eventosDoDia = this.getEventosDoDia(dia.data);
  
  if (eventosDoDia.length === 1) {
    this.verDetalhesEvento(eventosDoDia[0]);
  } else if (eventosDoDia.length > 1) {
    this.mostrarEventosDoDiaAlert(eventosDoDia, dia.data);
  }
}

// Método renomeado para evitar confusão
async mostrarEventosDoDiaAlert(eventos: Agendamento[], data: Date) {
  const alert = await this.alertController.create({
    header: `Eventos do dia ${data.toLocaleDateString('pt-BR')}`,
    message: `Encontrados ${eventos.length} evento(s)`,
    buttons: [
      {
        text: 'Ver Detalhes',
        handler: () => {
          // Navega para a lista com filtro por data
          this.filtroAtivo = 'todos';
          this.filtroBusca = '';
          this.visualizacao = 'lista';
          // Aqui poderia adicionar um filtro específico por data
        }
      },
      {
        text: 'Fechar',
        role: 'cancel'
      }
    ]
  });

  await alert.present();
}

  async atualizarAgenda() {
    const loading = await this.loadingController.create({
      message: 'Atualizando agenda...',
      duration: 2000
    });
    
    await loading.present();
    
    try {
      await this.carregarAgenda();
      this.mostrarToast('Agenda atualizada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error);
      this.mostrarToast('Erro ao atualizar agenda', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async confirmarPresenca(evento: Agendamento) {
    const alert = await this.alertController.create({
      header: 'Confirmar Presença',
      message: `Você confirma sua presença no evento "${evento.nomeEvento}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              // Aqui você implementaria a lógica para confirmar presença
              // Por exemplo, atualizar um campo no agendamento ou criar um registro de confirmação
              this.mostrarToast('Presença confirmada com sucesso!', 'success');
              this.fecharDetalhes();
            } catch (error) {
              console.error('Erro ao confirmar presença:', error);
              this.mostrarToast('Erro ao confirmar presença', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async mostrarToast(mensagem: string, cor: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'bottom'
    });
    
    await toast.present();
  }
}