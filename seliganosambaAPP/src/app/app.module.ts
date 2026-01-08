import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Ionic
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// Componentes
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Páginas
import { LoginPage } from './pages/login/login.page';
import { BiografiaPage } from './pages/biografia/biografia.page';
import { HomePage } from './home/home.page'; // Adicione esta linha

@NgModule({
  declarations: [
    AppComponent,
    // Páginas que NÃO são lazy loaded
    LoginPage,
    BiografiaPage,
    HomePage // Adicione esta linha
  ],
  imports: [
    BrowserModule,
    // Importar IonicModule corretamente
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }