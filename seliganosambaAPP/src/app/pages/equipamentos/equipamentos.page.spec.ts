import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipamentosPage } from './equipamentos.page';

describe('EquipamentosPage', () => {
  let component: EquipamentosPage;
  let fixture: ComponentFixture<EquipamentosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EquipamentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
