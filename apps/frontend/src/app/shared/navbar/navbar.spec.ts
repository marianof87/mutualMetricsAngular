import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Navbar } from './navbar';

describe('Navbar', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('crea el componente', () => {
    const fixture = TestBed.createComponent(Navbar);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza las secciones', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-link');
    const textos = Array.from(links).map((a) => a.textContent?.trim());
    expect(textos).toEqual([
      'Inicio',
      'Sobre nosotros',
      'Servicios',
      'Novedades',
      'Simulador de precios',
      'Contacto',
    ]);
  });

  it('sin sesión muestra los enlaces de auth', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    const auth = (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-auth-link');
    const textos = Array.from(auth).map((a) => a.textContent?.trim());
    expect(textos).toEqual(['Ingresar', 'Crear cuenta']);
  });
});
