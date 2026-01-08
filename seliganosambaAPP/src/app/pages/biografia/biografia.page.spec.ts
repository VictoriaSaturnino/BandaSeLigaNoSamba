import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BiografiaPage } from './biografia.page';

describe('BiografiaPage', () => {
  let component: BiografiaPage;
  let fixture: ComponentFixture<BiografiaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BiografiaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
