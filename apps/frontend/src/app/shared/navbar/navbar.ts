import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SesionService } from '../../core/servicios/sesion.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly usuarioActual = this.sesion.usuarioActual;
  readonly autenticado = this.sesion.autenticado;

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    void this.router.navigate(['/']);
  }
}
