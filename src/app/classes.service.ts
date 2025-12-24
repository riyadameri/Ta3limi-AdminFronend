import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';
export interface Class {
  _id: string;
  name: string;
  subject: string;
  academicYear: string;
  description?: string;
  schedule: Schedule[];
  price: number;
  teacher: any;
  students: any[];
}

export interface Schedule {
  day: string;
  time: string;
  classroom: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getClasses(): Observable<Class[]> {
    return this.http.get<Class[]>(`${this.apiUrl}/classes`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getClassById(id: string): Observable<Class> {
    return this.http.get<Class>(`${this.apiUrl}/classes/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createClass(classData: any): Observable<Class> {
    return this.http.post<Class>(`${this.apiUrl}/classes`, classData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateClass(id: string, classData: any): Observable<Class> {
    return this.http.put<Class>(`${this.apiUrl}/classes/${id}`, classData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteClass(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/classes/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  enrollStudent(classId: string, studentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/classes/${classId}/enroll/${studentId}`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  unenrollStudent(classId: string, studentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/classes/${classId}/unenroll/${studentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

// Update the getAvailableClasses method to accept parameters
getAvailableClasses(academicYear?: string, studentId?: string): Observable<Class[]> {
  let url = `${this.apiUrl}/classes/available`;
  const params: any = {};
  
  if (academicYear) params.academicYear = academicYear;
  if (studentId) params.studentId = studentId;
  
  return this.http.get<Class[]>(url, {
    params: params,
    headers: this.authService.getAuthHeaders()
  });
}

  getAvailableClassesForStudent(academicYear: string, studentId: string): Observable<Class[]> {
    return this.http.get<Class[]>(`${this.apiUrl}/classes/available/${academicYear}?studentId=${studentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  addStudentToClass(classId: string, studentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/classes/${classId}/enroll/${studentId}`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
