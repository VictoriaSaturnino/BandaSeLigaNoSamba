import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Equipamento } from '../../services/api.service';

@Component({
  selector: 'app-equipamentos',
  templateUrl: './equipamentos.page.html',
  styleUrls: ['./equipamentos.page.scss'],
  standalone: false
})
export class EquipamentosPage implements OnInit {
  equipamentos: Equipamento[] = [];
  equipamentosFiltrados: Equipamento[] = [];
  
  filtro: string = '';
  loading: boolean = true;
  sortBy: string = 'nome'; // 'nome', 'disponibilidade', 'id'

  // Estatísticas
  equipamentosDisponiveis: Equipamento[] = [];
  equipamentosIndisponiveis: Equipamento[] = [];

  constructor(
    private apiService: ApiService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarEquipamentos();
  }

  ionViewWillEnter() {
    this.carregarEquipamentos();
  }

  async carregarEquipamentos() {
    this.loading = true;
    
    try {
      const equipamentos = await this.apiService.getAllEquipamentos().toPromise();
      this.equipamentos = equipamentos || [];
      this.calcularEstatisticas();
      this.filtrarEquipamentos();
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      this.mostrarToast('Erro ao carregar equipamentos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  calcularEstatisticas() {
    this.equipamentosDisponiveis = this.equipamentos.filter(e => e.disponivel === 'S');
    this.equipamentosIndisponiveis = this.equipamentos.filter(e => e.disponivel === 'N');
  }

  filtrarEquipamentos() {
    let equipamentosTemp = this.equipamentos;

    // Filtrar por texto
    if (this.filtro.trim()) {
      const termo = this.filtro.toLowerCase().trim();
      equipamentosTemp = equipamentosTemp.filter(equipamento => 
        equipamento.nmEquipamento.toLowerCase().includes(termo) ||
        (equipamento.idEquipamento && equipamento.idEquipamento.toString().includes(termo))
      );
    }

    // Aplicar ordenação
    this.equipamentosFiltrados = this.ordenarEquipamentos(equipamentosTemp);
  }

  ordenarEquipamentos(equipamentos: Equipamento[]): Equipamento[] {
    return [...equipamentos].sort((a, b) => {
      switch (this.sortBy) {
        case 'nome':
          return a.nmEquipamento.localeCompare(b.nmEquipamento);
        
        case 'disponibilidade':
          // Disponível primeiro (S), depois indisponível (N)
          if (a.disponivel !== b.disponivel) {
            return a.disponivel === 'S' ? -1 : 1;
          }
          return a.nmEquipamento.localeCompare(b.nmEquipamento);
        
        case 'id':
        default:
          // Ordenar por ID (mais recente primeiro)
          const idA = a.idEquipamento || 0;
          const idB = b.idEquipamento || 0;
          return idB - idA; // Descendente
      }
    });
  }

  alterarOrdenacao(ordenacao: string) {
    this.sortBy = ordenacao;
    this.filtrarEquipamentos();
  }

  getStatusText(status: string): string {
    return status === 'S' ? 'Disponível' : 'Indisponível';
  }

  getStatusColor(status: string): string {
    return status === 'S' ? 'success' : 'danger';
  }

  // CRUD Operations - SEM MODAL
  async cadastrarEquipamento() {
    const alert = await this.alertController.create({
      header: 'Cadastrar Equipamento',
      inputs: [
        {
          name: 'nmEquipamento',
          type: 'text',
          placeholder: 'Nome do equipamento',
          attributes: {
            required: true,
            maxlength: 100
          }
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Salvar',
          handler: async (data) => {
            if (data.nmEquipamento && data.nmEquipamento.trim()) {
              await this.salvarEquipamento({
                nmEquipamento: data.nmEquipamento.trim(),
                disponivel: data.disponivel || 'S'
              });
              return true;
            } else {
              this.mostrarToast('Nome do equipamento é obrigatório', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editarEquipamento(equipamento: Equipamento) {
    const alert = await this.alertController.create({
      header: 'Editar Equipamento',
      inputs: [
        {
          name: 'nmEquipamento',
          type: 'text',
          value: equipamento.nmEquipamento,
          placeholder: 'Nome do equipamento',
          attributes: {
            required: true,
            maxlength: 100
          }
        },
        {
          name: 'disponivel',
          type: 'radio',
          label: 'Disponível',
          value: 'S',
          checked: equipamento.disponivel === 'S'
        },
        {
          name: 'disponivel',
          type: 'radio',
          label: 'Indisponível',
          value: 'N',
          checked: equipamento.disponivel === 'N'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Salvar',
          handler: async (data) => {
            if (data.nmEquipamento && data.nmEquipamento.trim()) {
              await this.atualizarEquipamento(equipamento.idEquipamento!, {
                nmEquipamento: data.nmEquipamento.trim(),
                disponivel: data.disponivel || 'S'
              });
              return true;
            } else {
              this.mostrarToast('Nome do equipamento é obrigatório', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async salvarEquipamento(data: { nmEquipamento: string, disponivel: 'S' | 'N' }) {
    const loading = await this.loadingController.create({
      message: 'Salvando equipamento...',
      duration: 2000
    });
    
    await loading.present();

    try {
      const novoEquipamento: Equipamento = {
        nmEquipamento: data.nmEquipamento,
        disponivel: data.disponivel
      };

      await this.apiService.createEquipamento(novoEquipamento).toPromise();
      await loading.dismiss();
      
      this.mostrarToast('Equipamento cadastrado com sucesso!', 'success');
      this.carregarEquipamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao salvar equipamento:', error);
      this.mostrarToast('Erro ao salvar equipamento', 'danger');
    }
  }

  async atualizarEquipamento(id: number, data: { nmEquipamento: string, disponivel: 'S' | 'N' }) {
    const loading = await this.loadingController.create({
      message: 'Atualizando equipamento...',
      duration: 2000
    });
    
    await loading.present();

    try {
      const equipamentoAtualizado: Equipamento = {
        idEquipamento: id,
        nmEquipamento: data.nmEquipamento,
        disponivel: data.disponivel
      };

      await this.apiService.updateEquipamento(equipamentoAtualizado).toPromise();
      await loading.dismiss();
      
      this.mostrarToast('Equipamento atualizado com sucesso!', 'success');
      this.carregarEquipamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao atualizar equipamento:', error);
      this.mostrarToast('Erro ao atualizar equipamento', 'danger');
    }
  }

  async confirmarExclusao(equipamento: Equipamento) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o equipamento <strong>"${equipamento.nmEquipamento}"</strong>?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.excluirEquipamento(equipamento.idEquipamento!);
          }
        }
      ]
    });

    await alert.present();
  }

  async excluirEquipamento(id: number) {
    const loading = await this.loadingController.create({
      message: 'Excluindo equipamento...',
      duration: 2000
    });
    
    await loading.present();

    try {
      await this.apiService.deleteEquipamento(id).toPromise();
      await loading.dismiss();
      
      this.mostrarToast('Equipamento excluído com sucesso!', 'success');
      this.carregarEquipamentos();
      
    } catch (error: any) {
      await loading.dismiss();
      console.error('Erro ao excluir equipamento:', error);
      
      if (error?.status === 400 || error?.status === 404) {
        this.mostrarToast('Equipamento não encontrado ou já foi excluído', 'warning');
      } else {
        this.mostrarToast('Erro ao excluir equipamento', 'danger');
      }
    }
  }

  async alterarDisponibilidade(equipamento: Equipamento, novoStatus: 'S' | 'N') {
    const loading = await this.loadingController.create({
      message: 'Alterando disponibilidade...',
      duration: 1500
    });
    await loading.present();

    try {
      const equipamentoAtualizado: Equipamento = {
        idEquipamento: equipamento.idEquipamento,
        nmEquipamento: equipamento.nmEquipamento,
        disponivel: novoStatus
      };

      await this.apiService.updateEquipamento(equipamentoAtualizado).toPromise();
      await loading.dismiss();
      
      this.mostrarToast(`Equipamento marcado como ${this.getStatusText(novoStatus).toLowerCase()}`, 'success');
      
      // Atualiza localmente
      const index = this.equipamentos.findIndex(e => e.idEquipamento === equipamento.idEquipamento);
      if (index !== -1) {
        this.equipamentos[index].disponivel = novoStatus;
        this.calcularEstatisticas();
        this.filtrarEquipamentos();
      }
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao alterar disponibilidade:', error);
      this.mostrarToast('Erro ao alterar disponibilidade', 'danger');
      
      // Reverte a mudança no toggle
      this.carregarEquipamentos();
    }
  }

  getTipoEquipamento(nome: string): string {
    const nomeLower = nome.toLowerCase();
    
    if (nomeLower.includes('guitarra') || nomeLower.includes('baixo') || nomeLower.includes('violão')) {
      return 'Instrumento Musical';
    } else if (nomeLower.includes('amplificador') || nomeLower.includes('amp')) {
      return 'Amplificação';
    } else if (nomeLower.includes('microfone') || nomeLower.includes('mic')) {
      return 'Microfone';
    } else if (nomeLower.includes('caixa') || nomeLower.includes('speaker') || nomeLower.includes('monitor')) {
      return 'Sonorização';
    } else if (nomeLower.includes('pedal') || nomeLower.includes('efeito')) {
      return 'Efeito';
    } else if (nomeLower.includes('bateria')) {
      return 'Percussão';
    } else if (nomeLower.includes('teclado') || nomeLower.includes('piano')) {
      return 'Teclado';
    } else if (nomeLower.includes('cabos') || nomeLower.includes('cabo')) {
      return 'Conexão';
    } else if (nomeLower.includes('mixer') || nomeLower.includes('mesa')) {
      return 'Mixagem';
    } else if (nomeLower.includes('suporte') || nomeLower.includes('stand')) {
      return 'Suporte';
    } else if (nomeLower.includes('iluminacao') || nomeLower.includes('luz') || nomeLower.includes('light')) {
      return 'Iluminação';
    }
    
    return 'Equipamento Geral';
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

  async atualizarLista() {
    const loading = await this.loadingController.create({
      message: 'Atualizando lista...',
      duration: 1000
    });
    
    await loading.present();
    await this.carregarEquipamentos();
    await loading.dismiss();
    this.mostrarToast('Lista atualizada!', 'success');
  }
}