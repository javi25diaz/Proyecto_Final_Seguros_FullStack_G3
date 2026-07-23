import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerStub: { url: string; navigate: jasmine.Spy };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout', 'isAuthenticated']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerStub = { url: '/dashboard', navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerStub }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('añade el header Authorization cuando existe token', () => {
    authServiceSpy.getToken.and.returnValue('token-123');

    httpClient.get('/api/policies').subscribe();

    const req = httpMock.expectOne('/api/policies');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it('no añade Authorization cuando no existe token', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.get('/api/policies').subscribe();

    const req = httpMock.expectOne('/api/policies');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('ante 401: ejecuta logout (que elimina sesión y token y redirige a /login), muestra el mensaje y repropaga el error', () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    authServiceSpy.isAuthenticated.and.returnValue(true);
    let receivedError: unknown;

    httpClient.get('/api/policies').subscribe({ error: (err) => (receivedError = err) });
    const req = httpMock.expectOne('/api/policies');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Su sesión ha expirado. Inicie sesión nuevamente.');
    expect(receivedError).toBeTruthy();
  });

  it('ante 401 en la petición de login: no ejecuta logout ni el mensaje de sesión expirada (evita el loop)', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.post('/api/auth/login', { email: 'a@b.com', password: 'wrong' }).subscribe({ error: () => undefined });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(toastServiceSpy.error).not.toHaveBeenCalledWith('Su sesión ha expirado. Inicie sesión nuevamente.');
  });

  it('ante 403: muestra acceso denegado, navega a /forbidden y repropaga el error', () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    let receivedError: unknown;

    httpClient.get('/api/claims').subscribe({ error: (err) => (receivedError = err) });
    const req = httpMock.expectOne('/api/claims');
    req.flush({ message: 'Acceso denegado' }, { status: 403, statusText: 'Forbidden' });

    expect(toastServiceSpy.error).toHaveBeenCalledWith('Acceso denegado');
    expect(routerStub.navigate).toHaveBeenCalledWith(['/forbidden']);
    expect(receivedError).toBeTruthy();
  });

  it('ante 403 ya estando en /forbidden: no vuelve a redirigir ni a notificar', () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    routerStub.url = '/forbidden';

    httpClient.get('/api/claims').subscribe({ error: () => undefined });
    const req = httpMock.expectOne('/api/claims');
    req.flush({ message: 'Acceso denegado' }, { status: 403, statusText: 'Forbidden' });

    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('ante 500: muestra un mensaje general, no expone detalles internos y repropaga el error', () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    let receivedError: unknown;

    httpClient.get('/api/policies').subscribe({ error: (err) => (receivedError = err) });
    const req = httpMock.expectOne('/api/policies');
    req.flush({ message: 'stack trace interno del servidor' }, { status: 500, statusText: 'Server Error' });

    expect(toastServiceSpy.error).toHaveBeenCalledWith('Ocurrió un error en el servidor. Intenta nuevamente.');
    expect(toastServiceSpy.error).not.toHaveBeenCalledWith('stack trace interno del servidor');
    expect(receivedError).toBeTruthy();
  });

  it('ante status 0 (error de red): muestra un mensaje de conexión y repropaga el error', () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    let receivedError: unknown;

    httpClient.get('/api/policies').subscribe({ error: (err) => (receivedError = err) });
    const req = httpMock.expectOne('/api/policies');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(toastServiceSpy.error).toHaveBeenCalledWith('No fue posible conectar con el servidor. Verifica tu conexión e intenta nuevamente.');
    expect(receivedError).toBeTruthy();
  });

  it('ante 400: conserva el error original, no hace logout y no sustituye el mensaje', () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    let receivedError: { error: { message: string } } | undefined;

    httpClient.post('/api/policies', {}).subscribe({ error: (err) => (receivedError = err) });
    const req = httpMock.expectOne('/api/policies');
    req.flush({ message: 'La cobertura es obligatoria' }, { status: 400, statusText: 'Bad Request' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(toastServiceSpy.error).not.toHaveBeenCalled();
    expect(receivedError?.error.message).toBe('La cobertura es obligatoria');
  });

  it('ante 409: conserva el mensaje de negocio, no hace logout y no muestra un mensaje genérico global', () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    let receivedError: { error: { message: string } } | undefined;

    httpClient.post('/api/policies', {}).subscribe({ error: (err) => (receivedError = err) });
    const req = httpMock.expectOne('/api/policies');
    req.flush({ message: 'La póliza ya tiene un siniestro activo' }, { status: 409, statusText: 'Conflict' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(toastServiceSpy.error).not.toHaveBeenCalled();
    expect(receivedError?.error.message).toBe('La póliza ya tiene un siniestro activo');
  });
});
