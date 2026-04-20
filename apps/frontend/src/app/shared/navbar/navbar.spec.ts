import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';

describe('Navbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('crea el componente', () => {
    const fixture = TestBed.createComponent(Navbar);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza las 5 secciones', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-link');
    const textos = Array.from(links).map((a) => a.textContent?.trim());
    expect(textos).toEqual([
      'Inicio',
      'Sobre nosotros',
      'Servicios',
      'Novedades',
      'Contacto',
    ]);
  });
});
