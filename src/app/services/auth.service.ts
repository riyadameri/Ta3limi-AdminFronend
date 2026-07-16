import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  username: string;
  role: string;
  fullName: string;
  email?: string;
  phone?: string;
  permissions?: any;
}

export interface School {
  _id: string;
  name: string;
  schoolKey: string;
  subscription?: any;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
    school: School;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://localhost:5090';
  private tokenKey = 'token';
  private userKey = 'user';
  private schoolKey = 'school';
  private permissionsKey = 'permissions';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const user = localStorage.getItem(this.userKey);
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.currentUserSubject.next(userData);
        this.isLoggedInSubject.next(true);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  getSchool(): School | null {
    const school = localStorage.getItem(this.schoolKey);
    return school ? JSON.parse(school) : null;
  }

  getPermissions(): any {
    const permissions = localStorage.getItem(this.permissionsKey);
    return permissions ? JSON.parse(permissions) : {};
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  login(username: string, password: string, schoolKey: string): Observable<LoginResponse> {
    const loginData = { username, password, schoolKey };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/login`, loginData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.saveSession(response.data);
            this.currentUserSubject.next(response.data.user);
            this.isLoggedInSubject.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  private saveSession(data: any): void {
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    localStorage.setItem(this.schoolKey, JSON.stringify(data.school));
    
    if (data.user.permissions) {
      localStorage.setItem(this.permissionsKey, JSON.stringify(data.user.permissions));
    }
    
    if (data.school.subscription) {
      localStorage.setItem('subscription', JSON.stringify(data.school.subscription));
    }
    
    localStorage.setItem('loginTime', new Date().toISOString());
  }

  logout(): void {
    this.clearSession();
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.schoolKey);
    localStorage.removeItem(this.permissionsKey);
    localStorage.removeItem('subscription');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('rememberedUser');
  }

  verifyToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/api/auth/verify`, { headers })
      .pipe(catchError(this.handleError));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/api/auth/change-password`, 
      { currentPassword, newPassword },
      { headers }
    ).pipe(catchError(this.handleError));
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAuthHeadersWithSchool(): HttpHeaders {
    const token = this.getToken();
    const school = this.getSchool();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (school && school.schoolKey) {
      headers = headers.set('x-auth-key', school.schoolKey);
    }
    
    return headers;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    
    if (error.status === 401) {
      this.logout();
    }
    
    return throwError(() => error);
  }

  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions[permission] === true;
  }

  hasRole(role: string | string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }

  updateUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}