import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ApiService, Ensaio } from '../../../services/api.service';

@Component({
  selector: 'app-ensaios',
  templateUrl: './ensaios.page.html',
  styleUrls: ['./ensaios.page.scss'],
  standalone: false
})
export class EnsaiosPage implements OnInit {
  ensaios: Ensaio[] = [];
  ensaiosFiltrados: Ensaio[] = [];
  filtroAtivo: string = 'todos';
  termoBusca: string = '';

  constructor(
    private apiService: ApiService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.carregarEnsaios();
  }

  ionViewWillEnter() {
    this.carregarEnsaios();
  }

  carregarEnsaios() {
    this.apiService.getAllEnsaio().subscribe({
      next: (data) => {
        this.ensaios = data;
        this.ensaiosFiltrados = [...data];
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Erro ao carregar ensaios:', error);
        this.mostrarToast('Erro ao carregar ensaios', 'danger');
      }
    });
  }

  filtrarEnsaios(event: any) {
    this.termoBusca = event.detail.value?.toLowerCase() || '';
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let filtrados = [...this.ensaios];

    // Filtro por busca
    if (this.termoBusca) {
      filtrados = filtrados.filter(ensaio =>
        ensaio.local.toLowerCase().includes(this.termoBusca) ||
        ensaio.dtEnsaio.includes(this.termoBusca) ||
        ensaio.horario.includes(this.termoBusca)
      );
    }

    // Filtro por data
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (this.filtroAtivo) {
      case 'hoje':
        filtrados = filtrados.filter(ensaio => {
          const dataEnsaio = new Date(ensaio.dtEnsaio);
          dataEnsaio.setHours(0, 0, 0, 0);
          return dataEnsaio.getTime() === hoje.getTime();
        });
        break;
      
      case 'futuros':
        filtrados = filtrados.filter(ensaio => {
          const dataEnsaio = new Date(ensaio.dtEnsaio);
          dataEnsaio.setHours(0, 0, 0, 0);
          return dataEnsaio.getTime() >= hoje.getTime();
        });
        break;
      
      case 'passados':
        filtrados = filtrados.filter(ensaio => {
          const dataEnsaio = new Date(ensaio.dtEnsaio);
          dataEnsaio.setHours(0, 0, 0, 0);
          return dataEnsaio.getTime() < hoje.getTime();
        });
        break;
      
      case 'todos':
      default:
        break;
    }

    // Ordenar por data mais recente primeiro
    filtrados.sort((a, b) => {
      return new Date(b.dtEnsaio).getTime() - new Date(a.dtEnsaio).getTime();
    });

    this.ensaiosFiltrados = filtrados;
  }

  getCorStatus(dataString: string): string {
    const dataEnsaio = new Date(dataString);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataEnsaio.setHours(0, 0, 0, 0);
    
    if (dataEnsaio.getTime() === hoje.getTime()) {
      return 'warning'; // Hoje
    } else if (dataEnsaio > hoje) {
      return 'success'; // Futuro
    } else {
      return 'medium'; // Passado
    }
  }

  getStatusTexto(dataString: string): string {
    const dataEnsaio = new Date(dataString);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataEnsaio.setHours(0, 0, 0, 0);
    
    if (dataEnsaio.getTime() === hoje.getTime()) {
      return 'Hoje';
    } else if (dataEnsaio > hoje) {
      const diffTime = dataEnsaio.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Em ${diffDays} dias`;
    } else {
      return 'Passado';
    }
  }

  formatarData(dataString: string): string {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
  }

  novoEnsaio() {
    this.mostrarModalEnsaio();
  }

  editarEnsaio(ensaio: Ensaio) {
    this.mostrarModalEnsaio(ensaio);
  }

  async mostrarModalEnsaio(ensaio?: Ensaio) {
    const isEdicao = !!ensaio;
    
    const alert = await this.alertController.create({
      header: isEdicao ? 'Editar Ensaio' : 'Novo Ensaio',
      inputs: [
        {
          name: 'dtEnsaio',
          type: 'date',
          label: 'Data do Ensaio',
          value: ensaio?.dtEnsaio || this.getDataAtual(),
          placeholder: 'Data do ensaio'
        },
        {
          name: 'horario',
          type: 'text',
          label: 'Horário',
          value: ensaio?.horario || '',
          placeholder: 'Ex: 18:30'
        },
        {
          name: 'local',
          type: 'text',
          label: 'Local',
          value: ensaio?.local || '',
          placeholder: 'Local do ensaio'
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
            if (this.validarEnsaio(data)) {
              this.salvarEnsaio(data, ensaio?.idEnsaio);
              return true;
            } else {
              this.mostrarToast('Preencha todos os campos corretamente', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getDataAtual(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  validarEnsaio(data: any): boolean {
    return !!data.dtEnsaio && !!data.horario && !!data.local;
  }

  salvarEnsaio(data: any, id?: number) {
    const ensaio: Ensaio = {
      idEnsaio: id,
      dtEnsaio: data.dtEnsaio,
      horario: data.horario,
      local: data.local
    };

    const observable = id 
      ? this.apiService.updateEnsaio(ensaio)
      : this.apiService.createEnsaio(ensaio);

    observable.subscribe({
      next: () => {
        this.carregarEnsaios();
        this.mostrarToast(id ? 'Ensaio atualizado!' : 'Ensaio criado!', 'success');
      },
      error: (error) => {
        console.error('Erro ao salvar ensaio:', error);
        this.mostrarToast('Erro ao salvar ensaio', 'danger');
      }
    });
  }

  async confirmarExclusao(ensaio: Ensaio) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o ensaio de ${this.formatarData(ensaio.dtEnsaio)} no ${ensaio.local}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.excluirEnsaio(ensaio.idEnsaio!);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  excluirEnsaio(id: number) {
    this.apiService.deleteEnsaio(id).subscribe({
      next: () => {
        this.carregarEnsaios();
        this.mostrarToast('Ensaio excluído!', 'success');
      },
      error: (error) => {
        console.error('Erro ao excluir ensaio:', error);
        this.mostrarToast('Erro ao excluir ensaio', 'danger');
      }
    });
  }

  async mostrarToast(mensagem: string, cor: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2000,
      color: cor,
      position: 'top'
    });
    
    await toast.present();
  }
}