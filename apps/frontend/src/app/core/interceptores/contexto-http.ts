import { HttpContextToken } from '@angular/common/http';

// Marca una request para que el interceptor de errores NO redirija a /login
// si la sesión resulta inválida. Lo usa la revalidación silenciosa de sesión
// al iniciar la app: si el token está vencido, limpiamos la sesión sin sacar
// al usuario de la página pública en la que está parado.
export const OMITIR_REDIRECCION_SESION = new HttpContextToken<boolean>(() => false);
