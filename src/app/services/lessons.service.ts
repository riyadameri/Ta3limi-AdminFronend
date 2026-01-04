import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class LessonsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // إزالة طالب من الحصة
  removeStudentFromClass(classId: string, studentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/classes/${classId}/unenroll/${studentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على جميع الحصص
  getClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/classes`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على حصة محددة
  getClassById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/classes/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
  
}