import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter products by value typed in the search input', () => {
    const input = fixture.nativeElement.querySelector('.inSearch') as HTMLInputElement;

    input.value = 'flor';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.filteredProducts.map((product) => product.name)).toEqual(['Floren']);
    expect(fixture.nativeElement.querySelectorAll('.product-card h3').length).toBe(1);
  });

  it('should filter products by checkbox selection', () => {
    const checkbox = fixture.nativeElement.querySelector('.option-1') as HTMLInputElement;

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.filteredProducts.map((product) => product.name)).toEqual(['Elaris']);
  });

  it('should open and close the filter menu from the filter button', () => {
    const button = fixture.nativeElement.querySelector('.filter') as HTMLButtonElement;
    const menu = fixture.nativeElement.querySelector('.filter-options') as HTMLElement;

    expect(menu.classList.contains('is-open')).toBeFalse();

    button.click();
    fixture.detectChanges();

    expect(component.isFilterMenuOpen).toBeTrue();
    expect(menu.classList.contains('is-open')).toBeTrue();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.isFilterMenuOpen).toBeFalse();
    expect(menu.classList.contains('is-open')).toBeFalse();
  });
});
