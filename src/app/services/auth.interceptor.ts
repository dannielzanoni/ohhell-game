import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, switchMap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!request.headers.has('Authorization') || this.isRefreshRequest(request)) {
      return next.handle(request);
    }

    return from(this.authService.ensureValidToken()).pipe(
      switchMap(token => {
        const authorizedRequest = token
          ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : request;

        return next.handle(authorizedRequest).pipe(
          catchError(error => this.retryAfterRefresh(request, error, next))
        );
      })
    );
  }

  private retryAfterRefresh(
    request: HttpRequest<unknown>,
    error: unknown,
    next: HttpHandler,
  ) {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !this.authService.canRefreshSession()) {
      return throwError(() => error);
    }

    return from(this.authService.refreshSession(true)).pipe(
      switchMap(refreshed => {
        const token = this.authService.getAccessToken();

        if (!refreshed || !token) {
          return throwError(() => error);
        }

        return next.handle(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
      })
    );
  }

  private isRefreshRequest(request: HttpRequest<unknown>) {
    return request.url === `${environment.api_url}/auth/refresh`;
  }
}
