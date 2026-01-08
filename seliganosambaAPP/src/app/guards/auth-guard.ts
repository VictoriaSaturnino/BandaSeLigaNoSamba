import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Verifica se o usuário está logado
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Verifica roles específicas se necessário
    const requiredRoles = route.data['roles'] as Array<string>;
    if (requiredRoles) {
      const hasRole = this.authService.hasAnyRole(requiredRoles);
      if (!hasRole) {
        // Redireciona para página de acesso negado ou home
        this.router.navigate(['/home']);
        return false;
      }
    }

    return true;
  }
}