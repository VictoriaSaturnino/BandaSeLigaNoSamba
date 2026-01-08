import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContratantePage } from './contratante.page';

describe('ContratantePage', () => {
  let component: ContratantePage;
  let fixture: ComponentFixture<ContratantePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ContratantePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
