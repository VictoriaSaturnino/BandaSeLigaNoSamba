import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-biografia',
  templateUrl: './biografia.page.html',
  styleUrls: ['./biografia.page.scss'],
  standalone: false
})
export class BiografiaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  // Método para redirecionar para redes sociais
  abrirRedesSociais(plataforma: string): void {
    const links: { [key: string]: string } = {
      instagram: 'https://www.instagram.com/seliganosamba/',
      facebook: 'https://www.facebook.com/SeLigaNoSamba/',
      youtube: 'https://www.youtube.com/@seliganosamba',
      whatsapp: 'https://wa.me/5531995315660'
    };

    if (links[plataforma]) {
      window.open(links[plataforma], '_blank');
    }
  }

  // Método para enviar email
  enviarEmail(): void {
    window.location.href = 'mailto:contato@seliganosamba.com';
  }

  // Método para fazer ligação
  fazerLigacao(): void {
    window.location.href = 'tel:+5531995315660';
  }

  // Método para abrir WhatsApp
  abrirWhatsApp(): void {
    window.open('https://wa.me/5531995315660', '_blank');
  }
}