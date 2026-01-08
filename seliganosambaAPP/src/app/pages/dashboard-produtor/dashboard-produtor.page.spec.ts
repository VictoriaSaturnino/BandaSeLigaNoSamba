import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardProdutorPage } from './dashboard-produtor.page';

describe('DashboardProdutorPage', () => {
  let component: DashboardProdutorPage;
  let fixture: ComponentFixture<DashboardProdutorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardProdutorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
