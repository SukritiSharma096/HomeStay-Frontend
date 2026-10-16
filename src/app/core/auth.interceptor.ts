import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from './config';
import { AuthService } from './auth.service';

/** Adds "Authorization: Bearer <token>" to every call to our backend. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token;
  const isApi = req.url.startsWith(API_URL);

  const request =
    token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      // token expired or invalid -> send the user to login
      if (err.status === 401 && token && isApi && !req.url.includes('/auth/')) {
        auth.logout(false);
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
