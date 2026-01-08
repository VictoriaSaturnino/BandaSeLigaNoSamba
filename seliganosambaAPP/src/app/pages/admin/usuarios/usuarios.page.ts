import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService, Usuario } from '../../../services/api.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: false
})
export class UsuariosPage implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtro: string = '';
  filtroFuncao: string = 'todos'; // Alterado para filtro por função
  loading: boolean = true;

  // Novo usuário para criação
  novoUsuarioObj: Usuario = {
    nome: '',
    email: '',
    senha: '',
    funcao: 'CONTRATANTE',
    dtNascimento: '',
    telefone: '',
    ativo: true
  };

  // Usuário para edição
  usuarioEditando: Usuario | null = null;

  constructor(
    private apiService: ApiService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.loading = true;
    this.apiService.getAllUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.filtrarPorFuncao(); // Aplica filtro inicial
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.loading = false;
      }
    });
  }

  // Método para filtrar por texto de busca
  filtrarUsuarios() {
    if (!this.filtro) {
      this.filtrarPorFuncao();
      return;
    }

    const termo = this.filtro.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo) ||
      usuario.funcao.toLowerCase().includes(termo) ||
      usuario.telefone.toLowerCase().includes(termo)
    );
  }

  // Método para filtrar por função
  filtrarPorFuncao() {
    let usuariosTemp = this.usuarios;

    // Aplica filtro por função
    if (this.filtroFuncao !== 'todos') {
      usuariosTemp = usuariosTemp.filter(u => 
        u.funcao.toUpperCase() === this.filtroFuncao.toUpperCase()
      );
    }

    // Aplica filtro de texto se existir
    if (this.filtro) {
      const termo = this.filtro.toLowerCase();
      usuariosTemp = usuariosTemp.filter(usuario =>
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo) ||
        usuario.funcao.toLowerCase().includes(termo) ||
        usuario.telefone.toLowerCase().includes(termo)
      );
    }

    this.usuariosFiltrados = usuariosTemp;
  }

  // Método para criar novo usuário
  async novoUsuario() {
    const alert = await this.alertController.create({
      header: 'Novo Usuário',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome completo',
          value: this.novoUsuarioObj.nome
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'E-mail',
          value: this.novoUsuarioObj.email
        },
        {
          name: 'senha',
          type: 'password',
          placeholder: 'Senha',
          value: this.novoUsuarioObj.senha
        },
        {
          name: 'funcao',
          type: 'text',
          placeholder: 'Função (ADMIN, PRODUTOR, CONTRATANTE, MUSICO)',
          value: this.novoUsuarioObj.funcao
        },
        {
          name: 'dtNascimento',
          type: 'date',
          placeholder: 'Data de Nascimento',
          value: this.novoUsuarioObj.dtNascimento
        },
        {
          name: 'telefone',
          type: 'tel',
          placeholder: 'Telefone',
          value: this.novoUsuarioObj.telefone
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
            if (this.validarDadosUsuario(data)) {
              const novoUsuario: Usuario = {
                nome: data.nome,
                email: data.email,
                senha: data.senha,
                funcao: data.funcao.toUpperCase(),
                dtNascimento: data.dtNascimento,
                telefone: data.telefone,
                ativo: true
              };
              
              this.criarUsuario(novoUsuario);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para editar usuário
  async editarUsuario(usuario: Usuario) {
    this.usuarioEditando = { ...usuario };

    const alert = await this.alertController.create({
      header: 'Editar Usuário',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome completo',
          value: this.usuarioEditando.nome
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'E-mail',
          value: this.usuarioEditando.email
        },
        {
          name: 'senha',
          type: 'password',
          placeholder: 'Nova senha (deixe em branco para manter)',
          value: ''
        },
        {
          name: 'funcao',
          type: 'text',
          placeholder: 'Função',
          value: this.usuarioEditando.funcao
        },
        {
          name: 'dtNascimento',
          type: 'date',
          placeholder: 'Data de Nascimento',
          value: this.usuarioEditando.dtNascimento
        },
        {
          name: 'telefone',
          type: 'tel',
          placeholder: 'Telefone',
          value: this.usuarioEditando.telefone
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
            if (this.validarDadosUsuario(data, true)) {
              const usuarioAtualizado: Usuario = {
                idUsuario: usuario.idUsuario,
                nome: data.nome,
                email: data.email,
                senha: data.senha || usuario.senha, // Mantém senha atual se não informada
                funcao: data.funcao.toUpperCase(),
                dtNascimento: data.dtNascimento,
                telefone: data.telefone,
                ativo: usuario.ativo,
                dataCadastro: usuario.dataCadastro
              };
              
              this.atualizarUsuario(usuarioAtualizado);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para criar usuário no backend
  criarUsuario(usuario: Usuario) {
    this.apiService.createUsuario(usuario).subscribe({
      next: (novoUsuario) => {
        this.usuarios.push(novoUsuario);
        this.filtrarPorFuncao();
        this.mostrarMensagem('Sucesso', 'Usuário criado com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao criar usuário:', error);
        this.mostrarMensagem('Erro', 'Não foi possível criar o usuário.');
      }
    });
  }

  // Método para atualizar usuário
  atualizarUsuario(usuario: Usuario) {
    this.apiService.updateUsuario(usuario).subscribe({
      next: (usuarioAtualizado) => {
        const index = this.usuarios.findIndex(u => u.idUsuario === usuario.idUsuario);
        if (index !== -1) {
          this.usuarios[index] = usuarioAtualizado;
          this.filtrarPorFuncao();
          this.mostrarMensagem('Sucesso', 'Usuário atualizado com sucesso!');
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar usuário:', error);
        this.mostrarMensagem('Erro', 'Não foi possível atualizar o usuário.');
      }
    });
  }

  // Método para alternar status do usuário
  async alternarStatusUsuario(usuario: Usuario) {
    const alert = await this.alertController.create({
      header: 'Alterar Status',
      message: `Deseja ${usuario.ativo ? 'desativar' : 'ativar'} o usuário ${usuario.nome}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            const novoStatus = !usuario.ativo;
            this.apiService.updateStatusUsuario(usuario.idUsuario!, novoStatus).subscribe({
              next: () => {
                usuario.ativo = novoStatus;
                this.mostrarMensagem('Sucesso', `Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
              },
              error: (error) => {
                console.error('Erro ao atualizar status:', error);
                this.mostrarMensagem('Erro', 'Não foi possível alterar o status.');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para excluir usuário
  async confirmarExclusao(usuario: Usuario) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o usuário ${usuario.nome}? Esta ação não pode ser desfeita.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          cssClass: 'danger',
          handler: () => {
            this.excluirUsuario(usuario.idUsuario!);
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para excluir usuário do backend
  excluirUsuario(id: number) {
    this.apiService.deleteUsuario(id).subscribe({
      next: () => {
        const index = this.usuarios.findIndex(u => u.idUsuario === id);
        if (index !== -1) {
          this.usuarios.splice(index, 1);
          this.filtrarPorFuncao();
          this.mostrarMensagem('Sucesso', 'Usuário excluído com sucesso!');
        }
      },
      error: (error) => {
        console.error('Erro ao excluir usuário:', error);
        this.mostrarMensagem('Erro', 'Não foi possível excluir o usuário.');
      }
    });
  }

  // Validação dos dados do usuário
  validarDadosUsuario(data: any, edicao: boolean = false): boolean {
    if (!data.nome || data.nome.trim().length < 3) {
      this.mostrarMensagem('Erro', 'Nome deve ter pelo menos 3 caracteres.');
      return false;
    }

    if (!data.email || !this.validarEmail(data.email)) {
      this.mostrarMensagem('Erro', 'E-mail inválido.');
      return false;
    }

    if (!edicao && (!data.senha || data.senha.length < 3)) {
      this.mostrarMensagem('Erro', 'Senha deve ter pelo menos 3 caracteres.');
      return false;
    }

    const funcoesValidas = ['ADMIN', 'PRODUTOR', 'CONTRATANTE', 'MUSICO'];
    if (!funcoesValidas.includes(data.funcao.toUpperCase())) {
      this.mostrarMensagem('Erro', `Função inválida. Use: ${funcoesValidas.join(', ')}`);
      return false;
    }

    if (!data.telefone || data.telefone.trim().length < 10) {
      this.mostrarMensagem('Erro', 'Telefone inválido.');
      return false;
    }

    return true;
  }

  // Validação de e-mail
  validarEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Método para mostrar mensagens
  async mostrarMensagem(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK']
    });

    await alert.present();
  }

  // Método para formatar data
  formatarData(data: string): string {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  // Método para obter a cor do badge baseado na função
  getCorFuncao(funcao: string): string {
    switch (funcao.toUpperCase()) {
      case 'ADMIN':
        return 'danger';
      case 'PRODUTOR':
        return 'success';
      case 'CONTRATANTE':
        return 'primary';
      case 'MUSICO':
        return 'warning';
      default:
        return 'medium';
    }
  }
}