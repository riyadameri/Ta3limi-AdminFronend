import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';

export interface Classroom {
  _id: string;
  name: string;
  capacity: number;
  location: string;
  floor: number;
  building: string;
  color?: string;
  equipment?: string[];
  status: 'available' | 'occupied' | 'maintenance';
  currentClass?: any;
  schedule?: ClassSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassSchedule {
  day: string;
  time: string;
  class: any;
  teacher: any;
  subject: string;
}

export interface SchoolMap {
  floors: number[];
  buildings: string[];
  currentView: {
    building: string;
    floor: number;
    zoom: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RoomsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // الحصول على جميع الغرف
  getRooms(params?: any): Observable<Classroom[]> {
    return this.http.get<Classroom[]>(`${this.apiUrl}/classrooms`, {
      params: params,
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على غرفة محددة
  getRoomById(id: string): Observable<Classroom> {
    return this.http.get<Classroom>(`${this.apiUrl}/classrooms/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // إنشاء غرفة جديدة
  createRoom(roomData: any): Observable<Classroom> {
    return this.http.post<Classroom>(`${this.apiUrl}/classrooms`, roomData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // تحديث معلومات الغرفة
  updateRoom(id: string, roomData: any): Observable<Classroom> {
    return this.http.put<Classroom>(`${this.apiUrl}/classrooms/${id}`, roomData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // حذف غرفة
  deleteRoom(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/classrooms/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على جدول الغرفة
  getRoomSchedule(id: string): Observable<ClassSchedule[]> {
    return this.http.get<ClassSchedule[]>(`${this.apiUrl}/classrooms/${id}/schedule`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على الحصص الحالية في الغرفة
  getCurrentClasses(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/classrooms/${id}/current-classes`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على خريطة المدرسة
  getSchoolMap(): Observable<SchoolMap> {
    return this.http.get<SchoolMap>(`${this.apiUrl}/school/map`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // تغيير حالة الغرفة
  changeRoomStatus(id: string, status: 'available' | 'occupied' | 'maintenance'): Observable<Classroom> {
    return this.http.patch<Classroom>(`${this.apiUrl}/classrooms/${id}/status`, { status }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // البحث عن غرف متاحة
  getAvailableRooms(criteria: {
    capacity?: number;
    floor?: number;
    building?: string;
    time?: string;
    day?: string;
  }): Observable<Classroom[]> {
    return this.http.get<Classroom[]>(`${this.apiUrl}/classrooms/available`, {
      params: criteria,
      headers: this.authService.getAuthHeaders()
    });
  }

  // إحصائيات الغرف
  getRoomStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/classrooms/statistics`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // تحميل الأثاث للغرفة (لعبة ثلاثية الأبعاد)
  loadRoomFurniture(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/classrooms/${id}/furniture`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // حفظ تخطيط الغرفة
  saveRoomLayout(id: string, layout: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/classrooms/${id}/layout`, layout, {
      headers: this.authService.getAuthHeaders()
    });
  }
}