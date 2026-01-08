import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Usuario } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: false
})
export class CadastroPage implements OnInit {
  cadastroForm: FormGroup;
  loading: boolean = false;
  mostrarSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;
  mostrarModalTermos: boolean = false;
  mostrarModalPolitica: boolean = false;
  forcaSenha: string = 'weak';

  // Configuração de datas para validação
  dataMaximaNascimento: string;
  dataMinimaNascimento: string;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Inicializa datas limites
    const hoje = new Date();
    const dataMinima = new Date(hoje.getFullYear() - 120, hoje.getMonth(), hoje.getDate()); // 120 anos atrás
    const dataMaxima = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate()); // 18 anos atrás
    
    this.dataMinimaNascimento = dataMinima.toISOString().split('T')[0];
    this.dataMaximaNascimento = dataMaxima.toISOString().split('T')[0];

    // Inicializa o formulário
    this.cadastroForm = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
      dtNascimento: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
      aceitarTermos: [false, [Validators.requiredTrue]]
    }, { validators: this.senhasConferemValidator });
  }

  ngOnInit() {
    // Se o usuário já estiver logado, redireciona para a página inicial
    if (this.authService.isLoggedIn) {
      this.redirecionarUsuarioLogado();
    }
  }

  // Validador customizado para verificar se as senhas conferem
  senhasConferemValidator(form: FormGroup) {
    const senha = form.get('senha');
    const confirmarSenha = form.get('confirmarSenha');
    
    if (senha && confirmarSenha && senha.value !== confirmarSenha.value) {
      confirmarSenha.setErrors({ senhasNaoConferem: true });
      return { senhasNaoConferem: true };
    }
    return null;
  }

  // Validador customizado para verificar maioridade (18 anos)
  validarMaiorIdade(dataNascimento: string): boolean {
    if (!dataNascimento) return false;

    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade >= 18;
  }

  // Formatar telefone enquanto digita
  formatarTelefone(event: any) {
    let value = event.detail.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    if (value.length <= 10) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    
    this.cadastroForm.get('telefone')?.setValue(value, { emitEvent: false });
  }

  // Validar força da senha
  validarForcaSenha() {
    const senha = this.cadastroForm.get('senha')?.value || '';
    
    if (senha.length < 6) {
      this.forcaSenha = 'weak';
      return;
    }

    let score = 0;
    
    // Comprimento
    if (senha.length >= 8) score++;
    if (senha.length >= 12) score++;
    
    // Caracteres diversificados
    if (/[A-Z]/.test(senha)) score++;
    if (/[0-9]/.test(senha)) score++;
    if (/[^A-Za-z0-9]/.test(senha)) score++;
    
    // Determinar força
    if (score <= 2) {
      this.forcaSenha = 'weak';
    } else if (score <= 4) {
      this.forcaSenha = 'medium';
    } else {
      this.forcaSenha = 'strong';
    }
  }

  getTextoForcaSenha(): string {
    switch (this.forcaSenha) {
      case 'weak': return 'Fraca';
      case 'medium': return 'Média';
      case 'strong': return 'Forte';
      default: return 'Fraca';
    }
  }

  // Alternar visibilidade da senha
  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  // Alternar visibilidade da confirmação de senha
  toggleMostrarConfirmarSenha() {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  // Ver termos de uso
  verTermos(event: Event) {
    event.preventDefault();
    this.mostrarModalTermos = true;
  }

  // Ver política de privacidade
  verPolitica(event: Event) {
    event.preventDefault();
    this.mostrarModalPolitica = true;
  }

  // Fechar modais
  fecharModalTermos() {
    this.mostrarModalTermos = false;
  }

  fecharModalPolitica() {
    this.mostrarModalPolitica = false;
  }

  // Redirecionar usuário já logado
  redirecionarUsuarioLogado() {
    const usuario = this.authService.currentUserValue;
    if (!usuario) return;

    switch (usuario.funcao.toUpperCase()) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'PRODUTOR':
        this.router.navigate(['/produtor']);
        break;
      case 'CONTRATANTE':
        this.router.navigate(['/contratante/dashboard']);
        break;
      case 'MUSICO':
        this.router.navigate(['/musico']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }

  // Método principal de cadastro
  async cadastrar() {
    if (this.cadastroForm.invalid) {
      this.marcarCamposComoSujos();
      await this.mostrarToast('Por favor, preencha todos os campos corretamente', 'warning');
      return;
    }

    // Validação adicional da data de nascimento
    const dtNascimento = this.cadastroForm.get('dtNascimento')?.value;
    if (!this.validarMaiorIdade(dtNascimento)) {
      await this.mostrarAlert('Data de Nascimento', 'Você deve ter pelo menos 18 anos para se cadastrar.');
      return;
    }

    this.loading = true;
    const loading = await this.loadingController.create({
      message: 'Criando sua conta...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      // Cria o objeto usuário - FUNÇÃO DEFINIDA COMO "CONTRATANTE"
      const novoUsuario: Usuario = {
        nome: this.cadastroForm.get('nome')?.value.trim(),
        email: this.cadastroForm.get('email')?.value.toLowerCase().trim(),
        senha: this.cadastroForm.get('senha')?.value,
        funcao: 'CONTRATANTE', // Definido automaticamente como CONTRATANTE
        dtNascimento: dtNascimento,
        telefone: this.cadastroForm.get('telefone')?.value,
        ativo: true
      };

      console.log('Tentando criar usuário:', novoUsuario);

      // Envia para a API
      const usuarioCriado = await this.apiService.createUsuario(novoUsuario).toPromise();
      
      console.log('Usuário criado com sucesso:', usuarioCriado);
      
      // Tenta fazer login automaticamente
      try {
        await this.authService.login(novoUsuario.email, novoUsuario.senha);
        await loading.dismiss();
        await this.mostrarToast('Conta criada com sucesso!', 'success');
        // O AuthService já redireciona automaticamente
      } catch (loginError) {
        // Se o login automático falhar, mostra mensagem e redireciona para login
        await loading.dismiss();
        await this.mostrarToast('Conta criada! Faça login para continuar.', 'success');
        this.router.navigate(['/login']);
      }

    } catch (error: any) {
      await loading.dismiss();
      this.loading = false;
      
      console.error('Erro ao criar conta:', error);
      
      let mensagemErro = 'Erro ao criar conta. Tente novamente.';
      
      if (error.status === 400) {
        mensagemErro = 'Dados inválidos. Verifique as informações e tente novamente.';
      } else if (error.status === 409 || error.status === 500) {
        // Verifica se é erro de email duplicado
        if (error.error?.message?.includes('email') || error.error?.message?.includes('Email')) {
          this.cadastroForm.get('email')?.setErrors({ emailEmUso: true });
          mensagemErro = 'Este email já está cadastrado.';
        } else {
          mensagemErro = 'Erro ao processar seu cadastro. Tente novamente.';
        }
      }
      
      await this.mostrarAlert('Erro no cadastro', mensagemErro);
    }
  }

  // Marca todos os campos como "touched" para mostrar erros
  marcarCamposComoSujos() {
    Object.keys(this.cadastroForm.controls).forEach(key => {
      const control = this.cadastroForm.get(key);
      control?.markAsDirty();
      control?.markAsTouched();
    });
    
    // Dispara validação do formulário
    this.cadastroForm.updateValueAndValidity();
  }

  // Mostrar toast
  async mostrarToast(mensagem: string, cor: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'bottom'
    });
    
    await toast.present();
  }

  // Mostrar alerta
  async mostrarAlert(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK']
    });
    
    await alert.present();
  }

  // Método para obter idade a partir da data de nascimento
  calcularIdade(dataNascimento: string): number {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }

  // Formatar data para exibição
  formatarData(data: string): string {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }
}