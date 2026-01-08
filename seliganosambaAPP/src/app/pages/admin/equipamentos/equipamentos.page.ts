import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Equipamento } from '../../../services/api.service';

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
    if (this.filtro) {
      const termo = this.filtro.toLowerCase();
      equipamentosTemp = equipamentosTemp.filter(equipamento => 
        equipamento.nmEquipamento.toLowerCase().includes(termo)
      );
    }

    // Ordenar por disponibilidade (disponíveis primeiro) e depois por nome
    this.equipamentosFiltrados = equipamentosTemp.sort((a, b) => {
      // Primeiro ordena por disponibilidade (S vem antes de N)
      if (a.disponivel !== b.disponivel) {
        return a.disponivel === 'S' ? -1 : 1;
      }
      // Depois ordena por nome
      return a.nmEquipamento.localeCompare(b.nmEquipamento);
    });
  }

  // CRUD Operations
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
            if (data.nmEquipamento && data.nmEquipamento.trim()) {
              this.salvarEquipamento(data);
              return true; // Fecha o alert
            } else {
              this.mostrarToast('Nome do equipamento é obrigatório', 'warning');
              return false; // Mantém o alert aberto
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async salvarEquipamento(data: any) {
    const loading = await this.loadingController.create({
      message: 'Salvando equipamento...'
    });
    await loading.present();

    try {
      const novoEquipamento: Equipamento = {
        nmEquipamento: data.nmEquipamento.trim(),
        disponivel: 'S' // Por padrão, novo equipamento é disponível
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
            if (data.nmEquipamento && data.nmEquipamento.trim()) {
              this.atualizarEquipamento(equipamento, data.nmEquipamento.trim());
              return true; // Fecha o alert
            } else {
              this.mostrarToast('Nome do equipamento é obrigatório', 'warning');
              return false; // Mantém o alert aberto
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async atualizarEquipamento(equipamentoOriginal: Equipamento, novoNome: string) {
    const loading = await this.loadingController.create({
      message: 'Atualizando equipamento...'
    });
    await loading.present();

    try {
      // Cria um novo objeto com todos os campos necessários
      const equipamentoAtualizado: Equipamento = {
        idEquipamento: equipamentoOriginal.idEquipamento,
        nmEquipamento: novoNome,
        disponivel: equipamentoOriginal.disponivel // Mantém a disponibilidade atual
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
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.excluirEquipamento(equipamento.idEquipamento!);
            return true; // Fecha o alert
          }
        }
      ]
    });

    await alert.present();
  }

  async excluirEquipamento(id: number) {
    const loading = await this.loadingController.create({
      message: 'Excluindo equipamento...'
    });
    await loading.present();

    try {
      await this.apiService.deleteEquipamento(id).toPromise();
      await loading.dismiss();
      
      this.mostrarToast('Equipamento excluído com sucesso!', 'success');
      this.carregarEquipamentos();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao excluir equipamento:', error);
      this.mostrarToast('Erro ao excluir equipamento', 'danger');
    }
  }

  async alterarDisponibilidade(equipamento: Equipamento, novoStatus: 'S' | 'N') {
    const loading = await this.loadingController.create({
      message: 'Alterando disponibilidade...'
    });
    await loading.present();

    try {
      // Cria um novo objeto com todos os campos necessários
      const equipamentoAtualizado: Equipamento = {
        idEquipamento: equipamento.idEquipamento,
        nmEquipamento: equipamento.nmEquipamento, // Mantém o nome
        disponivel: novoStatus
      };

      await this.apiService.updateEquipamento(equipamentoAtualizado).toPromise();
      await loading.dismiss();
      
      this.mostrarToast(`Equipamento marcado como ${novoStatus === 'S' ? 'Disponível' : 'Indisponível'}`, 'success');
      
      // Atualiza localmente sem recarregar tudo
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
      
      // Reverte a mudança no toggle se houver erro
      this.carregarEquipamentos();
    }
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