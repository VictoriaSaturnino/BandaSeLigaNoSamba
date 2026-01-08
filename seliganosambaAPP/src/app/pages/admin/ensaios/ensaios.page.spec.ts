import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsaiosPage } from './ensaios.page';

describe('EnsaiosPage', () => {
  let component: EnsaiosPage;
  let fixture: ComponentFixture<EnsaiosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsaiosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
