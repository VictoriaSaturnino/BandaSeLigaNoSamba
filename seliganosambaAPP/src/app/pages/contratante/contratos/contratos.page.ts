import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService, Contrato, Agendamento, Usuario } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-contratos',
  templateUrl: './contratos.page.html',
  styleUrls: ['./contratos.page.scss'],
  standalone: false
})
export class ContratosPage implements OnInit {
  contratos: Contrato[] = [];
  agendamentos: Agendamento[] = [];
  usuarios: Usuario[] = [];
  loading: boolean = true;
  
  // Novas propriedades para filtros e busca
  termoBusca: string = '';
  contratosFiltrados: Contrato[] = [];
  filtroAtivo: string = 'todos';
  gerandoPDF: boolean = false;
  
  // Estatísticas
  contratosAssinados: Contrato[] = [];
  contratosPendentes: Contrato[] = [];
  contratosVencidos: Contrato[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  async carregarDados() {
    this.loading = true;
    const usuarioId = this.authService.currentUserValue?.idUsuario;
    
    if (!usuarioId) {
      this.mostrarToast('Usuário não autenticado', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    try {
      // Carrega agendamentos do usuário
      const agendamentos = await this.apiService.getAgendamentosByUsuario(usuarioId).toPromise();
      this.agendamentos = agendamentos || [];
      
      // Carrega todos os usuários para obter dados do produtor
      const todosUsuarios = await this.apiService.getAllUsuarios().toPromise();
      this.usuarios = todosUsuarios || [];
      
      // Carrega contratos vinculados aos agendamentos do usuário
      const contratosPromises = this.agendamentos.map(agendamento => 
        this.apiService.getContratoByAgendamento(agendamento.idAgendamento!).toPromise()
      );
      
      const contratosResultados = await Promise.all(contratosPromises);
      this.contratos = contratosResultados.filter(contrato => contrato !== null && contrato !== undefined) as Contrato[];
      
      this.calcularEstatisticas();
      this.filtrarContratos('todos'); // Inicializa com todos os contratos
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      this.mostrarToast('Erro ao carregar contratos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  calcularEstatisticas() {
    this.contratosAssinados = this.contratos.filter(c => 
      c.assinaturaContratante && c.assinaturaProdutor
    );
    
    this.contratosPendentes = this.contratos.filter(c => 
      !c.assinaturaContratante || !c.assinaturaProdutor
    );
    
    this.contratosVencidos = this.contratos.filter(c => {
      const agendamento = this.agendamentos.find(a => a.idAgendamento === c.idAgendamento);
      if (!agendamento) return false;
      
      const dataEvento = new Date(agendamento.dataEvento);
      const hoje = new Date();
      return dataEvento < hoje;
    });
  }

  // Método para buscar contratos
  buscarContratos() {
    if (!this.termoBusca.trim()) {
      this.contratosFiltrados = this.contratos;
      this.filtroAtivo = 'todos';
      return;
    }
    
    const termo = this.termoBusca.toLowerCase().trim();
    this.contratosFiltrados = this.contratos.filter(contrato => 
      this.getNomeEvento(contrato.idAgendamento).toLowerCase().includes(termo) ||
      contrato.idContrato?.toString().includes(termo) ||
      this.formatarValor(contrato.valor).toLowerCase().includes(termo)
    );
    this.filtroAtivo = 'busca';
  }

  // Método para filtrar por status
  filtrarContratos(status: string) {
    this.filtroAtivo = status;
    this.termoBusca = ''; // Limpa a busca quando usa filtro
    
    switch (status) {
      case 'assinados':
        this.contratosFiltrados = this.contratosAssinados;
        break;
      case 'pendentes':
        this.contratosFiltrados = this.contratosPendentes;
        break;
      case 'vencidos':
        this.contratosFiltrados = this.contratosVencidos;
        break;
      default:
        this.contratosFiltrados = this.contratos;
        break;
    }
  }

  // Método para verificar se contrato está vencido
  isContratoVencido(contrato: Contrato): boolean {
    const agendamento = this.agendamentos.find(a => a.idAgendamento === contrato.idAgendamento);
    if (!agendamento || !agendamento.dataEvento) return false;
    
    const dataEvento = new Date(agendamento.dataEvento);
    const hoje = new Date();
    return dataEvento < hoje;
  }

  // Método para ordenar por data
  ordenarPorData() {
    const listaOrdenar = this.filtroAtivo === 'busca' ? this.contratosFiltrados : this.contratos;
    
    listaOrdenar.sort((a, b) => {
      const dataA = new Date(a.dataCriacao || '').getTime();
      const dataB = new Date(b.dataCriacao || '').getTime();
      return dataB - dataA; // Mais recente primeiro
    });
    
    // Atualiza visualização
    if (this.filtroAtivo === 'busca') {
      this.contratosFiltrados = [...listaOrdenar];
    } else {
      this.filtrarContratos(this.filtroAtivo);
    }
    
    this.mostrarToast('Contratos ordenados por data (mais recente primeiro)', 'success');
  }

  // Método para limpar busca
  limparBusca() {
    this.termoBusca = '';
    this.contratosFiltrados = this.contratos;
    this.filtroAtivo = 'todos';
  }

  // Métodos auxiliares
  getNomeEvento(idAgendamento: number): string {
    const agendamento = this.agendamentos.find(a => a.idAgendamento === idAgendamento);
    return agendamento?.nomeEvento || 'Evento não encontrado';
  }

  getStatusClass(contrato: Contrato): string {
    if (contrato.assinaturaContratante && contrato.assinaturaProdutor) {
      return 'assinado';
    }
    return 'pendente';
  }

  getStatusIcon(contrato: Contrato): string {
    if (contrato.assinaturaContratante && contrato.assinaturaProdutor) {
      return 'checkmark-circle-outline';
    }
    return 'time-outline';
  }

  getStatusTexto(contrato: Contrato): string {
    if (contrato.assinaturaContratante && contrato.assinaturaProdutor) {
      return 'Assinado';
    }
    return 'Pendente';
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

  formatarDataCompleta(data: string | undefined): string {
    if (!data) return 'N/A';
    
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Ações
  async visualizarContrato(contrato: Contrato) {
    const agendamento = this.agendamentos.find(a => a.idAgendamento === contrato.idAgendamento);
    const usuarioContratante = this.usuarios.find(u => u.idUsuario === agendamento?.idUsuario);
    
    const alert = await this.alertController.create({
      header: 'Contrato #' + contrato.idContrato,
      message: `
        <div style="text-align: left;">
          <p><strong>Evento:</strong> ${this.getNomeEvento(contrato.idAgendamento)}</p>
          <p><strong>Valor:</strong> ${this.formatarValor(contrato.valor)}</p>
          <p><strong>Status:</strong> ${this.getStatusContrato(contrato)}</p>
          <p><strong>Contratante:</strong> ${usuarioContratante?.nome || 'Não encontrado'}</p>
          <p><strong>Assinatura Produtor:</strong> ${contrato.assinaturaProdutor ? '✅ Assinado' : '⏳ Pendente'}</p>
          <p><strong>Assinatura Contratante:</strong> ${contrato.assinaturaContratante ? '✅ Assinado' : '⏳ Pendente'}</p>
          <p><strong>Criado em:</strong> ${this.formatarDataCompleta(contrato.dataCriacao)}</p>
          ${contrato.dataAssinatura ? `<p><strong>Assinado em:</strong> ${this.formatarDataCompleta(contrato.dataAssinatura)}</p>` : ''}
          <p><strong>Evento:</strong> ${agendamento?.dataEvento ? this.formatarData(agendamento.dataEvento) : 'N/A'}</p>
          <p><strong>Local:</strong> ${agendamento?.cidade || ''}, ${agendamento?.bairro || ''}</p>
        </div>
      `,
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel'
        },
        {
          text: 'Baixar PDF',
          cssClass: 'primary',
          handler: () => {
            this.baixarContrato(contrato);
          }
        }
      ]
    });

    await alert.present();
  }

  async assinarContrato(contrato: Contrato) {
    const alert = await this.alertController.create({
      header: 'Assinar Contrato',
      message: `Deseja assinar o contrato #${contrato.idContrato}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Assinar',
          cssClass: 'success',
          handler: () => {
            this.assinarContratoConfirmado(contrato.idContrato!);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async assinarContratoConfirmado(idContrato: number) {
    const loading = await this.loadingController.create({
      message: 'Assinando contrato...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.apiService.updateAssinaturasContrato(
        idContrato,
        true, // Mantém assinatura do produtor
        true  // Adiciona assinatura do contratante
      ).toPromise();
      
      await loading.dismiss();
      this.mostrarToast('Contrato assinado com sucesso!', 'success');
      this.carregarDados();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Erro ao assinar contrato:', error);
      this.mostrarToast('Erro ao assinar contrato', 'danger');
    }
  }

  // MÉTODO DE BAIXAR CONTRATO ATUALIZADO - com loading
  async baixarContrato(contrato: Contrato) {
    this.gerandoPDF = true;
    try {
      await this.gerarPDF(contrato);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      this.mostrarToast('Erro ao gerar PDF', 'danger');
    } finally {
      this.gerandoPDF = false;
    }
  }

  // MÉTODO ATUALIZADO: Gerar PDF com assinaturas reais (baseado no segundo código)
  async gerarPDF(contrato: Contrato) {
    // Buscar informações do agendamento
    const agendamento = this.agendamentos.find(a => a.idAgendamento === contrato.idAgendamento);
    
    if (!agendamento) {
      this.mostrarToast('Agendamento não encontrado para este contrato.', 'danger');
      return;
    }

    // Buscar informações do contratante
    const usuarioContratante = this.usuarios.find(u => u.idUsuario === agendamento.idUsuario);
    
    // Determinar status das assinaturas
    const assinaturaProdutor = contrato.assinaturaProdutor;
    const assinaturaContratante = contrato.assinaturaContratante;
    const dataAssinatura = contrato.dataAssinatura ? this.formatarDataCompleta(contrato.dataAssinatura) : 'Pendente';

    // Preparar dados para o PDF
    const dadosContrato = {
      nomeEvento: agendamento.nomeEvento || 'Evento não especificado',
      contratante: usuarioContratante ? usuarioContratante.nome : 'Contratante não encontrado',
      data: this.formatarDataApenasData(agendamento.dataEvento),
      horario: agendamento.horario || 'Não especificado',
      qtd: agendamento.quantidadeConvidados?.toString() || '0',
      rua: agendamento.rua || 'Não especificado',
      numero: agendamento.numero || 'SN',
      bairro: agendamento.bairro || 'Não especificado',
      cidade: agendamento.cidade || 'Não especificado',
      estado: agendamento.estado || 'Não especificado',
      sonorizacao: agendamento.sonorizacao ? 'Sim' : 'Não',
      tipo: agendamento.tipoEvento || 'Não especificado',
      valorContrato: this.formatarValor(contrato.valor),
      idContrato: contrato.idContrato,
      dataContrato: this.formatarDataCompleta(contrato.dataCriacao || ''),
      dataAssinatura: dataAssinatura,
      assinaturaProdutor: assinaturaProdutor,
      assinaturaContratante: assinaturaContratante,
      statusContrato: this.getStatusContrato(contrato),
      statusCor: this.getStatusColor(contrato)
    };

    // Criar conteúdo HTML para o PDF
    const htmlContent = this.criarHTMLContrato(dadosContrato);

    // Criar um elemento temporário para renderizar o HTML
    const elemento = document.createElement('div');
    elemento.style.position = 'absolute';
    elemento.style.left = '-9999px';
    elemento.innerHTML = htmlContent;
    document.body.appendChild(elemento);

    try {
      // Converter HTML para canvas
      const canvas = await html2canvas(elemento, {
        scale: 2, // Melhor qualidade
        useCORS: true,
        logging: false
      });

      // Criar PDF
      const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calcular dimensões para caber no A4
      const imgWidth = 190; // Largura máxima no A4 (210mm - margens)
      const pageHeight = 295; // Altura do A4 (297mm - margens)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Margem superior

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar o PDF
      const nomeArquivo = `Contrato_${dadosContrato.nomeEvento.replace(/\s+/g, '_')}_${dadosContrato.idContrato}.pdf`;
      pdf.save(nomeArquivo);

      this.mostrarToast(`PDF gerado: ${nomeArquivo}`, 'success');

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      this.mostrarToast('Não foi possível gerar o PDF.', 'danger');
    } finally {
      // Remover elemento temporário
      document.body.removeChild(elemento);
    }
  }

// Método para obter status do contrato - MUDADO DE PRIVATE PARA PUBLIC
getStatusContrato(contrato: Contrato): string {
  if (contrato.assinaturaProdutor && contrato.assinaturaContratante) {
    return 'Assinado';
  } else if (contrato.assinaturaProdutor || contrato.assinaturaContratante) {
    return 'Assinatura Parcial';
  } else {
    return 'Pendente';
  }
}

// Método para obter cor do status - MUDADO DE PRIVATE PARA PUBLIC
getStatusColor(contrato: Contrato): string {
  if (contrato.assinaturaProdutor && contrato.assinaturaContratante) {
    return 'assinado';
  } else if (contrato.assinaturaProdutor || contrato.assinaturaContratante) {
    return 'parcial';
  } else {
    return 'pendente';
  }
}

// Método auxiliar para formatar apenas data - MANTIDO PRIVATE (não usado no template)
private formatarDataApenasData(data: string): string {
  if (!data) return 'N/A';
  return new Date(data).toLocaleDateString('pt-BR');
}

  // Método para criar o HTML do contrato COM ASSINATURAS REAIS
  private criarHTMLContrato(dados: any): string {
    // Determinar texto das assinaturas
    const textoProdutor = dados.assinaturaProdutor 
      ? `ASSINADO EM: ${dados.dataAssinatura}`
      : 'AGUARDANDO ASSINATURA';
    
    const textoContratante = dados.assinaturaContratante 
      ? `ASSINADO EM: ${dados.dataAssinatura}`
      : 'AGUARDANDO ASSINATURA';

    // Determinar ícones das assinaturas
    const iconeProdutor = dados.assinaturaProdutor ? '✓' : '⏳';
    const iconeContratante = dados.assinaturaContratante ? '✓' : '⏳';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato - ${dados.nomeEvento}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            
            body { 
              font-family: 'Roboto', Arial, sans-serif; 
              padding: 30px;
              color: #333;
              background-color: #f9f9f9;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2c3e50;
            }
            
            h1 { 
              color: #2c3e50;
              font-size: 28px;
              margin: 0 0 10px 0;
              font-weight: 700;
            }
            
            .subtitle {
              color: #7f8c8d;
              font-size: 16px;
              margin: 0;
            }
            
            .contract-info {
              background: white;
              border-radius: 10px;
              padding: 25px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
              margin-bottom: 20px;
            }
            
            .field { 
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
              display: flex;
            }
            
            .label { 
              font-weight: 600;
              color: #2c3e50;
              min-width: 200px;
            }
            
            .value {
              color: #34495e;
              flex: 1;
            }
            
            .signature-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #ddd;
            }
            
            .signature-box {
              display: inline-block;
              width: 45%;
              margin: 0 2%;
              text-align: center;
              padding: 20px;
              border-radius: 5px;
              background: #f8f9fa;
            }
            
            .assinado {
              border: 2px solid #27ae60;
              background: #e8f5e9;
            }
            
            .pendente {
              border: 2px solid #e74c3c;
              background: #fdedec;
            }
            
            .parcial {
              border: 2px solid #f39c12;
              background: #fef5e7;
            }
            
            .signature-line {
              border-top: 1px solid #333;
              margin: 20px 0 10px 0;
              width: 100%;
            }
            
            .signature-label {
              font-size: 14px;
              color: #7f8c8d;
            }
            
            .signature-status {
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0;
            }
            
            .assinado .signature-status {
              color: #27ae60;
            }
            
            .pendente .signature-status {
              color: #e74c3c;
            }
            
            .parcial .signature-status {
              color: #f39c12;
            }
            
            .signature-icon {
              font-size: 24px;
              margin-bottom: 10px;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #95a5a6;
              font-size: 12px;
            }
            
            .valor-destaque {
              background: #e8f5e9;
              padding: 10px;
              border-radius: 5px;
              font-size: 18px;
              font-weight: 700;
              color: #27ae60;
              text-align: center;
              margin: 20px 0;
            }
            
            .contract-id {
              background: #e3f2fd;
              padding: 5px 10px;
              border-radius: 5px;
              font-size: 14px;
              color: #1976d2;
              display: inline-block;
            }
            
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-left: 10px;
            }
            
            .assinado-badge {
              background: #27ae60;
              color: white;
            }
            
            .parcial-badge {
              background: #f39c12;
              color: white;
            }
            
            .pendente-badge {
              background: #e74c3c;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CONTRATO / PRÉ-ORÇAMENTO</h1>
            <p class="subtitle">Banda Se Liga No Samba - Sistema de Gerenciamento</p>
            <div class="contract-id">
              Contrato #${dados.idContrato} - Emitido em: ${dados.dataContrato}
              <span class="status-badge ${dados.statusCor}-badge">${dados.statusContrato}</span>
            </div>
          </div>
          
          <div class="contract-info">
            <div class="valor-destaque">
              VALOR DO CONTRATO: ${dados.valorContrato}
            </div>
            
            <div class="field">
              <span class="label">Evento:</span>
              <span class="value">${dados.nomeEvento}</span>
            </div>
            
            <div class="field">
              <span class="label">Contratante:</span>
              <span class="value">${dados.contratante}</span>
            </div>
            
            <div class="field">
              <span class="label">Data do Evento:</span>
              <span class="value">${dados.data}</span>
            </div>
            
            <div class="field">
              <span class="label">Horário:</span>
              <span class="value">${dados.horario}</span>
            </div>
            
            <div class="field">
              <span class="label">Quantidade de Convidados:</span>
              <span class="value">${dados.qtd} pessoas</span>
            </div>
            
            <div class="field">
              <span class="label">Endereço:</span>
              <span class="value">${dados.rua}, ${dados.numero}</span>
            </div>
            
            <div class="field">
              <span class="label">Bairro:</span>
              <span class="value">${dados.bairro}</span>
            </div>
            
            <div class="field">
              <span class="label">Cidade/Estado:</span>
              <span class="value">${dados.cidade} / ${dados.estado}</span>
            </div>
            
            <div class="field">
              <span class="label">Sonorização Incluída:</span>
              <span class="value">${dados.sonorizacao}</span>
            </div>
            
            <div class="field">
              <span class="label">Tipo de Evento:</span>
              <span class="value">${dados.tipo}</span>
            </div>
            
            ${dados.dataAssinatura !== 'Pendente' ? `
            <div class="field">
              <span class="label">Data da Assinatura:</span>
              <span class="value">${dados.dataAssinatura}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="signature-section">
            <h2 style="text-align: center; color: #2c3e50;">STATUS DAS ASSINATURAS</h2>
            
            <div class="signature-box ${dados.assinaturaProdutor ? 'assinado' : 'pendente'}">
              <div class="signature-icon">${iconeProdutor}</div>
              <h3>PRODUTOR</h3>
              <div class="signature-line"></div>
              <p class="signature-status">${dados.assinaturaProdutor ? 'ASSINADO' : 'PENDENTE'}</p>
              <p class="signature-label">${textoProdutor}</p>
              <p><strong>Representante da Banda</strong></p>
            </div>
            
            <div class="signature-box ${dados.assinaturaContratante ? 'assinado' : 'pendente'}">
              <div class="signature-icon">${iconeContratante}</div>
              <h3>CONTRATANTE</h3>
              <div class="signature-line"></div>
              <p class="signature-status">${dados.assinaturaContratante ? 'ASSINADO' : 'PENDENTE'}</p>
              <p class="signature-label">${textoContratante}</p>
              <p><strong>${dados.contratante}</strong></p>
            </div>
          </div>
          
          <div class="footer">
            <p>Banda Se Liga No Samba | CNPJ: XX.XXX.XXX/XXXX-XX | Telefone: (31) 99531-5660</p>
            <p>Email: contato@seliganosamba.com | Endereço: Timóteo - Minas Gerais</p>
            <p>Este documento foi gerado automaticamente pelo sistema de gerenciamento.</p>
            <p><strong>Documento válido apenas com assinaturas reconhecidas.</strong></p>
          </div>
        </body>
      </html>
    `;
  }

  verContratoAssinatura() {
    if (this.contratosPendentes.length > 0) {
      this.assinarContrato(this.contratosPendentes[0]);
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