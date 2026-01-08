import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardMusicoPage } from './dashboard-musico.page';

describe('DashboardMusicoPage', () => {
  let component: DashboardMusicoPage;
  let fixture: ComponentFixture<DashboardMusicoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardMusicoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
