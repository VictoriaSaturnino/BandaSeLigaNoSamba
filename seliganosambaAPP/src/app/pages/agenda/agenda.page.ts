import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: false 
})
export class AgendaPage implements OnInit {
  agendamentos: any[] = [];
  loading = false;
  error: string | null = null;
  selected: any = null;
  imageLoaded = false;
  imageError = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadAgendamentos();
  }

  onImageLoad() {
    console.log('Imagem de fundo carregada com sucesso!');
    this.imageLoaded = true;
    this.imageError = false;
  }

  onImageError() {
    console.error('Erro ao carregar imagem de fundo');
    this.imageError = true;
    this.imageLoaded = false;
  }

  async loadAgendamentos() {
    this.loading = true;
    this.error = null;

    try {
      console.log('🔍 Iniciando carregamento de agendamentos...');
      
      // Obter todos os agendamentos
      const data = await this.apiService.getAllAgendamentos().toPromise();
      console.log('📊 Dados recebidos da API:', data);
      
      if (!data || !Array.isArray(data)) {
        console.error('❌ Dados inválidos recebidos da API');
        this.agendamentos = [];
        return;
      }

      // Filtrar apenas eventos públicos (comparação direta)
      const eventosPublicos = data.filter((agendamento: any) => {
        if (!agendamento.tipoEvento) {
          console.log(`❌ Evento sem tipo: ${agendamento.nomeEvento}`);
          return false;
        }
        
        const tipo = (agendamento.tipoEvento || '').toString().trim();
        console.log(`📝 Evento: ${agendamento.nomeEvento} | Tipo: "${tipo}"`);
        
        // Comparação direta e case-insensitive
        const isPublico = tipo.toUpperCase() === 'PUBLICO' || 
                         tipo.toUpperCase() === 'PÚBLICO' ||
                         tipo.toUpperCase().includes('PUBLICO') ||
                         tipo.toUpperCase().includes('PÚBLICO');
        
        // Verifica se NÃO é privado (para segurança)
        const isPrivado = tipo.toUpperCase() === 'PRIVADO' || 
                         tipo.toUpperCase().includes('PRIVADO');
        
        const resultado = isPublico && !isPrivado;
        console.log(`   ✅ É público? ${resultado}`);
        
        return resultado;
      });

      console.log(`✅ Eventos públicos encontrados: ${eventosPublicos.length}`, eventosPublicos);

      // Filtrar eventos futuros ou sem data
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const eventosFuturos = eventosPublicos.filter((agendamento: any) => {
        if (!agendamento.dataEvento) {
          console.log(`⚠️ Evento sem data: ${agendamento.nomeEvento} - mantendo`);
          return true; // Mantém se não tem data
        }
        
        const dataEvento = this.parseDate(agendamento.dataEvento);
        if (!dataEvento) {
          console.log(`⚠️ Evento com data inválida: ${agendamento.dataEvento} - mantendo`);
          return true; // Mantém se data inválida
        }
        
        dataEvento.setHours(0, 0, 0, 0);
        const isFuturo = dataEvento >= hoje;
        console.log(`📅 Evento: ${agendamento.nomeEvento} | Data: ${dataEvento.toLocaleDateString()} | É futuro? ${isFuturo}`);
        
        return isFuturo; // Mantém se data é hoje ou futura
      });

      console.log(`📅 Eventos futuros: ${eventosFuturos.length}`, eventosFuturos);

      // Ordenar por data (mais antigo primeiro)
      eventosFuturos.sort((a: any, b: any) => {
        const dataA = this.parseDate(a.dataEvento) || new Date(8640000000000000);
        const dataB = this.parseDate(b.dataEvento) || new Date(8640000000000000);
        
        return dataA.getTime() - dataB.getTime();
      });

      this.agendamentos = eventosFuturos;
      
      if (this.agendamentos.length === 0) {
        console.log('ℹ️ Nenhum evento público encontrado');
        await this.presentToast('Nenhum evento público agendado no momento.', 'warning');
      } else {
        console.log(`🎉 Total de eventos públicos exibidos: ${this.agendamentos.length}`);
      }
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar agendamentos:', err);
      this.error = 'Não foi possível carregar a agenda. Por favor, tente novamente.';
      
      await this.presentToast('Erro ao carregar eventos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  private parseDate(dateString: any): Date | null {
    if (!dateString) return null;
    
    try {
      // Para strings no formato YYYY-MM-DD
      if (typeof dateString === 'string') {
        // Remove qualquer caractere não numérico exceto hífen
        const cleanDate = dateString.replace(/[^\d-]/g, '');
        
        // Tenta diferentes formatos
        const formats = [
          /^(\d{4})-(\d{1,2})-(\d{1,2})$/,  // YYYY-MM-DD
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
          /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/  // YYYY/MM/DD
        ];
        
        for (const format of formats) {
          const match = cleanDate.match(format);
          if (match) {
            const parts = match.slice(1).map(Number);
            if (format === formats[0]) {
              // YYYY-MM-DD
              return new Date(parts[0], parts[1] - 1, parts[2]);
            } else if (format === formats[1]) {
              // DD/MM/YYYY
              return new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
              // YYYY/MM/DD
              return new Date(parts[0], parts[1] - 1, parts[2]);
            }
          }
        }
      }
      
      // Tenta criar data normalmente
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
      
    } catch (error) {
      console.error('❌ Erro ao fazer parse da data:', dateString, error);
      return null;
    }
  }

  getDay(dateString: string): string {
    const date = this.parseDate(dateString);
    if (!date) {
      console.warn(`⚠️ Data inválida para getDay: ${dateString}`);
      return '??';
    }
    return date.getDate().toString().padStart(2, '0');
  }

  getMonth(dateString: string): string {
    const date = this.parseDate(dateString);
    if (!date) {
      console.warn(`⚠️ Data inválida para getMonth: ${dateString}`);
      return 'MÊS';
    }
    
    const meses = [
      'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
      'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
    ];
    
    return meses[date.getMonth()];
  }

  getEventTypeLabel(tipoEvento: string): string {
    if (!tipoEvento) return 'EVENTO';
    
    const tipoUpper = tipoEvento.toUpperCase().trim();
    
    if (tipoUpper.includes('PUBLICO') || tipoUpper.includes('PÚBLICO')) {
      return 'EVENTO PÚBLICO';
    } else if (tipoUpper.includes('PRIVADO')) {
      return 'EVENTO PRIVADO';
    } else if (tipoUpper.includes('SHOW')) {
      return 'SHOW';
    } else if (tipoUpper.includes('FESTA')) {
      return 'FESTA';
    } else if (tipoUpper.includes('CASAMENTO')) {
      return 'CASAMENTO';
    } else if (tipoUpper.includes('CORPORATIVO')) {
      return 'EVENTO CORPORATIVO';
    }
    
    return tipoEvento.toUpperCase();
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'A confirmar';
    
    try {
      // Remove espaços
      const cleanTime = timeString.trim();
      
      // Para strings no formato HH:MM:SS
      if (/^\d{2}:\d{2}:\d{2}$/.test(cleanTime)) {
        const [hours, minutes] = cleanTime.split(':');
        return `${hours}:${minutes}h`;
      }
      
      // Para formato HH:MM
      if (/^\d{2}:\d{2}$/.test(cleanTime)) {
        return `${cleanTime}h`;
      }
      
      // Retorna o original se não conseguir formatar
      return cleanTime;
      
    } catch (error) {
      console.error('❌ Erro ao formatar hora:', timeString, error);
      return timeString;
    }
  }

  openDetails(agendamento: any) {
    this.selected = agendamento;
    console.log('📋 Detalhes do evento selecionado:', agendamento);
  }

  closeDetails() {
    this.selected = null;
    console.log('📋 Modal de detalhes fechado');
  }

  async shareEvent() {
    if (!this.selected) return;
    
    const shareText = `🎵 ${this.selected.nomeEvento || 'Show da Banda Se Liga no Samba'}\n📅 ${this.getDay(this.selected.dataEvento)} de ${this.getMonth(this.selected.dataEvento)}\n📍 ${this.selected.cidade || ''} - ${this.selected.estado || ''}\n\nVenha curtir com a gente! 🎉`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Banda Se Liga no Samba',
          text: shareText,
          url: window.location.href
        });
        console.log('📱 Evento compartilhado com sucesso');
      } catch (err) {
        console.log('❌ Compartilhamento cancelado:', err);
      }
    } else {
      // Fallback para copiar para área de transferência
      try {
        await navigator.clipboard.writeText(shareText);
        await this.presentToast('Evento copiado para a área de transferência!', 'success');
        console.log('📋 Evento copiado para área de transferência');
      } catch (err) {
        console.error('❌ Erro ao copiar para área de transferência:', err);
        await this.presentToast('Não foi possível copiar o evento', 'danger');
      }
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
    console.log(`💬 Toast: ${message}`);
  }

  load() {
    console.log('🔄 Recarregando agendamentos...');
    this.loadAgendamentos();
  }

  truncateDescription(description: string, maxLength: number): string {
  if (!description) return '';
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
}
}