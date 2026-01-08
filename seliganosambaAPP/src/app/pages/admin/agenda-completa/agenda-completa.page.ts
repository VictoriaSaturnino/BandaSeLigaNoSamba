import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService, Agendamento } from '../../../services/api.service';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-agenda-completa',
  templateUrl: './agenda-completa.page.html',
  styleUrls: ['./agenda-completa.page.scss'],
  standalone: false 
})
export class AgendaCompletaPage implements OnInit {
  agendamentos: Agendamento[] = [];
  agendamentosAprovados: Agendamento[] = [];
  agendamentosFiltrados: Agendamento[] = [];
  
  filtro: string = '';
  filtroPeriodo: string = 'todos';
  loading: boolean = true;
  visualizacaoCalendario: boolean = false;

  // Estatísticas
  eventosHoje: Agendamento[] = [];
  eventosEstaSemana: Agendamento[] = [];
  eventosEsteMes: Agendamento[] = [];

  // Calendário
  dataAtual: Date = new Date();
  mesAtual: string = '';
  anoAtual: number = 0;
  diasDoMes: any[] = [];
  diaSelecionado: string | null = null;
  eventosDiaSelecionado: Agendamento[] = [];

  // Agrupamento por mês
  agrupadosPorMes: any[] = [];

  constructor(
    private apiService: ApiService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarAgenda();
    this.inicializarCalendario();
  }

  carregarAgenda() {
    this.loading = true;
    this.apiService.getAllAgendamentos().subscribe({
      next: (agendamentos) => {
        this.agendamentos = agendamentos;
        // Filtrar apenas agendamentos aprovados
        this.agendamentosAprovados = agendamentos.filter(a => a.aprovado === true);
        
        this.calcularEstatisticas();
        this.filtrarAgenda();
        this.agruparPorMes();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar agenda:', error);
        this.loading = false;
      }
    });
  }

  calcularEstatisticas() {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    // Eventos de hoje
    this.eventosHoje = this.agendamentosAprovados.filter(a => 
      a.dataEvento === hojeStr
    );

    // Eventos desta semana
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(hoje);
    fimSemana.setDate(hoje.getDate() + (6 - hoje.getDay()));

    this.eventosEstaSemana = this.agendamentosAprovados.filter(a => {
      const dataEvento = new Date(a.dataEvento);
      return dataEvento >= inicioSemana && dataEvento <= fimSemana;
    });

    // Eventos deste mês
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    this.eventosEsteMes = this.agendamentosAprovados.filter(a => {
      const dataEvento = new Date(a.dataEvento);
      return dataEvento.getMonth() === mesAtual && 
             dataEvento.getFullYear() === anoAtual;
    });
  }

  filtrarAgenda() {
    let agendamentosTemp = this.agendamentosAprovados;

    // Filtrar por período
    const hoje = new Date();
    switch (this.filtroPeriodo) {
      case 'hoje':
        const hojeStr = hoje.toISOString().split('T')[0];
        agendamentosTemp = agendamentosTemp.filter(a => a.dataEvento === hojeStr);
        break;
      
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        const fimSemana = new Date(hoje);
        fimSemana.setDate(hoje.getDate() + (6 - hoje.getDay()));
        
        agendamentosTemp = agendamentosTemp.filter(a => {
          const dataEvento = new Date(a.dataEvento);
          return dataEvento >= inicioSemana && dataEvento <= fimSemana;
        });
        break;
      
      case 'mes':
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        agendamentosTemp = agendamentosTemp.filter(a => {
          const dataEvento = new Date(a.dataEvento);
          return dataEvento.getMonth() === mesAtual && 
                 dataEvento.getFullYear() === anoAtual;
        });
        break;
      
      case 'futuro':
        const hojeFuturo = new Date();
        hojeFuturo.setHours(0, 0, 0, 0);
        
        agendamentosTemp = agendamentosTemp.filter(a => {
          const dataEvento = new Date(a.dataEvento);
          dataEvento.setHours(0, 0, 0, 0);
          return dataEvento >= hojeFuturo;
        });
        break;
    }

    // Filtrar por texto
    if (this.filtro) {
      const termo = this.filtro.toLowerCase();
      agendamentosTemp = agendamentosTemp.filter(agendamento => 
        agendamento.nomeEvento.toLowerCase().includes(termo) ||
        agendamento.cidade.toLowerCase().includes(termo) ||
        agendamento.tipoEvento.toLowerCase().includes(termo) ||
        agendamento.bairro.toLowerCase().includes(termo)
      );
    }

    // Ordenar por data mais próxima
    this.agendamentosFiltrados = agendamentosTemp.sort((a, b) => {
      return new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime();
    });

    // Atualizar calendário se estiver ativo
    if (this.visualizacaoCalendario) {
      this.atualizarCalendario();
    }
  }

  // Calendário
  inicializarCalendario() {
    this.atualizarMesAtual();
    this.gerarCalendario();
  }

  atualizarMesAtual() {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    this.mesAtual = meses[this.dataAtual.getMonth()];
    this.anoAtual = this.dataAtual.getFullYear();
  }

  gerarCalendario() {
    this.diasDoMes = [];
    
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();
    
    // Primeiro dia do mês
    const primeiroDia = new Date(ano, mes, 1);
    // Último dia do mês
    const ultimoDia = new Date(ano, mes + 1, 0);
    
    // Dias vazios no início
    const diaSemanaInicio = primeiroDia.getDay();
    for (let i = 0; i < diaSemanaInicio; i++) {
      this.diasDoMes.push({ numero: '', data: null, eventos: [], hoje: false });
    }
    
    // Dias do mês
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const data = new Date(ano, mes, dia);
      const dataStr = data.toISOString().split('T')[0];
      const eventosDia = this.agendamentosAprovados.filter(a => a.dataEvento === dataStr);
      const ehHoje = dataStr === hojeStr;
      
      this.diasDoMes.push({
        numero: dia,
        data: dataStr,
        eventos: eventosDia,
        hoje: ehHoje
      });
    }
  }

  atualizarCalendario() {
    this.gerarCalendario();
    if (this.diaSelecionado) {
      this.eventosDiaSelecionado = this.agendamentosAprovados.filter(a => 
        a.dataEvento === this.diaSelecionado
      );
    }
  }

  mesAnterior() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    this.atualizarMesAtual();
    this.atualizarCalendario();
  }

  proximoMes() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.atualizarMesAtual();
    this.atualizarCalendario();
  }

irParaMesAtual() {
  this.dataAtual = new Date();
  this.atualizarMesAtual();
  this.atualizarCalendario();
}

  selecionarDia(data: string) {
    this.diaSelecionado = data;
    this.eventosDiaSelecionado = this.agendamentosAprovados.filter(a => 
      a.dataEvento === data
    );
  }

  alternarVisualizacao() {
    this.visualizacaoCalendario = !this.visualizacaoCalendario;
    if (this.visualizacaoCalendario) {
      this.atualizarCalendario();
    }
  }

  // Agrupamento por mês
  agruparPorMes() {
    const grupos: any = {};
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    this.agendamentosAprovados.forEach(agendamento => {
      const data = new Date(agendamento.dataEvento);
      const mes = meses[data.getMonth()];
      const ano = data.getFullYear();
      const chave = `${mes} ${ano}`;

      if (!grupos[chave]) {
        grupos[chave] = {
          mes: chave,
          eventos: []
        };
      }

      grupos[chave].eventos.push(agendamento);
    });

    this.agrupadosPorMes = Object.values(grupos).sort((a: any, b: any) => {
      const mesesArray = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      const [mesA, anoA] = a.mes.split(' ');
      const [mesB, anoB] = b.mes.split(' ');
      
      if (parseInt(anoA) !== parseInt(anoB)) {
        return parseInt(anoA) - parseInt(anoB);
      }
      
      return mesesArray.indexOf(mesA) - mesesArray.indexOf(mesB);
    });
  }

  // Métodos auxiliares
  getDiaMes(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  getDiaSemana(data: string): string {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[new Date(data).getDay()];
  }

  isHoje(data: string): boolean {
    const hoje = new Date().toISOString().split('T')[0];
    return data === hoje;
  }

  getCorTipoEvento(tipo: string): string {
    const cores: { [key: string]: string } = {
      'Casamento': 'primary',
      'Aniversário': 'success',
      'Corporativo': 'warning',
      'Festa': 'danger',
      'Show': 'tertiary',
      'Formatura': 'secondary'
    };
    
    return cores[tipo] || 'medium';
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // Ações
  verDetalhesEvento(agendamento: Agendamento) {
    console.log('Ver detalhes:', agendamento);
    // Implementar navegação para detalhes
    // this.router.navigate(['/admin/detalhes-agendamento', agendamento.idAgendamento]);
  }

  async editarEvento(agendamento: Agendamento) {
    const alert = await this.alertController.create({
      header: 'Editar Evento',
      subHeader: agendamento.nomeEvento,
      inputs: [
        {
          name: 'aprovado',
          type: 'checkbox',
          label: 'Aprovado',
          checked: agendamento.aprovado,
          value: 'aprovado'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Salvar',
          handler: (data) => {
            const aprovado = data.aprovado === 'aprovado';
            this.atualizarStatusAgendamento(agendamento.idAgendamento!, aprovado);
          }
        }
      ]
    });

    await alert.present();
  }

  atualizarStatusAgendamento(id: number, aprovado: boolean) {
    this.apiService.updateStatusAgendamento(id, aprovado).subscribe({
      next: () => {
        const index = this.agendamentos.findIndex(a => a.idAgendamento === id);
        if (index !== -1) {
          this.agendamentos[index].aprovado = aprovado;
          // Recarregar agenda para refletir mudanças
          this.carregarAgenda();
          this.mostrarMensagem('Sucesso', 'Status do evento atualizado!');
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar status:', error);
        this.mostrarMensagem('Erro', 'Não foi possível atualizar o status.');
      }
    });
  }

  async criarContrato(agendamento: Agendamento) {
    const alert = await this.alertController.create({
      header: 'Criar Contrato',
      message: `Deseja criar um contrato para o evento "${agendamento.nomeEvento}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar',
          handler: () => {
            this.router.navigate(['/admin/contratos']);
          }
        }
      ]
    });

    await alert.present();
  }

  async exportarAgenda() {
    try {
      // Criar conteúdo HTML para o PDF
      const htmlContent = this.criarHTMLAgenda();

      // Criar um elemento temporário
      const elemento = document.createElement('div');
      elemento.style.position = 'absolute';
      elemento.style.left = '-9999px';
      elemento.innerHTML = htmlContent;
      document.body.appendChild(elemento);

      // Converter para PDF
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      const nomeArquivo = `Agenda_Completa_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(nomeArquivo);

      this.mostrarMensagem('Sucesso', `Agenda exportada: ${nomeArquivo}`);

      // Remover elemento
      document.body.removeChild(elemento);

    } catch (error) {
      console.error('Erro ao exportar agenda:', error);
      this.mostrarMensagem('Erro', 'Não foi possível exportar a agenda.');
    }
  }

  private criarHTMLAgenda(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Agenda Completa - Se Liga No Samba</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            .evento { margin: 15px 0; padding: 15px; border-left: 4px solid #3498db; background: #f8f9fa; }
            .data { font-weight: bold; color: #2c3e50; }
            .nome { font-size: 18px; margin: 5px 0; }
            .detalhes { color: #7f8c8d; font-size: 14px; }
            .total { margin-top: 20px; padding: 10px; background: #e8f5e9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Agenda Completa - Se Liga No Samba</h1>
          <p>Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
          
          <div class="total">
            <strong>Total de Eventos: ${this.agendamentosAprovados.length}</strong>
          </div>
          
          ${this.agendamentosAprovados.map(agendamento => `
            <div class="evento">
              <div class="data">${this.formatarData(agendamento.dataEvento)} - ${agendamento.horario}</div>
              <div class="nome">${agendamento.nomeEvento}</div>
              <div class="detalhes">
                ${agendamento.tipoEvento} • 
                ${agendamento.cidade} • 
                ${agendamento.quantidadeConvidados} convidados • 
                ${this.formatarValor(agendamento.orcamento)}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }

  async mostrarMensagem(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK']
    });

    await alert.present();
  }
}