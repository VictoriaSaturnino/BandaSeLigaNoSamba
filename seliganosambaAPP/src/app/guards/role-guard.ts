import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['expectedRoles'] as Array<string>;
    
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }
    
    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }
    
    const hasRole = expectedRoles.some(role => 
      this.authService.userRole?.toUpperCase() === role.toUpperCase()
    );
    
    if (!hasRole) {
      this.router.navigate(['/home']);
      return false;
    }
    
    return true;
  }
}