import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Agendamento, Contrato } from '../../../services/api.service';

@Component({
  selector: 'app-orcamentos',
  templateUrl: './orcamentos.page.html',
  styleUrls: ['./orcamentos.page.scss'],
  standalone: false
})
export class OrcamentosPage implements OnInit {
  orcamentos: Agendamento[] = [];
  orcamentosFiltrados: Agendamento[] = [];
  
  filtro: string = '';
  filtroStatus: string = 'todos';
  loading: boolean = true;

  // Estatísticas
  orcamentosAprovados: Agendamento[] = [];
  orcamentosNaoAprovados: Agendamento[] = [];
  orcamentosExpirados: Agendamento[] = [];

  // Tipos de evento disponíveis
  tiposEvento = [
    'Casamento',
    'Aniversário',
    'Corporativo',
    'Festa',
    'Show',
    'Formatura',
    'Confraternização',
    'Outro'
  ];

  constructor(
    private apiService: ApiService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarOrcamentos();
  }

  async carregarOrcamentos() {
    this.loading = true;
    
    try {
      const agendamentos = await this.apiService.getAllAgendamentos().toPromise();
      
      // Filtra automaticamente os expirados não aprovados
      await this.removerExpiradosAutomaticamente(agendamentos || []);
      
      // Carrega os orçamentos restantes
      this.orcamentos = agendamentos || [];
      this.calcularEstatisticas();
      this.filtrarOrcamentos();
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      this.mostrarToast('Erro ao carregar orçamentos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async removerExpiradosAutomaticamente(agendamentos: Agendamento[]) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const expiradosParaRemover = agendamentos.filter(agendamento => {
      const dataEvento = new Date(agendamento.dataEvento);
      dataEvento.setHours(0, 0, 0, 0);
      
      // Verifica se está expirado E não está aprovado
      return dataEvento < hoje && (agendamento.aprovado === false || agendamento.aprovado === null);
    });

    // Remove os expirados automaticamente
    if (expiradosParaRemover.length > 0) {
      try {
        const promises = expiradosParaRemover.map(agendamento => 
          this.apiService.deleteAgendamento(agendamento.idAgendamento!).toPromise()
        );
        
        await Promise.all(promises);
        console.log(`${expiradosParaRemover.length} orçamentos expirados removidos automaticamente`);
      } catch (error) {
        console.error('Erro ao remover orçamentos expirados:', error);
      }
    }
  }

  calcularEstatisticas() {
    this.orcamentosAprovados = this.orcamentos.filter(o => o.aprovado === true);
    this.orcamentosNaoAprovados = this.orcamentos.filter(o => 
      o.aprovado === false || o.aprovado === null
    );
    
    this.orcamentosExpirados = this.orcamentos.filter(o => 
      this.isExpirado(o.dataEvento) && (o.aprovado === false || o.aprovado === null)
    );
  }

  isExpirado(dataEvento: string): boolean {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const data = new Date(dataEvento);
    data.setHours(0, 0, 0, 0);
    
    return data < hoje;
  }

  filtrarOrcamentos() {
    let orcamentosTemp = this.orcamentos;

    // Filtrar por status
    if (this.filtroStatus !== 'todos') {
      if (this.filtroStatus === 'aprovados') {
        orcamentosTemp = orcamentosTemp.filter(o => o.aprovado === true);
      } else if (this.filtroStatus === 'nao-aprovados') {
        orcamentosTemp = orcamentosTemp.filter(o => 
          o.aprovado === false || o.aprovado === null
        );
      }
    }

    // Filtrar por texto
    if (this.filtro) {
      const termo = this.filtro.toLowerCase();
      orcamentosTemp = orcamentosTemp.filter(orcamento => 
        orcamento.nomeEvento.toLowerCase().includes(termo) ||
        orcamento.cidade.toLowerCase().includes(termo) ||
        orcamento.bairro.toLowerCase().includes(termo) ||
        orcamento.tipoEvento.toLowerCase().includes(termo)
      );
    }

    // Ordenar: primeiro expirados, depois por data (mais recente primeiro)
    this.orcamentosFiltrados = orcamentosTemp.sort((a, b) => {
      // Primeiro ordena por expirado
      const aExpirado = this.isExpirado(a.dataEvento);
      const bExpirado = this.isExpirado(b.dataEvento);
      
      if (aExpirado && !bExpirado) return -1;
      if (!aExpirado && bExpirado) return 1;
      
      // Depois ordena por data (mais recente primeiro)
      const dataA = new Date(a.dataCriacao || a.dataEvento);
      const dataB = new Date(b.dataCriacao || b.dataEvento);
      return dataB.getTime() - dataA.getTime();
    });
  }

  alternarFiltro(status: string) {
    this.filtroStatus = status;
    this.filtrarOrcamentos();
  }

  // Métodos auxiliares
  getStatusClass(aprovado: boolean | null | undefined, dataEvento: string): string {
    if (this.isExpirado(dataEvento) && (aprovado === false || aprovado === null)) {
      return 'expirado';
    }
    if (aprovado === true) return 'aprovado';
    return 'nao-aprovado';
  }

  getStatusIcon(aprovado: boolean | null | undefined, dataEvento: string): string {
    if (this.isExpirado(dataEvento) && (aprovado === false || aprovado === null)) {
      return 'alert-circle-outline';
    }
    if (aprovado === true) return 'checkmark-circle-outline';
    return 'time-outline';
  }

  getStatusTexto(aprovado: boolean | null | undefined, dataEvento: string): string {
    if (this.isExpirado(dataEvento) && (aprovado === false || aprovado === null)) {
      return 'Expirado';
    }
    if (aprovado === true) return 'Aprovado';
    return 'Não Aprovado';
  }

  formatarValor(valor: number | undefined): string {
    if (!valor) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarData(data: string | undefined): string {
    if (!data) return 'N/A';
    
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  formatarDataHora(data: string | undefined): string {
    if (!data) return 'N/A';
    
    const date = new Date(data);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  gerarNomePDF(agendamento: Agendamento): string {
    const nomeEvento = agendamento.nomeEvento
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
    
    const dataEvento = new Date(agendamento.dataEvento)
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');
    
    return `contrato_${nomeEvento}_${dataEvento}.pdf`;
  }

  // CRUD Operations
  async aprovarOrcamento(orcamento: Agendamento) {
    const alert = await this.alertController.create({
      header: 'Aprovar Orçamento',
      message: `Deseja aprovar o orçamento para o evento <strong>"${orcamento.nomeEvento}"</strong> no valor de <strong>${this.formatarValor(orcamento.orcamento)}</strong>? Um contrato será criado automaticamente.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprovar e Criar Contrato',
          handler: () => {
            this.aprovarECriarContrato(orcamento);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async aprovarECriarContrato(orcamento: Agendamento) {
    const loading = await this.loadingController.create({
      message: 'Aprovando e criando contrato...'
    });
    await loading.present();

    try {
      await this.apiService.updateStatusAgendamento(orcamento.idAgendamento!, true).toPromise();
      
      const novoContrato: Contrato = {
        idAgendamento: orcamento.idAgendamento!,
        pdf: this.gerarNomePDF(orcamento),
        valor: orcamento.orcamento || 0,
        assinaturaProdutor: false,
        assinaturaContratante: false,
        dataCriacao: new Date().toISOString()
      };

      await this.apiService.createContrato(novoContrato).toPromise();
      await loading.dismiss();
      
      this.mostrarToast('Orçamento aprovado e contrato criado com sucesso!', 'success');
      this.carregarOrcamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao aprovar e criar contrato:', error);
      this.mostrarToast('Erro ao processar aprovação', 'danger');
    }
  }

  async reprovarOrcamento(orcamento: Agendamento) {
    const alert = await this.alertController.create({
      header: 'Reprovar Orçamento',
      message: `Deseja reprovar o orçamento para o evento <strong>"${orcamento.nomeEvento}"</strong>?`,
      inputs: [
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Motivo da reprovação (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Reprovar',
          handler: (data) => {
            this.atualizarStatusOrcamento(orcamento.idAgendamento!, false, data.motivo);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async aprovarTodos() {
    const alert = await this.alertController.create({
      header: 'Aprovar Todos',
      message: `Deseja aprovar todos os ${this.orcamentosNaoAprovados.length} orçamentos não aprovados? Contratos serão criados automaticamente para cada um.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprovar Todos',
          handler: () => {
            this.aprovarTodosNaoAprovados();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async aprovarTodosNaoAprovados() {
    const loading = await this.loadingController.create({
      message: 'Aprovando todos os orçamentos...'
    });
    await loading.present();

    try {
      const promises = this.orcamentosNaoAprovados.map(async (orcamento) => {
        await this.apiService.updateStatusAgendamento(orcamento.idAgendamento!, true).toPromise();
        
        const novoContrato: Contrato = {
          idAgendamento: orcamento.idAgendamento!,
          pdf: this.gerarNomePDF(orcamento),
          valor: orcamento.orcamento || 0,
          assinaturaProdutor: false,
          assinaturaContratante: false,
          dataCriacao: new Date().toISOString()
        };
        
        return this.apiService.createContrato(novoContrato).toPromise();
      });
      
      await Promise.all(promises);
      await loading.dismiss();
      
      this.mostrarToast(`${this.orcamentosNaoAprovados.length} orçamentos aprovados e contratos criados com sucesso!`, 'success');
      this.carregarOrcamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao aprovar todos os orçamentos:', error);
      this.mostrarToast('Erro ao aprovar todos os orçamentos', 'danger');
    }
  }

  async limparExpirados() {
    const alert = await this.alertController.create({
      header: 'Limpar Expirados',
      message: `Deseja excluir todos os ${this.orcamentosExpirados.length} orçamentos expirados?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpar',
          handler: () => {
            this.excluirTodosExpirados();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async excluirTodosExpirados() {
    const loading = await this.loadingController.create({
      message: 'Excluindo orçamentos expirados...'
    });
    await loading.present();

    try {
      const promises = this.orcamentosExpirados.map(orcamento => 
        this.apiService.deleteAgendamento(orcamento.idAgendamento!).toPromise()
      );
      
      await Promise.all(promises);
      await loading.dismiss();
      
      this.mostrarToast(`${this.orcamentosExpirados.length} orçamentos expirados excluídos com sucesso!`, 'success');
      this.carregarOrcamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao excluir orçamentos expirados:', error);
      this.mostrarToast('Erro ao excluir orçamentos expirados', 'danger');
    }
  }

  async atualizarStatusOrcamento(id: number, aprovado: boolean, motivo: string = '') {
    const loading = await this.loadingController.create({
      message: aprovado ? 'Aprovando orçamento...' : 'Reprovando orçamento...'
    });
    await loading.present();

    try {
      await this.apiService.updateStatusAgendamento(id, aprovado).toPromise();
      await loading.dismiss();
      
      const mensagem = aprovado 
        ? 'Orçamento aprovado com sucesso!' 
        : 'Orçamento reprovado com sucesso!';
      
      this.mostrarToast(mensagem, aprovado ? 'success' : 'warning');
      this.carregarOrcamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao atualizar status:', error);
      this.mostrarToast('Erro ao atualizar status do orçamento', 'danger');
    }
  }

  async editarOrcamento(orcamento: Agendamento) {
    const alert = await this.alertController.create({
      header: 'Editar Orçamento',
      subHeader: orcamento.nomeEvento,
      inputs: [
        {
          name: 'nomeEvento',
          type: 'text',
          value: orcamento.nomeEvento,
          placeholder: 'Nome do evento'
        },
        {
          name: 'tipoEvento',
          type: 'text',
          value: orcamento.tipoEvento,
          placeholder: 'Tipo de evento'
        },
        {
          name: 'dataEvento',
          type: 'date',
          value: orcamento.dataEvento,
          placeholder: 'Data do evento'
        },
        {
          name: 'horario',
          type: 'text',
          value: orcamento.horario,
          placeholder: 'Horário (ex: 19:00)'
        },
        {
          name: 'quantidadeConvidados',
          type: 'number',
          value: orcamento.quantidadeConvidados.toString(),
          placeholder: 'Quantidade de convidados',
          min: '1'
        },
        {
          name: 'orcamento',
          type: 'number',
          value: orcamento.orcamento.toString(),
          placeholder: 'Valor do orçamento (R$)',
          min: '0'
        },
        {
          name: 'cidade',
          type: 'text',
          value: orcamento.cidade,
          placeholder: 'Cidade'
        },
        {
          name: 'bairro',
          type: 'text',
          value: orcamento.bairro,
          placeholder: 'Bairro'
        },
        {
          name: 'rua',
          type: 'text',
          value: orcamento.rua,
          placeholder: 'Rua'
        },
        {
          name: 'numero',
          type: 'text',
          value: orcamento.numero,
          placeholder: 'Número'
        },
        {
          name: 'sonorizacao',
          type: 'checkbox',
          label: 'Incluir sonorização',
          checked: orcamento.sonorizacao,
          value: 'sonorizacao'
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
            this.atualizarOrcamento(orcamento.idAgendamento!, data);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async atualizarOrcamento(id: number, data: any) {
    const loading = await this.loadingController.create({
      message: 'Atualizando orçamento...'
    });
    await loading.present();

    try {
      const orcamentoOriginal = this.orcamentos.find(o => o.idAgendamento === id);
      
      const orcamentoAtualizado: Agendamento = {
        idAgendamento: id,
        idUsuario: orcamentoOriginal?.idUsuario || 0,
        nomeEvento: data.nomeEvento,
        tipoEvento: data.tipoEvento,
        dataEvento: data.dataEvento,
        horario: data.horario,
        quantidadeConvidados: parseInt(data.quantidadeConvidados) || 0,
        orcamento: parseFloat(data.orcamento) || 0,
        cidade: data.cidade,
        bairro: data.bairro,
        rua: data.rua,
        numero: data.numero,
        estado: data.estado || orcamentoOriginal?.estado || '',
        sonorizacao: data.sonorizacao === 'sonorizacao',
        aprovado: orcamentoOriginal?.aprovado || false
      };

      await this.apiService.updateAgendamento(orcamentoAtualizado).toPromise();
      await loading.dismiss();
      
      this.mostrarToast('Orçamento atualizado com sucesso!', 'success');
      this.carregarOrcamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao atualizar orçamento:', error);
      this.mostrarToast('Erro ao atualizar orçamento', 'danger');
    }
  }

  async confirmarExclusao(orcamento: Agendamento) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o orçamento <strong>"${orcamento.nomeEvento}"</strong>?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.excluirOrcamento(orcamento.idAgendamento!);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async excluirOrcamento(id: number) {
    const loading = await this.loadingController.create({
      message: 'Excluindo orçamento...'
    });
    await loading.present();

    try {
      await this.apiService.deleteAgendamento(id).toPromise();
      await loading.dismiss();
      
      this.mostrarToast('Orçamento excluído com sucesso!', 'success');
      this.carregarOrcamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao excluir orçamento:', error);
      this.mostrarToast('Erro ao excluir orçamento', 'danger');
    }
  }

  async exportarRelatorio() {
    try {
      const loading = await this.loadingController.create({
        message: 'Gerando relatório...'
      });
      await loading.present();

      const htmlContent = this.criarHTMLRelatorio();
      
      await loading.dismiss();
      this.mostrarToast('Funcionalidade de exportação em desenvolvimento', 'warning');
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      this.mostrarToast('Erro ao exportar relatório', 'danger');
    }
  }

  private criarHTMLRelatorio(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Orçamentos - Se Liga No Samba</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            .header-info { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { padding: 15px; border-radius: 5px; color: white; }
            .stat-card.total { background: #3498db; }
            .stat-card.nao-aprovados { background: #f39c12; }
            .stat-card.aprovados { background: #2ecc71; }
            .stat-card.expirados { background: #e74c3c; }
            .orcamento-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .orcamento-table th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
            .orcamento-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Relatório de Orçamentos - Se Liga No Samba</h1>
          <div class="header-info">
            <p><strong>Data do relatório:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de orçamentos:</strong> ${this.orcamentos.length}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card total">
              <h3>${this.orcamentos.length}</h3>
              <p>Total de Orçamentos</p>
            </div>
            <div class="stat-card nao-aprovados">
              <h3>${this.orcamentosNaoAprovados.length}</h3>
              <p>Não Aprovados</p>
            </div>
            <div class="stat-card aprovados">
              <h3>${this.orcamentosAprovados.length}</h3>
              <p>Aprovados</p>
            </div>
            <div class="stat-card expirados">
              <h3>${this.orcamentosExpirados.length}</h3>
              <p>Expirados</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async mostrarToast(mensagem: string, cor: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'top'
    });
    await toast.present();
  }
}