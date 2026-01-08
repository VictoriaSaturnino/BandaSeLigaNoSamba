import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService, Contrato, Agendamento, Usuario } from '../../../services/api.service';
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
  contratosFiltrados: Contrato[] = [];
  agendamentos: Agendamento[] = [];
  usuarios: Usuario[] = [];
  
  filtro: string = '';
  filtroStatus: string = 'todos';
  loading: boolean = true;

  // Estatísticas
  contratosAssinados: Contrato[] = [];
  contratosPendentes: Contrato[] = [];
  contratosParciais: Contrato[] = [];

  constructor(
    private apiService: ApiService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarContratos();
    this.carregarAgendamentos();
    this.carregarUsuarios();
  }

  carregarContratos() {
    this.loading = true;
    this.apiService.getAllContratos().subscribe({
      next: (contratos) => {
        this.contratos = contratos;
        this.calcularEstatisticas();
        this.filtrarContratos();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar contratos:', error);
        this.loading = false;
      }
    });
  }

  carregarAgendamentos() {
    this.apiService.getAllAgendamentos().subscribe({
      next: (agendamentos) => {
        this.agendamentos = agendamentos;
      },
      error: (error) => {
        console.error('Erro ao carregar agendamentos:', error);
      }
    });
  }

  carregarUsuarios() {
    this.apiService.getAllUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
      }
    });
  }

  calcularEstatisticas() {
    this.contratosAssinados = this.contratos.filter(c => 
      c.assinaturaProdutor && c.assinaturaContratante
    );
    
    this.contratosPendentes = this.contratos.filter(c => 
      !c.assinaturaProdutor && !c.assinaturaContratante
    );
    
    this.contratosParciais = this.contratos.filter(c => 
      (c.assinaturaProdutor && !c.assinaturaContratante) ||
      (!c.assinaturaProdutor && c.assinaturaContratante)
    );
  }

  filtrarContratos() {
    let contratosTemp = this.contratos;

    // Filtrar por status
    switch (this.filtroStatus) {
      case 'pendentes':
        contratosTemp = contratosTemp.filter(c => 
          !c.assinaturaProdutor && !c.assinaturaContratante
        );
        break;
      case 'assinados':
        contratosTemp = contratosTemp.filter(c => 
          c.assinaturaProdutor && c.assinaturaContratante
        );
        break;
      case 'parciais':
        contratosTemp = contratosTemp.filter(c => 
          (c.assinaturaProdutor && !c.assinaturaContratante) ||
          (!c.assinaturaProdutor && c.assinaturaContratante)
        );
        break;
    }

    // Filtrar por texto
    if (this.filtro) {
      const termo = this.filtro.toLowerCase();
      contratosTemp = contratosTemp.filter(contrato => 
        contrato.idContrato?.toString().includes(termo) ||
        contrato.idAgendamento?.toString().includes(termo) ||
        contrato.valor.toString().includes(termo) ||
        (contrato.pdf && contrato.pdf.toLowerCase().includes(termo))
      );
    }

    this.contratosFiltrados = contratosTemp;
  }

  getStatusContrato(contrato: Contrato): string {
    if (contrato.assinaturaProdutor && contrato.assinaturaContratante) {
      return 'Assinado';
    } else if (contrato.assinaturaProdutor || contrato.assinaturaContratante) {
      return 'Assinatura Parcial';
    } else {
      return 'Pendente';
    }
  }

  getStatusColor(contrato: Contrato): string {
    if (contrato.assinaturaProdutor && contrato.assinaturaContratante) {
      return 'success';
    } else if (contrato.assinaturaProdutor || contrato.assinaturaContratante) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  async novoContrato() {
    // Filtrar agendamentos que ainda não têm contrato
    const agendamentosSemContrato = this.agendamentos.filter(agendamento => 
      !this.contratos.some(contrato => contrato.idAgendamento === agendamento.idAgendamento)
    );

    if (agendamentosSemContrato.length === 0) {
      this.mostrarMensagem('Info', 'Todos os agendamentos já possuem contrato.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Novo Contrato',
      subHeader: 'Selecione um agendamento',
      inputs: agendamentosSemContrato.map(agendamento => ({
        name: agendamento.idAgendamento?.toString() || '',
        type: 'radio',
        label: `${agendamento.nomeEvento} - ${this.formatarData(agendamento.dataEvento)} - ${this.formatarValor(agendamento.orcamento)}`,
        value: agendamento.idAgendamento?.toString() || ''
      })),
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Selecionar',
          handler: (idAgendamento) => {
            if (idAgendamento) {
              this.criarContratoParaAgendamento(parseInt(idAgendamento));
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async criarContratoParaAgendamento(idAgendamento: number) {
    const agendamento = this.agendamentos.find(a => a.idAgendamento === idAgendamento);
    
    if (!agendamento) return;

    const alert = await this.alertController.create({
      header: 'Criar Contrato',
      subHeader: `Evento: ${agendamento.nomeEvento}`,
      inputs: [
        {
          name: 'valor',
          type: 'number',
          placeholder: 'Valor do contrato',
          value: agendamento.orcamento.toString(),
          min: '0'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar',
          handler: (data) => {
            const valor = parseFloat(data.valor);
            if (valor > 0) {
              this.criarContrato(idAgendamento, valor);
            } else {
              this.mostrarMensagem('Erro', 'O valor deve ser maior que zero.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  criarContrato(idAgendamento: number, valor: number) {
    const novoContrato: Contrato = {
      idAgendamento: idAgendamento,
      valor: valor,
      assinaturaProdutor: false,
      assinaturaContratante: false
    };

    this.apiService.createContrato(novoContrato).subscribe({
      next: (contrato) => {
        this.contratos.push(contrato);
        this.calcularEstatisticas();
        this.filtrarContratos();
        this.mostrarMensagem('Sucesso', 'Contrato criado com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao criar contrato:', error);
        this.mostrarMensagem('Erro', 'Não foi possível criar o contrato.');
      }
    });
  }

  // MÉTODO CORRIGIDO: Editar contrato
  async editarContrato(contrato: Contrato) {
    const alert = await this.alertController.create({
      header: 'Editar Contrato',
      subHeader: `Contrato #${contrato.idContrato}`,
      inputs: [
        {
          name: 'valor',
          type: 'number',
          placeholder: 'Novo valor',
          value: contrato.valor.toString(),
          min: '0'
        },
        {
          name: 'assinaturaProdutor',
          type: 'checkbox',
          label: 'Assinatura do Produtor',
          checked: contrato.assinaturaProdutor,
          value: 'assinaturaProdutor'
        },
        {
          name: 'assinaturaContratante',
          type: 'checkbox',
          label: 'Assinatura do Contratante',
          checked: contrato.assinaturaContratante,
          value: 'assinaturaContratante'
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
            const valor = parseFloat(data.valor);
            if (valor > 0) {
              this.atualizarContrato(contrato.idContrato!, {
                ...contrato,
                valor: valor,
                assinaturaProdutor: data.assinaturaProdutor === 'assinaturaProdutor',
                assinaturaContratante: data.assinaturaContratante === 'assinaturaContratante'
              });
            } else {
              this.mostrarMensagem('Erro', 'O valor deve ser maior que zero.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para atualizar contrato
  atualizarContrato(id: number, contratoAtualizado: Contrato) {
    this.apiService.updateContrato(contratoAtualizado).subscribe({
      next: (contrato) => {
        const index = this.contratos.findIndex(c => c.idContrato === id);
        if (index !== -1) {
          this.contratos[index] = contrato;
          this.calcularEstatisticas();
          this.filtrarContratos();
          this.mostrarMensagem('Sucesso', 'Contrato atualizado com sucesso!');
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar contrato:', error);
        this.mostrarMensagem('Erro', 'Não foi possível atualizar o contrato.');
      }
    });
  }

  // MÉTODO ATUALIZADO: Visualizar e gerar PDF
  visualizarContrato(contrato: Contrato) {
    this.gerarPDF(contrato);
  }

  async confirmarExclusao(contrato: Contrato) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o contrato #${contrato.idContrato}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          cssClass: 'danger',
          handler: () => {
            this.excluirContrato(contrato.idContrato!);
          }
        }
      ]
    });

    await alert.present();
  }

  excluirContrato(id: number) {
    this.apiService.deleteContrato(id).subscribe({
      next: () => {
        const index = this.contratos.findIndex(c => c.idContrato === id);
        if (index !== -1) {
          this.contratos.splice(index, 1);
          this.calcularEstatisticas();
          this.filtrarContratos();
          this.mostrarMensagem('Sucesso', 'Contrato excluído com sucesso!');
        }
      },
      error: (error) => {
        console.error('Erro ao excluir contrato:', error);
        this.mostrarMensagem('Erro', 'Não foi possível excluir o contrato.');
      }
    });
  }

  // MÉTODO ATUALIZADO: Gerar PDF com assinaturas reais
  async gerarPDF(contrato: Contrato) {
    // Buscar informações do agendamento
    const agendamento = this.agendamentos.find(a => a.idAgendamento === contrato.idAgendamento);
    
    if (!agendamento) {
      this.mostrarMensagem('Erro', 'Agendamento não encontrado para este contrato.');
      return;
    }

    // Buscar informações do contratante
    const usuarioContratante = this.usuarios.find(u => u.idUsuario === agendamento.idUsuario);
    
    // Determinar status das assinaturas
    const assinaturaProdutor = contrato.assinaturaProdutor;
    const assinaturaContratante = contrato.assinaturaContratante;
    const dataAssinatura = contrato.dataAssinatura ? this.formatarData(contrato.dataAssinatura) : 'Pendente';

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
      dataContrato: this.formatarData(contrato.dataCriacao || ''),
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

      this.mostrarMensagem('Sucesso', `PDF gerado: ${nomeArquivo}`);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      this.mostrarMensagem('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      // Remover elemento temporário
      document.body.removeChild(elemento);
    }
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

  formatarData(data: string): string {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatarDataApenasData(data: string): string {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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