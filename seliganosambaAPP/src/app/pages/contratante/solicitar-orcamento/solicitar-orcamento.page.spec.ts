import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitarOrcamentoPage } from './solicitar-orcamento.page';

describe('SolicitarOrcamentoPage', () => {
  let component: SolicitarOrcamentoPage;
  let fixture: ComponentFixture<SolicitarOrcamentoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitarOrcamentoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
