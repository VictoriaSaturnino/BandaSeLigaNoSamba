import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Agendamento, Contrato, Usuario, Equipamento } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface DiaCalendario {
  data: Date | null;
  dia: number;
  hoje: boolean;
  temEvento: boolean;
}

@Component({
  selector: 'app-dashboard-produtor',
  templateUrl: './dashboard-produtor.page.html',
  styleUrls: ['./dashboard-produtor.page.scss'],
  standalone: false
})
export class DashboardProdutorPage implements OnInit {
  usuario: Usuario | null = null;
  
  // Para agenda
  eventos: Agendamento[] = [];
  eventosFiltrados: Agendamento[] = [];
  contratos: Contrato[] = [];
  todosUsuarios: Usuario[] = [];
  loading: boolean = true;
  
  // Para equipamentos
  equipamentos: Equipamento[] = [];
  equipamentosFiltrados: Equipamento[] = [];
  
  // Filtros agenda
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
    receitaTotal: 0,
    equipamentosTotal: 0,
    equipamentosDisponiveis: 0,
    equipamentosIndisponiveis: 0
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
    this.carregarEquipamentos();
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
      
      // Calcula estatísticas da agenda
      this.calcularEstatisticasAgenda();
      
      // Inicializa lista filtrada
      this.eventosFiltrados = [...this.eventos];
      this.filtrarEventosPorPeriodo();
      
      // Ordena por padrão
      this.ordenarEventos();
      
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      this.mostrarToast('Erro ao carregar agenda', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async carregarEquipamentos() {
    try {
      const todosEquipamentos = await this.apiService.getAllEquipamentos().toPromise();
      this.equipamentos = todosEquipamentos || [];
      this.equipamentosFiltrados = [...this.equipamentos];
      
      // Calcula estatísticas dos equipamentos
      this.calcularEstatisticasEquipamentos();
      
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      this.mostrarToast('Erro ao carregar equipamentos', 'danger');
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

  calcularEstatisticasAgenda() {
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

  calcularEstatisticasEquipamentos() {
    this.estatisticas.equipamentosTotal = this.equipamentos.length;
    this.estatisticas.equipamentosDisponiveis = this.equipamentos.filter(e => e.disponivel === 'S').length;
    this.estatisticas.equipamentosIndisponiveis = this.equipamentos.filter(e => e.disponivel === 'N').length;
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
          return dataA - dataB;
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
    
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    this.mesAtual = meses[mes];
    this.anoAtual = ano;
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const primeiroDiaSemana = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();
    
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
    
    // Dias do próximo mês
    const totalCelulas = 42;
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

// Método corrigido para verificar se o dia tem evento
verificarSeDiaTemEvento(data: Date): boolean {
  // Cria uma data no início do dia (00:00:00) para comparação
  const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const fimDia = new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
  
  return this.eventos.some(evento => {
    const dataEvento = new Date(evento.dataEvento);
    return dataEvento >= inicioDia && dataEvento < fimDia;
  });
}

// Método corrigido para obter eventos do dia
getEventosDoDia(data: Date | null): Agendamento[] {
  if (!data) return [];
  
  // Cria uma data no início do dia (00:00:00) para comparação
  const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const fimDia = new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
  
  return this.eventos.filter(evento => {
    const dataEvento = new Date(evento.dataEvento);
    return dataEvento >= inicioDia && dataEvento < fimDia;
  });
}

// Método auxiliar para normalizar datas (remover horas)
normalizarDataParaDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

// Método corrigido para filtrar eventos hoje
filtrarEventosPorPeriodo() {
  const hoje = this.normalizarDataParaDia(new Date());
  
  const fimProximos7Dias = new Date();
  fimProximos7Dias.setDate(hoje.getDate() + 7);
  const fimProximos7DiasNormalizado = this.normalizarDataParaDia(fimProximos7Dias);
  
  const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  const fimProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
  const fimProximoMesNormalizado = this.normalizarDataParaDia(fimProximoMes);
  
  this.eventosHoje = this.eventos.filter(evento => {
    const dataEvento = this.normalizarDataParaDia(new Date(evento.dataEvento));
    return dataEvento.getTime() === hoje.getTime();
  });
  
  this.eventosProximos7Dias = this.eventos.filter(evento => {
    const dataEvento = this.normalizarDataParaDia(new Date(evento.dataEvento));
    return dataEvento >= hoje && dataEvento <= fimProximos7DiasNormalizado;
  });
  
  this.eventosProximoMes = this.eventos.filter(evento => {
    const dataEvento = this.normalizarDataParaDia(new Date(evento.dataEvento));
    return dataEvento >= inicioProximoMes && dataEvento <= fimProximoMesNormalizado;
  });
}

// Método para formatar data para string YYYY-MM-DD considerando fuso horário local
formatarDataParaString(data: Date): string {
  const ano = data.getFullYear();
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const dia = data.getDate().toString().padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Método alternativo se ainda persistir o problema
verificarSeDiaTemEventoV2(data: Date): boolean {
  const dataString = this.formatarDataParaString(data);
  
  return this.eventos.some(evento => {
    // Cria uma nova data e formata da mesma forma
    const eventoDate = new Date(evento.dataEvento);
    const eventoString = this.formatarDataParaString(eventoDate);
    return eventoString === dataString;
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
    this.filtrarEventos();
  }

  // Métodos auxiliares agenda
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
      return 'medium';
    } else if (this.isEventoHoje(evento)) {
      return 'warning';
    } else if (this.isEventoProximo(evento)) {
      return 'success';
    } else {
      return 'primary';
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

  // Métodos equipamentos
  getEquipamentosDisponiveis(): Equipamento[] {
    return this.equipamentos.filter(e => e.disponivel === 'S');
  }

  getEquipamentosIndisponiveis(): Equipamento[] {
    return this.equipamentos.filter(e => e.disponivel === 'N');
  }

  // Ações
  verDetalhesEvento(evento: Agendamento) {
    this.eventoSelecionado = evento;
  }

  fecharDetalhes() {
    this.eventoSelecionado = null;
  }

  async verEventosDoDia(dia: DiaCalendario) {
    if (!dia.data) return;
    
    const eventosDoDia = this.getEventosDoDia(dia.data);
    
    if (eventosDoDia.length === 1) {
      this.verDetalhesEvento(eventosDoDia[0]);
    } else if (eventosDoDia.length > 1) {
      const alert = await this.alertController.create({
        header: `Eventos do dia ${dia.data.toLocaleDateString('pt-BR')}`,
        message: `Encontrados ${eventosDoDia.length} evento(s)`,
        buttons: [
          {
            text: 'Ver Todos na Lista',
            handler: () => {
              this.visualizacao = 'lista';
              this.eventosFiltrados = eventosDoDia;
              this.ordenarEventos();
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
  }

  async atualizarDashboard() {
    const loading = await this.loadingController.create({
      message: 'Atualizando dashboard...',
      duration: 2000
    });
    
    await loading.present();
    
    try {
      await this.carregarAgenda();
      await this.carregarEquipamentos();
      this.mostrarToast('Dashboard atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
      this.mostrarToast('Erro ao atualizar dashboard', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  navegarParaEquipamentos() {
    this.router.navigate(['/equipamentos']);
  }

  navegarParaAgenda() {
    this.visualizacao = 'calendario';
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