import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService, Usuario } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    const savedUser = localStorage.getItem(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  public get userRole(): string | null {
    return this.currentUserValue?.funcao || null;
  }

  login(email: string, senha: string): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      this.apiService.login(email, senha).subscribe({
        next: (usuario) => {
          if (usuario && usuario.senha === senha) {
            // Simulando um token
            const fakeToken = this.generateFakeToken();
            
            // Salva no localStorage
            localStorage.setItem(this.TOKEN_KEY, fakeToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
            
            this.currentUserSubject.next(usuario);
            
            // REDIRECIONAMENTO CORRETO - IMPORTANTE!
            this.redirectBasedOnRole(usuario.funcao);
            
            resolve(usuario);
          } else {
            reject(new Error('Credenciais inválidas'));
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  logout(): void {
    // Remove dados do localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    
    // Redireciona para login
    this.router.navigate(['/login']);
  }

  private generateFakeToken(): string {
    return 'fake_jwt_token_' + Math.random().toString(36).substr(2);
  }

  // MÉTODO CORRIGIDO - Redireciona baseado na função
  private redirectBasedOnRole(role: string): void {
    console.log('Função do usuário:', role); // Para debug
    
    switch (role.toUpperCase()) {
      case 'ADMIN':
        // Para admin, redireciona para /admin/dashboard
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
        // Se não reconhecer a função, vai para home
        this.router.navigate(['/home']);
    }
  }

  // Verifica se o usuário tem uma determinada role
  hasRole(role: string): boolean {
    return this.userRole?.toUpperCase() === role.toUpperCase();
  }

  // Verifica se o usuário tem uma das roles especificadas
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  // Atualiza dados do usuário (após edição de perfil, por exemplo)
  updateUser(usuario: Usuario): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    this.currentUserSubject.next(usuario);
  }
}