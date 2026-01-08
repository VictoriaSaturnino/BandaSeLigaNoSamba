import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-solicitar-orcamento',
  templateUrl: './solicitar-orcamento.page.html',
  styleUrls: ['./solicitar-orcamento.page.scss'],
  standalone: false,
})
export class SolicitarOrcamentoPage implements OnInit {
  @ViewChild('orcamentoForm') orcamentoForm!: NgForm;

  form: any = {
    nomeEvento: '',
    quantidadeConvidados: null,
    tipoEvento: 'PUBLICO',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    dataEvento: '',
    horario: '',
    sonorizacao: false
    // REMOVIDO: orcamento - será sempre 0
  };

  enviando: boolean = false;
  dataMinima: Date = new Date();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    // Data mínima é amanhã
    this.dataMinima.setDate(this.dataMinima.getDate() + 1);
  }

  async enviarPreOrcamento() {  // Método renomeado
    if (this.enviando) return;
    
    // Validar formulário primeiro
    if (!this.validarFormulario()) {
      return;
    }
    
    try {
      this.enviando = true;
      
      // Mostrar loading
      const loading = await this.loadingController.create({
        message: 'Enviando pré-orçamento...',
        spinner: 'crescent'
      });
      await loading.present();

      console.log('Iniciando envio de pré-orçamento...');
      
      // Obter usuário atual
      const usuarioAtual = this.authService.currentUserValue;
      console.log('Usuário atual:', usuarioAtual);
      
      if (!usuarioAtual) {
        await loading.dismiss();
        await this.mostrarAlerta('Erro', 'Usuário não autenticado. Faça login novamente.');
        this.router.navigate(['/login']);
        return;
      }

      // Validar data (mínimo 7 dias de antecedência)
      const dataEvento = new Date(this.form.dataEvento);
      const hoje = new Date();
      const diferencaDias = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
      
      if (diferencaDias < 7) {
        await loading.dismiss();
        await this.mostrarAlerta('Atenção', 'A data do evento deve ser com pelo menos 7 dias de antecedência.');
        return;
      }

      // Converter horário para formato HH:MM:SS
      let horarioFormatado = '19:00:00';
      if (this.form.horario) {
        const hora = new Date(this.form.horario);
        const horas = hora.getHours().toString().padStart(2, '0');
        const minutos = hora.getMinutes().toString().padStart(2, '0');
        horarioFormatado = `${horas}:${minutos}:00`;
      }

      // Converter data para formato YYYY-MM-DD
      let dataFormatada = dataEvento.toISOString().split('T')[0];

      // Preparar dados do agendamento - SEMPRE com aprovado = false e orcamento = 0
      const agendamentoData: any = {
        idUsuario: usuarioAtual.idUsuario,
        nomeEvento: this.form.nomeEvento.trim(),
        quantidadeConvidados: Number(this.form.quantidadeConvidados) || 0,
        rua: this.form.rua.trim(),
        numero: this.form.numero.trim(),
        bairro: this.form.bairro.trim(),
        cidade: this.form.cidade.trim(),
        estado: this.form.estado.trim().toUpperCase(),
        dataEvento: dataFormatada,
        horario: horarioFormatado,
        sonorizacao: this.form.sonorizacao === true || this.form.sonorizacao === 'true',
        tipoEvento: this.form.tipoEvento || 'PUBLICO',
        orcamento: 0, // SEMPRE ZERO - o produtor fará a proposta
        aprovado: false, // SEMPRE FALSE inicialmente
        dataCriacao: new Date().toISOString(),
        status: 'PENDENTE' // Adicionando status para controle
      };

      console.log('Dados do pré-orçamento:', agendamentoData);

      // Enviar via ApiService - usando createAgendamento
      const response = await this.apiService.createAgendamento(agendamentoData).toPromise();
      console.log('Resposta da API:', response);
      
      await loading.dismiss();
      
      // Mostrar confirmação
      await this.mostrarAlertaSucesso();
      
    } catch (error: any) {
      console.error('Erro detalhado ao enviar pré-orçamento:', error);
      
      await this.loadingController.dismiss();
      
      let mensagemErro = 'Erro ao enviar pré-orçamento.';
      
      if (error.message) {
        if (error.message.includes('400')) {
          mensagemErro = 'Dados inválidos. Verifique os campos do formulário.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          mensagemErro = 'Não autorizado. Faça login novamente.';
          this.router.navigate(['/login']);
        } else if (error.message.includes('409')) {
          mensagemErro = 'Já existe um evento agendado para esta data/horário.';
        } else if (error.message.includes('500')) {
          mensagemErro = 'Erro no servidor. Tente novamente mais tarde.';
        }
      }
      
      await this.mostrarAlerta('Erro', mensagemErro);
      
    } finally {
      this.enviando = false;
    }
  }

  async mostrarAlertaSucesso() {
    const alert = await this.alertController.create({
      header: 'Pré-Orçamento Enviado!',
      message: 'Solicitação enviada com sucesso!<br><br>' +
               'O produtor analisará sua solicitação e enviará uma proposta de orçamento.' +
               'Você será notificado quando houver uma resposta.',
      buttons: [
        {
          text: 'Acompanhar Solicitações',
          handler: () => {
            this.router.navigate(['/contratante/agendamentos']);
          }
        },
        {
          text: 'Solicitar Outro',
          handler: () => {
            this.limparFormulario();
          }
        },
        {
          text: 'Voltar ao Dashboard',
          handler: () => {
            this.router.navigate(['/contratante/dashboard']);
          }
        }
      ]
    });
    
    await alert.present();
  }

  async mostrarAlerta(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK']
    });
    
    await alert.present();
  }

  limparFormulario() {
    this.form = {
      nomeEvento: '',
      quantidadeConvidados: null,
      tipoEvento: 'PUBLICO',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      dataEvento: '',
      horario: '',
      sonorizacao: false
    };
    
    // Resetar o formulário
    if (this.orcamentoForm) {
      this.orcamentoForm.resetForm();
    }
  }

  // Validação personalizada
  validarFormulario(): boolean {
    if (!this.form.nomeEvento || !this.form.nomeEvento.trim()) {
      this.mostrarAlerta('Atenção', 'Informe o nome do evento.');
      return false;
    }
    
    if (!this.form.quantidadeConvidados || this.form.quantidadeConvidados < 1) {
      this.mostrarAlerta('Atenção', 'Informe uma quantidade válida de convidados.');
      return false;
    }
    
    if (!this.form.dataEvento) {
      this.mostrarAlerta('Atenção', 'Selecione a data do evento.');
      return false;
    }
    
    if (!this.form.horario) {
      this.mostrarAlerta('Atenção', 'Selecione o horário do evento.');
      return false;
    }
    
    if (!this.form.rua || !this.form.rua.trim()) {
      this.mostrarAlerta('Atenção', 'Informe a rua do evento.');
      return false;
    }
    
    if (!this.form.numero || !this.form.numero.trim()) {
      this.mostrarAlerta('Atenção', 'Informe o número do local.');
      return false;
    }
    
    if (!this.form.bairro || !this.form.bairro.trim()) {
      this.mostrarAlerta('Atenção', 'Informe o bairro do evento.');
      return false;
    }
    
    if (!this.form.cidade || !this.form.cidade.trim()) {
      this.mostrarAlerta('Atenção', 'Informe a cidade do evento.');
      return false;
    }
    
    if (!this.form.estado || !this.form.estado.trim()) {
      this.mostrarAlerta('Atenção', 'Informe o estado do evento.');
      return false;
    }
    
    if (this.form.sonorizacao === undefined || this.form.sonorizacao === null) {
      this.mostrarAlerta('Atenção', 'Informe se há sonorização disponível.');
      return false;
    }
    
    return true;
  }
}