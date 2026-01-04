import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';
export interface Teacher {
  _id: string;
  name: string;
  subjects: string[];
  phone?: string;
  email?: string;
  hireDate: string;
  active?: boolean;  // Add this line
}

@Injectable({
  providedIn: 'root'
})
export class TeachersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/teachers`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getTeacherById(id: string): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.apiUrl}/teachers/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createTeacher(teacherData: any): Observable<Teacher> {
    return this.http.post<Teacher>(`${this.apiUrl}/teachers`, teacherData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateTeacher(id: string, teacherData: any): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.apiUrl}/teachers/${id}`, teacherData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteTeacher(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/teachers/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}