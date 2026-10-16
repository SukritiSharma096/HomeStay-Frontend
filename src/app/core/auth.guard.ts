import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  const allowed = route.data['roles'] as string[] | undefined;
  if (!allowed || allowed.includes(auth.user?.role ?? '')) return true;
  return router.createUrlTree([auth.user?.role === 'ADMIN' ? '/admin' : auth.user?.role === 'HOST' ? '/host' : '/']);
};
