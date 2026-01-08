import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardContratantePage } from './dashboard-contratante.page';

describe('DashboardContratantePage', () => {
  let component: DashboardContratantePage;
  let fixture: ComponentFixture<DashboardContratantePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardContratantePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
