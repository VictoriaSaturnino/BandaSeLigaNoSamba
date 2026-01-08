import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrcamentosPage } from './orcamentos.page';

describe('OrcamentosPage', () => {
  let component: OrcamentosPage;
  let fixture: ComponentFixture<OrcamentosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrcamentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
