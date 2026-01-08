import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(3)]],
      lembrar: [false]
    });
  }

  ngOnInit() {
    // Se já estiver logado, redireciona para a página apropriada
    if (this.authService.isLoggedIn) {
      this.redirectBasedOnRole();
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { email, senha, lembrar } = this.loginForm.value;
      
      // Se lembrar estiver marcado, salva email no localStorage
      if (lembrar) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // O redirecionamento é feito DENTRO do authService.login()
      await this.authService.login(email, senha);
      
      // NÃO PRECISA REDIRECIONAR AQUI, o authService já faz isso
      
    } catch (error: any) {
      this.loading = false;
      this.errorMessage = this.getErrorMessage(error);
      
      await this.showErrorAlert(this.errorMessage);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.message?.includes('Credenciais inválidas')) {
      return 'E-mail ou senha incorretos. Tente novamente.';
    } else if (error.status === 404) {
      return 'Usuário não encontrado. Verifique seu e-mail.';
    } else {
      return 'Erro ao fazer login. Tente novamente.';
    }
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Erro no Login',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  // Este método só é usado no ngOnInit quando o usuário já está logado
  private redirectBasedOnRole() {
    const role = this.authService.userRole;
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']); // CORRIGIDO
        break;
      case 'PRODUTOR':
        this.router.navigate(['/dashboard-produtor']);
        break;
      case 'CONTRATANTE':
        this.router.navigate(['/dashboard-contratante']);
        break;
      case 'MUSICO':
        this.router.navigate(['/dashboard-musico']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }

  // Carrega email salvo se existir
  ionViewDidEnter() {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        lembrar: true
      });
    }
  }
}