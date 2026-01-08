import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces para os modelos
export interface Agendamento {
  idAgendamento?: number;
  idUsuario: number;
  nomeEvento: string;
  quantidadeConvidados: number;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  dataEvento: string; // Date no formato ISO
  horario: string;
  sonorizacao: boolean;
  tipoEvento: string;
  orcamento: number;
  aprovado?: boolean;
  dataCriacao?: string;
}

// No arquivo api.service.ts, atualize a interface Contrato:
export interface Contrato {
  idContrato?: number;
  idAgendamento: number;
  pdf?: string;
  valor: number;
  assinaturaProdutor: boolean;
  assinaturaContratante: boolean;
  dataCriacao?: string;
  dataAssinatura?: string | null; // ← Alterado para permitir null
}

export interface Ensaio {
  idEnsaio?: number;
  dtEnsaio: string;
  horario: string;
  local: string;
}

export interface Equipamento {
  idEquipamento?: number;
  nmEquipamento: string;
  disponivel: 'S' | 'N';
}

export interface Usuario {
  idUsuario?: number;
  nome: string;
  email: string;
  senha: string;
  funcao: string;
  dtNascimento: string;
  telefone: string;
  dataCadastro?: string;
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // URL base da API - ajuste conforme necessário
  private baseUrl = 'http://localhost:9091/api/v1/seliganosamba';

  // Se precisar mudar para produção, basta alterar esta linha:
  // private baseUrl = 'https://api.seliganosamba.com/api/v1/seliganosamba';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // ========== AGENDAMENTO ==========
  
  getAgendamentoById(id: number): Observable<Agendamento> {
    return this.http.get<Agendamento>(`${this.baseUrl}/agendamento/${id}`);
  }

  getAllAgendamentos(): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamento`);
  }

  getAgendamentosByUsuario(idUsuario: number): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamento/usuario/${idUsuario}`);
  }

  getAgendamentosByData(dataEvento: string): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamento/data/${dataEvento}`);
  }

  getAgendamentosByStatus(aprovado: boolean): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamento/status/${aprovado}`);
  }

  createAgendamento(agendamento: Agendamento): Observable<Agendamento> {
    return this.http.post<Agendamento>(`${this.baseUrl}/agendamento`, agendamento, {
      headers: this.getHeaders()
    });
  }

  updateAgendamento(agendamento: Agendamento): Observable<Agendamento> {
    return this.http.put<Agendamento>(`${this.baseUrl}/agendamento`, agendamento, {
      headers: this.getHeaders()
    });
  }

  deleteAgendamento(id: number): Observable<Agendamento> {
    return this.http.delete<Agendamento>(`${this.baseUrl}/agendamento/${id}`);
  }

  updateStatusAgendamento(id: number, aprovado: boolean): Observable<void> {
    const params = new HttpParams().set('aprovado', aprovado.toString());
    return this.http.patch<void>(`${this.baseUrl}/agendamento/${id}/aprovado`, null, { params });
  }

  // ========== CONTRATO ==========

  getContratoById(id: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.baseUrl}/contrato/${id}`);
  }

  getAllContratos(): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(`${this.baseUrl}/contrato`);
  }

  getContratoByAgendamento(idAgendamento: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.baseUrl}/contrato/agendamento/${idAgendamento}`);
  }

  getContratosPendentes(): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(`${this.baseUrl}/contrato/pendentes`);
  }

  createContrato(contrato: Contrato): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.baseUrl}/contrato`, contrato, {
      headers: this.getHeaders()
    });
  }

  updateContrato(contrato: Contrato): Observable<Contrato> {
    return this.http.put<Contrato>(`${this.baseUrl}/contrato`, contrato, {
      headers: this.getHeaders()
    });
  }

  deleteContrato(id: number): Observable<Contrato> {
    return this.http.delete<Contrato>(`${this.baseUrl}/contrato/${id}`);
  }

  updateAssinaturasContrato(
    id: number, 
    assinaturaProdutor: boolean, 
    assinaturaContratante: boolean
  ): Observable<void> {
    const params = new HttpParams()
      .set('assinaturaProdutor', assinaturaProdutor.toString())
      .set('assinaturaContratante', assinaturaContratante.toString());
    
    return this.http.patch<void>(`${this.baseUrl}/contrato/${id}/assinaturas`, null, { params });
  }

  // ========== ENSAIO ==========

  getEnsaioById(id: number): Observable<Ensaio> {
    return this.http.get<Ensaio>(`${this.baseUrl}/ensaio/${id}`);
  }

  getAllEnsaio(): Observable<Ensaio[]> {
    return this.http.get<Ensaio[]>(`${this.baseUrl}/ensaio`);
  }

  createEnsaio(ensaio: Ensaio): Observable<Ensaio> {
    return this.http.post<Ensaio>(`${this.baseUrl}/ensaio`, ensaio, {
      headers: this.getHeaders()
    });
  }

  updateEnsaio(ensaio: Ensaio): Observable<Ensaio> {
    return this.http.put<Ensaio>(`${this.baseUrl}/ensaio`, ensaio, {
      headers: this.getHeaders()
    });
  }

  deleteEnsaio(id: number): Observable<Ensaio> {
    return this.http.delete<Ensaio>(`${this.baseUrl}/ensaio/${id}`);
  }

  // ========== EQUIPAMENTO ==========

  getEquipamentoById(id: number): Observable<Equipamento> {
    return this.http.get<Equipamento>(`${this.baseUrl}/equipamento/${id}`);
  }

  getAllEquipamentos(): Observable<Equipamento[]> {
    return this.http.get<Equipamento[]>(`${this.baseUrl}/equipamento`);
  }

  createEquipamento(equipamento: Equipamento): Observable<Equipamento> {
    return this.http.post<Equipamento>(`${this.baseUrl}/equipamento`, equipamento, {
      headers: this.getHeaders()
    });
  }

  updateEquipamento(equipamento: Equipamento): Observable<Equipamento> {
    return this.http.put<Equipamento>(`${this.baseUrl}/equipamento`, equipamento, {
      headers: this.getHeaders()
    });
  }

  deleteEquipamento(id: number): Observable<Equipamento> {
    return this.http.delete<Equipamento>(`${this.baseUrl}/equipamento/${id}`);
  }

  // ========== USUARIO ==========

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/usuario/${id}`);
  }

  getUsuarioByEmail(email: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/usuario/email/${email}`);
  }

  getAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuario`);
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/usuario`, usuario, {
      headers: this.getHeaders()
    });
  }

  updateUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/usuario`, usuario, {
      headers: this.getHeaders()
    });
  }

  deleteUsuario(id: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.baseUrl}/usuario/${id}`);
  }

  updateStatusUsuario(id: number, ativo: boolean): Observable<void> {
    const params = new HttpParams().set('ativo', ativo.toString());
    return this.http.patch<void>(`${this.baseUrl}/usuario/${id}/ativo`, null, { params });
  }

  // ========== MÉTODOS AUXILIARES ==========

  login(email: string, senha: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/usuario/email/${email}`);
  }

  // Método para verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    const usuario = localStorage.getItem('usuario');
    return usuario !== null;
  }

  // Método para salvar usuário no localStorage após login
  setUserSession(usuario: Usuario): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    // Você também pode armazenar um token se sua API usar autenticação JWT
    // localStorage.setItem('token', token);
  }

  // Método para obter usuário do localStorage
  getCurrentUser(): Usuario | null {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      return JSON.parse(usuarioStr);
    }
    return null;
  }

  // Método para fazer logout
  logout(): void {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  }

  // Método para verificar se o usuário tem determinada função
  hasRole(role: string): boolean {
    const usuario = this.getCurrentUser();
    return usuario?.funcao === role;
  }
}