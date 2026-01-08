import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaCompletaPage } from './agenda-completa.page';

describe('AgendaCompletaPage', () => {
  let component: AgendaCompletaPage;
  let fixture: ComponentFixture<AgendaCompletaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgendaCompletaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
