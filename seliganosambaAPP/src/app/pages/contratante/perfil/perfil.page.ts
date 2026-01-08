import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Usuario } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {
  perfilForm: FormGroup;
  usuario: Usuario | null = null;
  loading: boolean = false;
  
  mostrarSenha: boolean = false;
  mostrarSenhaAtual: boolean = false;
  mostrarNovaSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;
  
  estatisticas = {
    totalEventos: 0,
    totalContratos: 0
  };

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {
    this.perfilForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      dtNascimento: ['', Validators.required],
      telefone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
      senhaAtual: [''],
      novaSenha: ['', [Validators.minLength(6)]],
      confirmarSenha: ['']
    }, { validators: this.validarSenhas });
  }

  ngOnInit() {
    this.carregarUsuario();
    this.carregarEstatisticas();
  }

async carregarUsuario() {
  // CORREÇÃO: Usar a chave correta 'current_user' em vez de 'usuario'
  const usuarioStr = localStorage.getItem('current_user');
  if (usuarioStr) {
    this.usuario = JSON.parse(usuarioStr);
    
    if (this.usuario) {
      this.perfilForm.patchValue({
        nome: this.usuario.nome,
        email: this.usuario.email,
        dtNascimento: this.formatarDataParaInput(this.usuario.dtNascimento),
        telefone: this.usuario.telefone || ''
      });
    }
  }
}

  async carregarEstatisticas() {
    if (!this.usuario?.idUsuario) return;
    
    try {
      const agendamentos = await this.apiService.getAgendamentosByUsuario(this.usuario.idUsuario).toPromise();
      this.estatisticas.totalEventos = agendamentos?.length || 0;
      
      if (agendamentos && agendamentos.length > 0) {
        const contratosPromises = agendamentos.map(agendamento => 
          this.apiService.getContratoByAgendamento(agendamento.idAgendamento!).toPromise()
        );
        
        const contratosResultados = await Promise.all(contratosPromises);
        this.estatisticas.totalContratos = contratosResultados.filter(c => c !== null && c !== undefined).length;
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }

  validarSenhas: ValidatorFn = (control: AbstractControl) => {
    const novaSenha = control.get('novaSenha')?.value;
    const confirmarSenha = control.get('confirmarSenha')?.value;
    
    if (novaSenha && confirmarSenha && novaSenha !== confirmarSenha) {
      control.get('confirmarSenha')?.setErrors({ senhasNaoCoincidem: true });
      return { senhasNaoCoincidem: true };
    }
    
    return null;
  };

  formatarDataParaInput(data: string | undefined): string {
    if (!data) return '';
    
    try {
      const date = new Date(data);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  }

  formatarData(data: string | undefined): string {
    if (!data) return 'N/A';
    
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }

  formatarDataHora(data: string | undefined): string {
    if (!data) return 'N/A';
    
    try {
      const date = new Date(data);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data/hora:', error);
      return 'Data inválida';
    }
  }

  formatarTelefone(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length > 10) {
      value = value.substring(0, 11);
    }
    
    if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{4})/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/(\d{2})/, '($1) ');
    }
    
    this.perfilForm.patchValue({ telefone: value });
  }

  toggleAlterarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
    
    if (!this.mostrarSenha) {
      this.perfilForm.patchValue({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
      this.perfilForm.get('novaSenha')?.clearValidators();
      this.perfilForm.get('confirmarSenha')?.clearValidators();
      this.perfilForm.get('novaSenha')?.updateValueAndValidity();
      this.perfilForm.get('confirmarSenha')?.updateValueAndValidity();
    } else {
      this.perfilForm.get('novaSenha')?.setValidators([Validators.minLength(6)]);
      this.perfilForm.get('confirmarSenha')?.setValidators([Validators.required]);
      this.perfilForm.get('novaSenha')?.updateValueAndValidity();
      this.perfilForm.get('confirmarSenha')?.updateValueAndValidity();
    }
  }

  toggleMostrarSenha(tipo: string) {
    switch (tipo) {
      case 'atual':
        this.mostrarSenhaAtual = !this.mostrarSenhaAtual;
        break;
      case 'nova':
        this.mostrarNovaSenha = !this.mostrarNovaSenha;
        break;
      case 'confirmar':
        this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
        break;
    }
  }

  get temMinimoCaracteres(): boolean {
    const senha = this.perfilForm.get('novaSenha')?.value;
    return senha && senha.length >= 6;
  }

  get temMaiuscula(): boolean {
    const senha = this.perfilForm.get('novaSenha')?.value;
    return senha && /[A-Z]/.test(senha);
  }

  get temNumero(): boolean {
    const senha = this.perfilForm.get('novaSenha')?.value;
    return senha && /[0-9]/.test(senha);
  }

async salvarAlteracoes() {
  if (this.perfilForm.invalid) {
    this.mostrarToast('Preencha todos os campos corretamente', 'warning');
    return;
  }

  // Valida se a senha atual está correta (se for alterar senha)
  if (this.mostrarSenha && this.perfilForm.get('senhaAtual')?.value) {
    const senhaAtualDigitada = this.perfilForm.get('senhaAtual')?.value;
    const senhaAtualCorreta = this.usuario?.senha;
    
    if (senhaAtualDigitada !== senhaAtualCorreta) {
      this.mostrarToast('Senha atual incorreta', 'danger');
      return;
    }
  }

  const loading = await this.loadingController.create({
    message: 'Salvando alterações...'
  });
  await loading.present();
  this.loading = true;

  try {
    const formData = this.perfilForm.value;
    const usuarioAtualizado: Usuario = {
      idUsuario: this.usuario!.idUsuario,
      nome: formData.nome,
      email: formData.email,
      dtNascimento: formData.dtNascimento,
      telefone: formData.telefone,
      funcao: this.usuario!.funcao,
      senha: formData.novaSenha || this.usuario!.senha
    };

    await this.apiService.updateUsuario(usuarioAtualizado).toPromise();
    
    // Cria um novo objeto sem a senha para salvar no localStorage
    const usuarioParaSalvar = {
      idUsuario: usuarioAtualizado.idUsuario,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      dtNascimento: usuarioAtualizado.dtNascimento,
      telefone: usuarioAtualizado.telefone,
      funcao: usuarioAtualizado.funcao,
      dataCadastro: this.usuario?.dataCadastro,
      ativo: this.usuario?.ativo
    };
    
    localStorage.setItem('usuario', JSON.stringify(usuarioParaSalvar));
    
    // Atualiza o usuário local (sem a senha)
    this.usuario = {
      ...usuarioParaSalvar,
      senha: '' // Deixa vazia no objeto local por segurança
    } as Usuario;

    await loading.dismiss();
    this.loading = false;
    
    this.mostrarToast('Perfil atualizado com sucesso!', 'success');
    
  } catch (error) {
    await loading.dismiss();
    this.loading = false;
    console.error('Erro ao atualizar perfil:', error);
    this.mostrarToast('Erro ao atualizar perfil. Tente novamente.', 'danger');
  }
}

  async exportarDados() {
    const loading = await this.loadingController.create({
      message: 'Preparando dados para exportação...'
    });
    await loading.present();

    try {
      if (!this.usuario?.idUsuario) throw new Error('Usuário não encontrado');

      const agendamentos = await this.apiService.getAgendamentosByUsuario(this.usuario.idUsuario).toPromise();
      
      const contratosCompletos = [];
      if (agendamentos && agendamentos.length > 0) {
        for (const agendamento of agendamentos) {
          try {
            const contrato = await this.apiService.getContratoByAgendamento(agendamento.idAgendamento!).toPromise();
            if (contrato) {
              contratosCompletos.push({
                agendamento,
                contrato
              });
            }
          } catch (error) {
            console.error(`Erro ao buscar contrato para agendamento ${agendamento.idAgendamento}:`, error);
          }
        }
      }

      const dadosExportacao = {
        usuario: {
          idUsuario: this.usuario.idUsuario,
          nome: this.usuario.nome,
          email: this.usuario.email,
          funcao: this.usuario.funcao,
          dtNascimento: this.usuario.dtNascimento,
          telefone: this.usuario.telefone,
          dataCadastro: this.usuario.dataCadastro
        },
        estatisticas: this.estatisticas,
        agendamentos: agendamentos?.map(a => ({
          idAgendamento: a.idAgendamento,
          nomeEvento: a.nomeEvento,
          dataEvento: a.dataEvento,
          horario: a.horario,
          cidade: a.cidade,
          status: a.aprovado ? 'Aprovado' : 'Pendente',
          orcamento: a.orcamento
        })) || [],
        contratos: contratosCompletos.map(c => ({
          idContrato: c.contrato.idContrato,
          valor: c.contrato.valor,
          status: c.contrato.assinaturaContratante && c.contrato.assinaturaProdutor ? 'Assinado' : 'Pendente'
        })),
        dataExportacao: new Date().toISOString()
      };

      const dadosStr = JSON.stringify(dadosExportacao, null, 2);
      const blob = new Blob([dadosStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      a.href = url;
      a.download = `dados_usuario_${this.usuario.idUsuario}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await loading.dismiss();
      this.mostrarToast('Dados exportados com sucesso!', 'success');
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao exportar dados:', error);
      this.mostrarToast('Erro ao exportar dados', 'danger');
    }
  }

  async solicitarExclusaoConta() {
    const alert = await this.alertController.create({
      header: 'Solicitar Exclusão da Conta',
      message: `
        <p><strong>Atenção!</strong> Esta ação não pode ser desfeita.</p>
        <p>Ao solicitar a exclusão da sua conta:</p>
        <ul>
          <li>Todos os seus dados pessoais serão removidos</li>
          <li>Seus agendamentos serão cancelados</li>
          <li>Contratos vinculados serão arquivados</li>
          <li>Você perderá acesso ao sistema</li>
        </ul>
        <p>Tem certeza que deseja continuar?</p>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Solicitar Exclusão',
          role: 'destructive',
          handler: async () => {
            await this.confirmarExclusaoConta();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarExclusaoConta() {
    const loading = await this.loadingController.create({
      message: 'Processando solicitação...'
    });
    await loading.present();

    try {
      // Simula o processo de exclusão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await loading.dismiss();
      
      const confirmacao = await this.alertController.create({
        header: 'Solicitação Enviada',
        message: 'Sua solicitação de exclusão de conta foi registrada. Nossa equipe entrará em contato em breve.',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.logout();
              return true;
            }
          }
        ]
      });

      await confirmacao.present();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao solicitar exclusão:', error);
      this.mostrarToast('Erro ao solicitar exclusão', 'danger');
    }
  }

  logout() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
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

  alterarFoto() {
    this.mostrarToast('Funcionalidade em desenvolvimento', 'warning');
  }
}