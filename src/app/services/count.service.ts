import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';
@Injectable({
  providedIn: 'root'
})
export class CountService {
  private apiUrl = `${environment.apiUrl}/count`;
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getClassesNumber(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/classes`, {
      headers: this.authService.getAuthHeaders()
    });
  }
  getStudentsNumber(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/students`, {
      headers: this.authService.getAuthHeaders()
    });
  }
  getTeachersNumber(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/teachers`, {
      headers: this.authService.getAuthHeaders()
    });
  }

}