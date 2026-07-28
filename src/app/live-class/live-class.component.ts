import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Student {
  _id: string;
  name: string;
  studentId: string;
  parentPhone: string;
  parentEmail: string;
  academicYear: string;
  status: string;
}

interface Teacher {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  subjects?: string[];
}

interface Classroom {
  _id: string;
  name: string;
  capacity: number;
  floor: number;
  building: string;
  location: string;
  color: string;
  equipment: string[];
  status: 'available' | 'occupied' | 'maintenance';
}

interface Class {
  _id: string;
  name: string;
  subject: string;
  description?: string;
  academicYear: string;
  price: number;
  paymentSystem: 'monthly' | 'rounds';
  teacher?: Teacher;
  schedule: Array<{ day: string; time: string; classroom?: { name: string; }; }>;
  students: Student[];
  createdAt: Date;
}

interface LiveClass {
  _id: string;
  class: Class | { _id: string; name: string; subject: string; };
  date: Date;
  month: string;
  startTime: string;
  endTime?: string;
  teacher: Teacher | { _id: string; name: string; };
  classroom?: Classroom | { _id: string; name: string; location: string; status: string; };
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendance: Array<{
    student: Student | string;
    status: 'present' | 'absent' | 'late';
    joinedAt?: Date;
    leftAt?: Date;
    timestamp?: Date;
  }>;
  notes?: string;
  createdBy?: string;
  showDetails?: boolean;
  studentsLoaded?: boolean;
}

@Component({
  selector: 'app-live-class',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="live-class-container" dir="rtl">
      <!-- Header -->
      <div class="modern-header">
        <div class="header-content">
          <div class="title-section">
            <div class="icon-wrapper"><i class="fas fa-chalkboard-user"></i></div>
            <div>
              <h1>نظام الحصص الحية</h1>
              <p>إدارة الحصص والحضور بكفاءة عالية</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-glass" (click)="loadLiveClasses()">
              <i class="fas fa-sync-alt"></i> <span>تحديث</span>
            </button>
            <button class="btn-primary-modern" (click)="toggleCreateForm()">
              <i class="fas fa-plus-circle"></i> <span>حصة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-modern">
        <div class="filters-header">
          <i class="fas fa-sliders-h"></i>
          <h3>تصفية الحصص</h3>
        </div>
        <div class="filters-grid">
          <div class="filter-item">
            <label><i class="fas fa-chart-line"></i> الحالة</label>
            <select class="modern-select" [(ngModel)]="filters.status" (change)="applyFilters()">
              <option value="">جميع الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="ongoing">جارية</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
          <div class="filter-item">
            <label><i class="fas fa-calendar-alt"></i> التاريخ</label>
            <input type="date" class="modern-input" [(ngModel)]="filters.date" (change)="applyFilters()">
          </div>
          <div class="filter-item">
            <label><i class="fas fa-book"></i> الحصة</label>
            <select class="modern-select" [(ngModel)]="filters.class" (change)="applyFilters()">
              <option value="">جميع الحصص</option>
              <option *ngFor="let cls of allClasses" [value]="cls._id">
                {{cls.name}} - {{cls.subject}}
              </option>
            </select>
          </div>
          <div class="filter-item">
            <label><i class="fas fa-user-graduate"></i> الأستاذ</label>
            <select class="modern-select" [(ngModel)]="filters.teacher" (change)="applyFilters()">
              <option value="">جميع الأساتذة</option>
              <option *ngFor="let teacher of teachers" [value]="teacher._id">
                {{teacher.name}}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Create Form -->
      <div *ngIf="showCreateForm" class="create-form-modern">
        <div class="form-header">
          <i class="fas fa-plus-circle"></i>
          <h3>إنشاء حصة جديدة</h3>
          <button type="button" class="close-btn" (click)="cancelCreate()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form #createForm="ngForm" (ngSubmit)="createLiveClass()">
          <div class="form-grid">
            <div class="form-field">
              <label><i class="fas fa-book"></i> الحصة *</label>
              <select class="modern-select" [(ngModel)]="newLiveClass.classId" name="classId" required>
                <option value="">اختر الحصة</option>
                <option *ngFor="let cls of allClasses" [value]="cls._id">
                  {{cls.name}} - {{cls.subject}}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label><i class="fas fa-calendar-day"></i> التاريخ *</label>
              <input type="date" class="modern-input" [(ngModel)]="newLiveClass.date" name="date" required>
            </div>
            <div class="form-field">
              <label><i class="fas fa-clock"></i> وقت البداية *</label>
              <input type="time" class="modern-input" [(ngModel)]="newLiveClass.startTime" name="startTime" required>
            </div>
            <div class="form-field">
              <label><i class="fas fa-hourglass-end"></i> وقت النهاية</label>
              <input type="time" class="modern-input" [(ngModel)]="newLiveClass.endTime" name="endTime">
            </div>
            <div class="form-field">
              <label><i class="fas fa-chalkboard-user"></i> الأستاذ *</label>
              <select class="modern-select" [(ngModel)]="newLiveClass.teacherId" name="teacherId" required>
                <option value="">اختر الأستاذ</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">
                  {{teacher.name}}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label><i class="fas fa-door-open"></i> القاعة</label>
              <select class="modern-select" [(ngModel)]="newLiveClass.classroomId" name="classroomId">
                <option value="">اختر القاعة</option>
                <option *ngFor="let room of classrooms" [value]="room._id">
                  {{room.name}} ({{room.status === 'available' ? 'متاحة' : room.status === 'occupied' ? 'مشغولة' : 'صيانة'}})
                </option>
              </select>
            </div>
            <div class="form-field">
              <label><i class="fas fa-tag"></i> الحالة</label>
              <select class="modern-select" [(ngModel)]="newLiveClass.status" name="status">
                <option value="scheduled">مجدولة</option>
                <option value="ongoing">جارية</option>
                <option value="completed">مكتملة</option>
              </select>
            </div>
          </div>
          <div class="form-field full-width">
            <label><i class="fas fa-sticky-note"></i> ملاحظات</label>
            <textarea class="modern-textarea" [(ngModel)]="newLiveClass.notes" name="notes" rows="3" placeholder="أدخل أي ملاحظات إضافية..."></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-submit" [disabled]="!newLiveClass.classId || !newLiveClass.date || !newLiveClass.startTime || !newLiveClass.teacherId || loading">
              <i class="fas fa-save"></i> حفظ الحصة
            </button>
            <button type="button" class="btn-cancel" (click)="cancelCreate()">
              <i class="fas fa-times"></i> إلغاء
            </button>
          </div>
        </form>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-modern">
        <div class="spinner-modern">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p>جاري تحميل الحصص الحية...</p>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && liveClasses.length === 0" class="empty-state-modern">
        <div class="empty-icon"><i class="fas fa-calendar-times"></i></div>
        <h3>لا توجد حصص حية</h3>
        <p>لم يتم إنشاء أي حصص حية بعد. يمكنك إنشاء حصة جديدة باستخدام الزر أعلاه.</p>
      </div>

      <!-- Cards -->
      <div class="cards-grid">
        <div *ngFor="let liveClass of liveClasses" class="class-card" [ngClass]="getCardClass(liveClass.status)">
          <div class="card-status-badge" [ngClass]="getStatusClass(liveClass.status)">
            {{getStatusText(liveClass.status)}}
          </div>
          <div class="card-header">
            <div class="class-icon"><i class="fas fa-video"></i></div>
            <div class="class-info">
              <h3>{{getClassName(liveClass)}}</h3>
              <span class="subject-tag">{{getClassSubject(liveClass)}}</span>
            </div>
            <div class="card-actions">
              <button class="icon-btn" (click)="toggleClassDetails(liveClass)" [title]="liveClass.showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'">
                <i class="fas" [ngClass]="liveClass.showDetails ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </button>
              <button class="icon-btn" (click)="openAttendanceModal(liveClass)" title="تسجيل الحضور">
                <i class="fas fa-clipboard-check"></i>
              </button>
              <button class="icon-btn" (click)="editLiveClass(liveClass)" title="تعديل">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-btn danger" (click)="confirmDeleteLiveClass(liveClass._id)" title="حذف">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          <div class="card-meta">
            <span class="meta-chip"><i class="fas fa-calendar-alt"></i> {{formatDate(liveClass.date)}}</span>
            <span class="meta-chip"><i class="fas fa-clock"></i> {{liveClass.startTime}} {{liveClass.endTime ? '- ' + liveClass.endTime : ''}}</span>
            <span class="meta-chip"><i class="fas fa-chalkboard-user"></i> {{getTeacherName(liveClass)}}</span>
            <span class="meta-chip"><i class="fas fa-door-open"></i> {{getClassroomName(liveClass) || 'غير محدد'}}</span>
          </div>

          <!-- Details -->
          <div *ngIf="liveClass.showDetails" class="card-details">
            <!-- Edit -->
            <div *ngIf="liveClass._id === editingClassId" class="edit-section">
              <div class="edit-header"><i class="fas fa-edit"></i><h4>تعديل الحصة</h4></div>
              <form #editForm="ngForm" (ngSubmit)="updateLiveClass(liveClass)">
                <div class="form-grid compact">
                  <div class="form-field">
                    <label>الحالة</label>
                    <select class="modern-select" [(ngModel)]="liveClass.status" name="editStatus">
                      <option value="scheduled">مجدولة</option>
                      <option value="ongoing">جارية</option>
                      <option value="completed">مكتملة</option>
                      <option value="cancelled">ملغاة</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>وقت النهاية</label>
                    <input type="time" class="modern-input" [(ngModel)]="liveClass.endTime" name="editEndTime">
                  </div>
                </div>
                <div class="form-field">
                  <label>ملاحظات</label>
                  <textarea class="modern-textarea" [(ngModel)]="liveClass.notes" name="editNotes" rows="2"></textarea>
                </div>
                <div class="edit-actions">
                  <button type="submit" class="btn-submit small" [disabled]="loading">
                    <i class="fas fa-check"></i> حفظ
                  </button>
                  <button type="button" class="btn-cancel small" (click)="cancelEdit()">
                    <i class="fas fa-times"></i> إلغاء
                  </button>
                </div>
              </form>
            </div>

            <!-- Stats -->
            <div class="stats-grid">
              <div class="stat-card present">
                <div class="stat-value">{{countAttendance(liveClass, 'present')}}</div>
                <div class="stat-label">حاضر</div>
                <i class="fas fa-check-circle stat-icon"></i>
              </div>
              <div class="stat-card absent">
                <div class="stat-value">{{countAttendance(liveClass, 'absent')}}</div>
                <div class="stat-label">غائب</div>
                <i class="fas fa-times-circle stat-icon"></i>
              </div>
              <div class="stat-card late">
                <div class="stat-value">{{countAttendance(liveClass, 'late')}}</div>
                <div class="stat-label">متأخر</div>
                <i class="fas fa-clock stat-icon"></i>
              </div>
              <div class="stat-card total">
                <div class="stat-value">{{getTotalStudents(liveClass)}}</div>
                <div class="stat-label">إجمالي</div>
                <i class="fas fa-users stat-icon"></i>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions-modern">
              <button class="action-btn warning" (click)="autoMarkAbsent(liveClass._id)">
                <i class="fas fa-robot"></i> تسجيل الغائبين تلقائياً
              </button>
              <button class="action-btn info" (click)="getClassAttendanceReport(liveClass.class?._id)">
                <i class="fas fa-chart-bar"></i> تقرير الحضور
              </button>
              <button class="action-btn success" (click)="exportMonthlyAttendance(liveClass.class?._id)">
                <i class="fas fa-file-excel"></i> تصدير Excel
              </button>
              <button class="action-btn primary" (click)="startLiveClass(liveClass._id)">
                <i class="fas fa-play"></i> بدء الحصة
              </button>
              <button class="action-btn success" (click)="completeLiveClass(liveClass._id)">
                <i class="fas fa-stop"></i> إنهاء الحصة
              </button>
            </div>

            <!-- Students Table -->
            <div *ngIf="liveClass.studentsLoaded && liveClass.class?.students?.length > 0" class="students-table-modern">
              <div class="table-header">
                <i class="fas fa-user-graduate"></i>
                <h5>قائمة الطلاب ({{liveClass.class.students.length}})</h5>
              </div>
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>اسم الطالب</th>
                      <th>رقم الطالب</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let student of liveClass.class.students">
                      <td>
                        <div class="student-info">
                          <i class="fas fa-user-circle"></i>
                          <span>{{student.name}}</span>
                        </div>
                      </td>
                      <td>{{student.studentId}}</td>
                      <td>
                        <span class="status-badge-modern" [ngClass]="getAttendanceStatusClass(liveClass, student._id)">
                          {{getAttendanceStatus(liveClass, student._id)}}
                        </span>
                      </td>
                      <td>
                        <div class="action-buttons-modern">
                          <button class="tiny-btn success" (click)="markStudentAttendance(liveClass._id, student._id, 'present')" title="حاضر">
                            <i class="fas fa-check"></i>
                          </button>
                          <button class="tiny-btn danger" (click)="markStudentAttendance(liveClass._id, student._id, 'absent')" title="غائب">
                            <i class="fas fa-times"></i>
                          </button>
                          <button class="tiny-btn warning" (click)="markStudentAttendance(liveClass._id, student._id, 'late')" title="متأخر">
                            <i class="fas fa-clock"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div *ngIf="!liveClass.studentsLoaded && liveClass.class?._id" class="load-students-btn">
              <button class="outline-btn" (click)="loadClassStudents(liveClass)">
                <i class="fas fa-user-friends"></i> تحميل قائمة الطلاب
              </button>
            </div>

            <div *ngIf="liveClass.notes" class="notes-section">
              <i class="fas fa-sticky-note"></i>
              <p><strong>ملاحظات:</strong> {{liveClass.notes}}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="liveClasses.length > 0" class="pagination-modern">
        <button class="page-nav" [disabled]="currentPage === 1" (click)="previousPage()">
          <i class="fas fa-chevron-right"></i> السابق
        </button>
        <div class="page-numbers">
          <span class="page-number active">{{currentPage}}</span>
          <span class="page-separator">/</span>
          <span class="page-total">{{totalPages}}</span>
        </div>
        <button class="page-nav" [disabled]="currentPage === totalPages" (click)="nextPage()">
          التالي <i class="fas fa-chevron-left"></i>
        </button>
      </div>
    </div>

    <!-- ==================== ATTENDANCE MODAL ==================== -->
    <div *ngIf="showAttendanceModal" class="modal-overlay" (click)="closeAttendanceModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-clipboard-check"></i> تسجيل الحضور</h3>
          <button class="modal-close" (click)="closeAttendanceModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div *ngIf="selectedLiveClass" class="modal-info">
            <p><strong>الحصة:</strong> {{getClassName(selectedLiveClass)}}</p>
            <p><strong>التاريخ:</strong> {{formatDate(selectedLiveClass.date)}}</p>
            <p><strong>الوقت:</strong> {{selectedLiveClass.startTime}} {{selectedLiveClass.endTime ? '- ' + selectedLiveClass.endTime : ''}}</p>
          </div>

          <!-- Quick Attendance Form -->
          <div class="quick-attendance-form">
            <h4><i class="fas fa-user-plus"></i> تسجيل حضور سريع</h4>
            <div class="form-row">
              <div class="form-group">
                <label>الطالب</label>
                <select class="modern-select" [(ngModel)]="quickAttendance.studentId">
                  <option value="">اختر طالب...</option>
                  <option *ngFor="let student of allStudents" [value]="student._id">
                    {{student.name}} ({{student.studentId}})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>الحالة</label>
                <select class="modern-select" [(ngModel)]="quickAttendance.status">
                  <option value="present">حاضر</option>
                  <option value="absent">غائب</option>
                  <option value="late">متأخر</option>
                </select>
              </div>
              <div class="form-group">
                <label>&nbsp;</label>
                <button class="btn-submit" (click)="submitQuickAttendance()" [disabled]="!quickAttendance.studentId">
                  <i class="fas fa-save"></i> تسجيل
                </button>
              </div>
            </div>
          </div>

          <!-- Attendance List -->
          <div class="attendance-list">
            <h4><i class="fas fa-list"></i> سجل الحضور</h4>
            <div class="attendance-stats">
              <span class="stat-badge present">حاضر: {{getAttendanceCount(selectedLiveClass, 'present')}}</span>
              <span class="stat-badge absent">غائب: {{getAttendanceCount(selectedLiveClass, 'absent')}}</span>
              <span class="stat-badge late">متأخر: {{getAttendanceCount(selectedLiveClass, 'late')}}</span>
              <span class="stat-badge total">إجمالي: {{getAttendanceCount(selectedLiveClass, 'total')}}</span>
            </div>
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>رقم الطالب</th>
                    <th>الحالة</th>
                    <th>وقت التسجيل</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let att of selectedLiveClass?.attendance || []">
                    <td>{{getStudentName(att.student)}}</td>
                    <td>{{getStudentId(att.student)}}</td>
                    <td>
                      <span class="status-badge-modern" [ngClass]="att.status">
                        {{att.status === 'present' ? 'حاضر' : att.status === 'absent' ? 'غائب' : 'متأخر'}}
                      </span>
                    </td>
                    <td>{{att.timestamp ? formatTime(att.timestamp) : '-'}}</td>
                    <td>
                      <button class="tiny-btn danger" (click)="removeAttendance(selectedLiveClass!._id, att.student)" title="حذف">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="!selectedLiveClass?.attendance?.length">
                    <td colspan="5" class="text-center">لا توجد سجلات حضور</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeAttendanceModal()">إغلاق</button>
        </div>
      </div>
    </div>

    <!-- ==================== REPORT MODAL ==================== -->
    <div *ngIf="showReportModal" class="modal-overlay" (click)="closeReportModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-chart-bar"></i> تقرير الحضور</h3>
          <button class="modal-close" (click)="closeReportModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div *ngIf="reportLoading" class="loading-modern">
            <p>جاري تحميل التقرير...</p>
          </div>
          <div *ngIf="!reportLoading && attendanceReport">
            <div class="report-summary">
              <h4>{{attendanceReport.class?.name}}</h4>
              <p><strong>المادة:</strong> {{attendanceReport.class?.subject}}</p>
              <p><strong>الأستاذ:</strong> {{attendanceReport.class?.teacher}}</p>
              <div class="report-stats">
                <span class="stat-badge present">حاضر: {{attendanceReport.summary?.totalPresent || 0}}</span>
                <span class="stat-badge absent">غائب: {{attendanceReport.summary?.totalAbsent || 0}}</span>
                <span class="stat-badge late">متأخر: {{attendanceReport.summary?.totalLate || 0}}</span>
                <span class="stat-badge total">إجمالي: {{attendanceReport.summary?.totalStudents || 0}}</span>
              </div>
            </div>
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>حاضر</th>
                    <th>غائب</th>
                    <th>متأخر</th>
                    <th>نسبة الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let student of attendanceReport.students || []">
                    <td>{{student.name}}</td>
                    <td>{{student.statistics?.present || 0}}</td>
                    <td>{{student.statistics?.absent || 0}}</td>
                    <td>{{student.statistics?.late || 0}}</td>
                    <td>
                      <span class="attendance-rate" [ngClass]="getAttendanceRateClass(student.statistics?.attendanceRate || 0)">
                        {{student.statistics?.attendanceRate || 0}}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-success" (click)="exportReport()" *ngIf="attendanceReport?.class?._id">
            <i class="fas fa-file-excel"></i> تصدير Excel
          </button>
          <button class="btn-cancel" (click)="closeReportModal()">إغلاق</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ========== MAIN STYLES ========== */
    :host { display: block; background: #f9fafb; min-height: 100vh; }
    .live-class-container { padding: 24px; font-family: 'Tajawal', 'Segoe UI', sans-serif; direction: rtl; }

    /* Header */
    .modern-header { background: white; border-radius: 20px; padding: 20px 28px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .title-section { display: flex; align-items: center; gap: 16px; }
    .icon-wrapper { width: 52px; height: 52px; background: linear-gradient(135deg, #4361ee 0%, #3b82f6 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
    .icon-wrapper i { font-size: 28px; color: white; }
    .title-section h1 { font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0; }
    .title-section p { font-size: 14px; color: #6b7280; margin: 0; }
    .header-actions { display: flex; gap: 12px; }

    .btn-glass { background: #f3f4f6; border: none; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 500; color: #4b5563; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn-glass:hover { background: #e5e7eb; transform: translateY(-1px); }
    .btn-primary-modern { background: linear-gradient(135deg, #4361ee 0%, #3b82f6 100%); border: none; padding: 10px 24px; border-radius: 12px; font-size: 14px; font-weight: 500; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(67, 97, 238, 0.2); }
    .btn-primary-modern:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(67, 97, 238, 0.25); }

    /* Filters */
    .filters-modern { background: white; border-radius: 20px; padding: 20px 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .filters-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
    .filters-header i { font-size: 18px; color: #4361ee; }
    .filters-header h3 { font-size: 16px; font-weight: 600; color: #374151; margin: 0; }
    .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .filter-item label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #4b5563; margin-bottom: 8px; }
    .modern-select, .modern-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: white; font-family: inherit; }
    .modern-select:focus, .modern-input:focus { outline: none; border-color: #4361ee; box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1); }

    /* Create Form */
    .create-form-modern { background: white; border-radius: 20px; margin-bottom: 28px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); animation: slideDown 0.3s ease; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    .form-header { background: linear-gradient(135deg, #f9fafb 0%, white 100%); padding: 18px 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px; position: relative; }
    .form-header i { font-size: 20px; color: #4361ee; }
    .form-header h3 { font-size: 18px; font-weight: 600; color: #1f2937; margin: 0; }
    .close-btn { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); background: none; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.2s; }
    .close-btn:hover { background: #f3f4f6; color: #ef4444; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 24px; }
    .form-grid.compact { gap: 16px; padding: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 8px; }
    .form-field.full-width { grid-column: 1 / -1; padding: 0 24px 24px 24px; }
    .form-field label { font-size: 13px; font-weight: 500; color: #4b5563; display: flex; align-items: center; gap: 6px; }
    .modern-textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; font-family: inherit; resize: vertical; transition: all 0.2s; }
    .modern-textarea:focus { outline: none; border-color: #4361ee; box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1); }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; }

    /* Buttons */
    .btn-submit { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-submit.small { padding: 6px 16px; font-size: 13px; }
    .btn-cancel { background: #f3f4f6; border: 1px solid #d1d5db; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #4b5563; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn-cancel:hover { background: #e5e7eb; }
    .btn-cancel.small { padding: 6px 16px; font-size: 13px; }
    .btn-success { background: #10b981; border: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn-success:hover { background: #059669; }

    /* Loading */
    .loading-modern { text-align: center; padding: 60px 20px; }
    .spinner-modern { position: relative; width: 60px; height: 60px; margin: 0 auto 20px; }
    .spinner-ring { position: absolute; width: 100%; height: 100%; border: 3px solid transparent; border-top-color: #4361ee; border-radius: 50%; animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; }
    .spinner-ring:nth-child(2) { border-top-color: #3b82f6; animation-delay: 0.2s; width: 80%; height: 80%; top: 10%; left: 10%; }
    .spinner-ring:nth-child(3) { border-top-color: #06b6d4; animation-delay: 0.4s; width: 60%; height: 60%; top: 20%; left: 20%; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Empty */
    .empty-state-modern { text-align: center; padding: 60px 20px; background: white; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .empty-icon { width: 80px; height: 80px; background: #f3f4f6; border-radius: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .empty-icon i { font-size: 40px; color: #9ca3af; }
    .empty-state-modern h3 { font-size: 20px; font-weight: 600; color: #374151; margin-bottom: 8px; }
    .empty-state-modern p { color: #6b7280; font-size: 14px; }

    /* Cards */
    .cards-grid { display: flex; flex-direction: column; gap: 20px; }
    .class-card { background: white; border-radius: 20px; overflow: hidden; transition: all 0.3s ease; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .class-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .class-card.scheduled { border-right: 4px solid #f59e0b; }
    .class-card.ongoing { border-right: 4px solid #06b6d4; }
    .class-card.completed { border-right: 4px solid #10b981; }
    .class-card.cancelled { border-right: 4px solid #ef4444; }

    .card-status-badge { position: absolute; top: 16px; right: 20px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; z-index: 1; }
    .card-status-badge.scheduled { background: #fef3c7; color: #d97706; }
    .card-status-badge.ongoing { background: #dbeafe; color: #4361ee; }
    .card-status-badge.completed { background: #d1fae5; color: #10b981; }
    .card-status-badge.cancelled { background: #fee2e2; color: #ef4444; }

    .card-header { padding: 20px 24px; display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .class-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #4361ee 0%, #3b82f6 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .class-icon i { font-size: 24px; color: white; }
    .class-info { flex: 1; min-width: 120px; }
    .class-info h3 { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 6px; }
    .subject-tag { background: #f3f4f6; padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #4b5563; }

    .card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .icon-btn { width: 36px; height: 36px; border: none; background: #f3f4f6; border-radius: 10px; cursor: pointer; color: #4b5563; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .icon-btn:hover { background: #e5e7eb; transform: scale(1.05); }
    .icon-btn.danger:hover { background: #fee2e2; color: #ef4444; }

    .card-meta { padding: 12px 24px 20px 24px; display: flex; flex-wrap: wrap; gap: 12px; border-top: 1px solid #e5e7eb; }
    .meta-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background: #f3f4f6; border-radius: 20px; font-size: 12px; color: #4b5563; }

    .card-details { padding: 0 24px 24px 24px; border-top: 1px solid #e5e7eb; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .edit-section { background: #f9fafb; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
    .edit-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .edit-header i { font-size: 18px; color: #4361ee; }
    .edit-header h4 { font-size: 16px; font-weight: 600; color: #374151; margin: 0; }
    .edit-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border-radius: 16px; padding: 16px; text-align: center; position: relative; transition: all 0.2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-card.present { border-bottom: 3px solid #10b981; }
    .stat-card.absent { border-bottom: 3px solid #ef4444; }
    .stat-card.late { border-bottom: 3px solid #f59e0b; }
    .stat-card.total { border-bottom: 3px solid #4361ee; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .stat-icon { position: absolute; bottom: 12px; left: 12px; font-size: 20px; opacity: 0.3; }
    .stat-card.present .stat-icon { color: #10b981; }
    .stat-card.absent .stat-icon { color: #ef4444; }
    .stat-card.late .stat-icon { color: #f59e0b; }
    .stat-card.total .stat-icon { color: #4361ee; }

    /* Quick Actions */
    .quick-actions-modern { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .action-btn { padding: 8px 16px; border: none; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .action-btn.warning { background: #fef3c7; color: #d97706; }
    .action-btn.warning:hover { background: #fde68a; }
    .action-btn.info { background: #dbeafe; color: #4361ee; }
    .action-btn.info:hover { background: #bfdbfe; }
    .action-btn.success { background: #d1fae5; color: #10b981; }
    .action-btn.success:hover { background: #a7f3d0; }
    .action-btn.primary { background: #4361ee; color: white; }
    .action-btn.primary:hover { background: #3a56d4; }

    /* Students Table */
    .students-table-modern { margin-top: 24px; }
    .table-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .table-header i { font-size: 18px; color: #4361ee; }
    .table-header h5 { font-size: 15px; font-weight: 600; color: #374151; margin: 0; }
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; color: #4b5563; }
    .text-center { text-align: center; }

    .student-info { display: flex; align-items: center; gap: 8px; }
    .student-info i { font-size: 14px; color: #4361ee; }

    .status-badge-modern { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
    .status-badge-modern.present { background: #d1fae5; color: #10b981; }
    .status-badge-modern.absent { background: #fee2e2; color: #ef4444; }
    .status-badge-modern.late { background: #fef3c7; color: #f59e0b; }

    .action-buttons-modern { display: flex; gap: 6px; }
    .tiny-btn { width: 28px; height: 28px; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .tiny-btn.success { background: #d1fae5; color: #10b981; }
    .tiny-btn.success:hover { background: #10b981; color: white; }
    .tiny-btn.danger { background: #fee2e2; color: #ef4444; }
    .tiny-btn.danger:hover { background: #ef4444; color: white; }
    .tiny-btn.warning { background: #fef3c7; color: #f59e0b; }
    .tiny-btn.warning:hover { background: #f59e0b; color: white; }

    .load-students-btn { text-align: center; margin-top: 20px; }
    .outline-btn { background: transparent; border: 2px solid #4361ee; padding: 10px 24px; border-radius: 12px; font-size: 14px; font-weight: 500; color: #4361ee; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .outline-btn:hover { background: #4361ee; color: white; }

    .notes-section { background: #f9fafb; border-radius: 12px; padding: 12px 16px; margin-top: 20px; display: flex; gap: 12px; align-items: flex-start; }
    .notes-section i { color: #4361ee; font-size: 16px; margin-top: 2px; }
    .notes-section p { margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5; }

    /* Pagination */
    .pagination-modern { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 32px; padding-top: 20px; }
    .page-nav { background: white; border: 1px solid #d1d5db; padding: 8px 20px; border-radius: 12px; font-size: 14px; font-weight: 500; color: #4b5563; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .page-nav:hover:not(:disabled) { background: #4361ee; border-color: #4361ee; color: white; }
    .page-nav:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-numbers { display: flex; align-items: center; gap: 8px; }
    .page-number { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-weight: 500; }
    .page-number.active { background: #4361ee; color: white; }
    .page-separator { color: #9ca3af; }
    .page-total { color: #6b7280; }

    /* ========== MODAL STYLES ========== */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s; }
    .modal-content { background: white; border-radius: 20px; max-width: 900px; width: 95%; max-height: 90vh; overflow: hidden; animation: slideUp 0.3s; }
    @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 20px; color: #1f2937; display: flex; align-items: center; gap: 10px; }
    .modal-header h3 i { color: #4361ee; }
    .modal-close { background: none; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; transition: all 0.2s; padding: 0 8px; }
    .modal-close:hover { color: #ef4444; transform: rotate(90deg); }
    .modal-body { padding: 24px; overflow-y: auto; max-height: calc(90vh - 140px); }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }

    /* Modal Info */
    .modal-info { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .modal-info p { margin: 4px 0; color: #4b5563; }
    .modal-info p strong { color: #1f2937; }

    /* Quick Attendance Form */
    .quick-attendance-form { background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #d1fae5; }
    .quick-attendance-form h4 { margin: 0 0 12px 0; color: #065f46; display: flex; align-items: center; gap: 8px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 13px; font-weight: 500; color: #4b5563; }

    /* Attendance List */
    .attendance-list { margin-top: 16px; }
    .attendance-list h4 { margin: 0 0 12px 0; color: #1f2937; display: flex; align-items: center; gap: 8px; }
    .attendance-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .stat-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .stat-badge.present { background: #d1fae5; color: #10b981; }
    .stat-badge.absent { background: #fee2e2; color: #ef4444; }
    .stat-badge.late { background: #fef3c7; color: #f59e0b; }
    .stat-badge.total { background: #dbeafe; color: #4361ee; }

    /* Report */
    .report-summary { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .report-summary h4 { margin: 0 0 8px 0; color: #1f2937; }
    .report-summary p { margin: 4px 0; color: #4b5563; }
    .report-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .attendance-rate { padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .attendance-rate.good { background: #d1fae5; color: #10b981; }
    .attendance-rate.warning { background: #fef3c7; color: #d97706; }
    .attendance-rate.poor { background: #fee2e2; color: #ef4444; }

    /* Responsive */
    @media (max-width: 768px) {
      .live-class-container { padding: 16px; }
      .header-content { flex-direction: column; align-items: flex-start; }
      .header-actions { width: 100%; }
      .btn-glass, .btn-primary-modern { flex: 1; justify-content: center; }
      .filters-grid { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .quick-actions-modern { flex-direction: column; }
      .action-btn { justify-content: center; }
      .form-row { grid-template-columns: 1fr; }
      .modal-content { max-width: 100%; margin: 10px; border-radius: 16px; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .card-header { flex-direction: column; align-items: stretch; }
      .card-actions { justify-content: center; }
      .card-meta { flex-direction: column; align-items: center; }
      .action-buttons-modern { flex-wrap: wrap; justify-content: center; }
    }
  `]
})
export class LiveClassComponent implements OnInit, OnDestroy {
  private apiUrl = '';
  private http = inject(HttpClient);
  
  liveClasses: LiveClass[] = [];
  allClasses: Class[] = [];
  teachers: Teacher[] = [];
  students: Student[] = [];
  allStudents: Student[] = [];
  classrooms: Classroom[] = [];
  
  loading = false;
  showCreateForm = false;
  showAttendanceModal = false;
  showReportModal = false;
  editingClassId: string | null = null;
  selectedLiveClass: LiveClass | null = null;
  attendanceReport: any = null;
  reportLoading = false;
  
  newLiveClass: any = {
    classId: '',
    date: '',
    startTime: '08:00',
    endTime: '',
    teacherId: '',
    classroomId: '',
    status: 'scheduled',
    notes: ''
  };
  
  quickAttendance: any = {
    studentId: '',
    status: 'present',
    method: 'manual'
  };
  
  filters: any = {
    status: '',
    date: '',
    class: '',
    teacher: ''
  };
  
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;
  
  private refreshInterval: any;
  private currentSchoolId: string | null = null;

  // ==============================================
  // LIFECYCLE
  // ==============================================
  ngOnInit(): void {
    this.loadSchoolId();
    this.loadInitialData();
    this.refreshInterval = setInterval(() => {
      this.loadLiveClasses();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ==============================================
  // HELPER: استخراج المصفوفة من أي استجابة API
  // ==============================================
  private extractDataArray(response: any): any[] {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    for (const key of Object.keys(response)) {
      if (Array.isArray(response[key])) return response[key];
    }
    return [];
  }

  // ==============================================
  // SCHOOL ID
  // ==============================================
  loadSchoolId(): void {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        const school = JSON.parse(schoolData);
        this.currentSchoolId = school._id || school.id || null;
        console.log('🏫 School ID:', this.currentSchoolId);
      } else {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          this.currentSchoolId = user.schoolId || null;
        }
      }
      if (!this.currentSchoolId) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.currentSchoolId = payload.schoolId || null;
          } catch (e) { console.warn('Token parse error:', e); }
        }
      }
      console.log(this.currentSchoolId ? '✅ School ID loaded' : '⚠️ No School ID');
    } catch (err) {
      console.error('❌ Error loading school ID:', err);
    }
  }

  getSchoolId(): string | null { return this.currentSchoolId; }

  // ==============================================
  // TOGGLE CREATE FORM
  // ==============================================
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) this.resetNewLiveClass();
  }

  // ==============================================
  // LOAD INITIAL DATA
  // ==============================================
  loadInitialData(): void {
    this.loadLiveClasses();
    this.loadAllClasses();
    this.loadTeachers();
    this.loadAllStudents();
    this.loadClassrooms();
  }

  // ==============================================
  // LOAD LIVE CLASSES
  // ==============================================
  loadLiveClasses(): void {
    const schoolId = this.getSchoolId();
    if (!schoolId) {
      this.liveClasses = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    let url = `${this.apiUrl}/api/live-classes?schoolId=${schoolId}`;
    if (this.filters.status) url += `&status=${this.filters.status}`;
    if (this.filters.date) url += `&date=${this.filters.date}`;
    if (this.filters.class) url += `&class=${this.filters.class}`;
    if (this.filters.teacher) url += `&teacher=${this.filters.teacher}`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        const data = this.extractDataArray(response);
        this.liveClasses = data.map((lc: any) => ({ ...lc, showDetails: false, studentsLoaded: false }));
        this.totalPages = Math.ceil(this.liveClasses.length / this.itemsPerPage);
        this.loading = false;
        console.log(`✅ Loaded ${this.liveClasses.length} live classes`);
      },
      error: (error) => {
        console.error('❌ Error loading live classes:', error);
        this.loading = false;
        this.liveClasses = [];
        alert('❌ حدث خطأ في تحميل الحصص الحية');
      }
    });
  }

  // ==============================================
  // LOAD ALL CLASSES
  // ==============================================
  loadAllClasses(): void {
    const schoolId = this.getSchoolId();
    if (!schoolId) { this.allClasses = []; return; }
    this.http.get<any>(`${this.apiUrl}/api/classes?schoolId=${schoolId}`).subscribe({
      next: (response) => {
        this.allClasses = this.extractDataArray(response);
        console.log(`✅ Loaded ${this.allClasses.length} classes`);
      },
      error: (err) => { console.error('❌ Error loading classes:', err); this.allClasses = []; }
    });
  }

  // ==============================================
  // LOAD TEACHERS
  // ==============================================
  loadTeachers(): void {
    const schoolId = this.getSchoolId();
    if (!schoolId) { this.teachers = []; return; }
    this.http.get<any>(`${this.apiUrl}/api/teachers?schoolId=${schoolId}`).subscribe({
      next: (response) => {
        this.teachers = this.extractDataArray(response);
        console.log(`✅ Loaded ${this.teachers.length} teachers`);
      },
      error: (err) => { console.error('❌ Error loading teachers:', err); this.teachers = []; }
    });
  }

  // ==============================================
  // LOAD ALL STUDENTS
  // ==============================================
  loadAllStudents(): void {
    const schoolId = this.getSchoolId();
    if (!schoolId) { this.allStudents = []; return; }
    this.http.get<any>(`${this.apiUrl}/api/students?schoolId=${schoolId}`).subscribe({
      next: (response) => {
        this.allStudents = this.extractDataArray(response);
        console.log(`✅ Loaded ${this.allStudents.length} students`);
      },
      error: (err) => { console.error('❌ Error loading students:', err); this.allStudents = []; }
    });
  }

  // ==============================================
  // LOAD CLASSROOMS
  // ==============================================
  loadClassrooms(): void {
    const schoolId = this.getSchoolId();
    if (!schoolId) { this.classrooms = []; return; }
    this.http.get<any>(`${this.apiUrl}/api/classrooms?schoolId=${schoolId}`).subscribe({
      next: (response) => {
        this.classrooms = this.extractDataArray(response);
        console.log(`✅ Loaded ${this.classrooms.length} classrooms`);
      },
      error: (err) => { console.error('❌ Error loading classrooms:', err); this.classrooms = []; }
    });
  }

  // ==============================================
  // LOAD CLASS STUDENTS
  // ==============================================
  loadClassStudents(liveClass: LiveClass): void {
    if (!liveClass.class?._id) { alert('معرف الحصة غير موجود'); return; }
    const schoolId = this.getSchoolId();
    this.http.get<any>(`${this.apiUrl}/api/classes/${liveClass.class._id}?schoolId=${schoolId}`).subscribe({
      next: (response) => {
        let students: Student[] = [];
        if (response?.data?.students) students = response.data.students;
        else if (response?.students) students = response.students;
        else if (response?.data && Array.isArray(response.data)) students = response.data;
        if (liveClass.class && typeof liveClass.class === 'object') {
          (liveClass.class as Class).students = students;
        }
        liveClass.studentsLoaded = true;
        console.log(`✅ Loaded ${students.length} students`);
      },
      error: (err) => { console.error('❌ Error loading students:', err); alert('فشل في تحميل قائمة الطلاب'); }
    });
  }

  // ==============================================
  // LOAD ATTENDANCE
  // ==============================================
  loadLiveClassAttendance(liveClassId: string): void {
    const schoolId = this.getSchoolId();
    this.http.get<any>(`${this.apiUrl}/api/live-classes/${liveClassId}/attendance?schoolId=${schoolId}`).subscribe({
      next: (data) => {
        const liveClass = this.liveClasses.find(lc => lc._id === liveClassId);
        if (liveClass) liveClass.attendance = data.attendance || [];
      },
      error: (err) => console.error('❌ Error loading attendance:', err)
    });
  }

  // ==============================================
  // CREATE LIVE CLASS
  // ==============================================
  createLiveClass(): void {
    if (!this.validateLiveClassForm()) return;
    const schoolId = this.getSchoolId();
    if (!schoolId) { alert('⚠️ لا يوجد معرف للمدرسة'); return; }
    
    const payload: any = {
      classId: this.newLiveClass.classId,
      date: this.newLiveClass.date,
      startTime: this.newLiveClass.startTime,
      teacherId: this.newLiveClass.teacherId,
      schoolId: schoolId
    };
    if (this.newLiveClass.endTime) payload.endTime = this.newLiveClass.endTime;
    if (this.newLiveClass.classroomId) payload.classroomId = this.newLiveClass.classroomId;
    if (this.newLiveClass.status) payload.status = this.newLiveClass.status;
    if (this.newLiveClass.notes) payload.notes = this.newLiveClass.notes;
    
    this.loading = true;
    this.http.post(`${this.apiUrl}/api/live-classes`, payload).subscribe({
      next: () => {
        alert('✅ تم إنشاء الحصة بنجاح');
        this.loadLiveClasses();
        this.resetNewLiveClass();
        this.showCreateForm = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ ' + (err.error?.error || err.error?.message || 'حدث خطأ'));
        this.loading = false;
      }
    });
  }

  // ==============================================
  // UPDATE LIVE CLASS
  // ==============================================
  updateLiveClass(liveClass: LiveClass): void {
    const schoolId = this.getSchoolId();
    this.loading = true;
    this.http.put(`${this.apiUrl}/api/live-classes/${liveClass._id}?schoolId=${schoolId}`, {
      status: liveClass.status,
      endTime: liveClass.endTime,
      notes: liveClass.notes
    }).subscribe({
      next: () => {
        alert('✅ تم تحديث الحصة');
        this.editingClassId = null;
        this.loadLiveClasses();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ حدث خطأ أثناء التحديث');
        this.loading = false;
      }
    });
  }

  // ==============================================
  // DELETE LIVE CLASS
  // ==============================================
  confirmDeleteLiveClass(liveClassId: string): void {
    if (confirm('⚠️ هل أنت متأكد من حذف هذه الحصة؟')) {
      this.deleteLiveClass(liveClassId);
    }
  }

  deleteLiveClass(liveClassId: string): void {
    const schoolId = this.getSchoolId();
    this.loading = true;
    this.http.delete(`${this.apiUrl}/api/live-classes/${liveClassId}?schoolId=${schoolId}`).subscribe({
      next: () => {
        alert('✅ تم حذف الحصة');
        this.loadLiveClasses();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ حدث خطأ أثناء الحذف');
        this.loading = false;
      }
    });
  }

  // ==============================================
  // START LIVE CLASS
  // ==============================================
  startLiveClass(liveClassId: string): void {
    if (!confirm('هل تريد بدء هذه الحصة؟')) return;
    const schoolId = this.getSchoolId();
    this.loading = true;
    this.http.put(`${this.apiUrl}/api/live-classes/${liveClassId}/start?schoolId=${schoolId}`, {}).subscribe({
      next: (response: any) => {
        alert('✅ تم بدء الحصة');
        if (response.classroomUpdated) alert('✅ تم تحديث حالة الغرفة إلى "مشغولة"');
        this.loadLiveClasses();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ فشل في بدء الحصة');
        this.loading = false;
      }
    });
  }

  // ==============================================
  // COMPLETE LIVE CLASS
  // ==============================================
  completeLiveClass(liveClassId: string): void {
    if (!confirm('هل تريد إنهاء هذه الحصة؟')) return;
    const schoolId = this.getSchoolId();
    this.loading = true;
    this.http.put(`${this.apiUrl}/api/live-classes/${liveClassId}/complete?schoolId=${schoolId}`, {}).subscribe({
      next: (response: any) => {
        alert('✅ تم إنهاء الحصة');
        if (response.classroomUpdated) alert('✅ تم تحديث حالة الغرفة إلى "متاحة"');
        if (response.autoMarkResult) {
          alert(`✅ تم تسجيل ${response.autoMarkResult.markedAbsent || 0} طالب كغائبين`);
        }
        this.loadLiveClasses();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ فشل في إنهاء الحصة');
        this.loading = false;
      }
    });
  }

  // ==============================================
  // MARK STUDENT ATTENDANCE
  // ==============================================
  markStudentAttendance(liveClassId: string, studentId: string, status: string): void {
    const schoolId = this.getSchoolId();
    this.loading = true;
    this.http.post(`${this.apiUrl}/api/live-classes/${liveClassId}/attendance?schoolId=${schoolId}`, {
      studentId, status, method: 'manual', sendSMS: status === 'absent'
    }).subscribe({
      next: () => {
        alert(`✅ تم تسجيل ${status === 'present' ? 'الحضور' : status === 'absent' ? 'الغياب' : 'التأخير'}`);
        this.loadLiveClasses();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ حدث خطأ أثناء تسجيل الحضور');
        this.loading = false;
      }
    });
  }

  // ==============================================
  // AUTO MARK ABSENT
  // ==============================================
  autoMarkAbsent(liveClassId: string): void {
    if (!confirm('⚠️ سيتم تسجيل جميع الطلاب غير المسجل حضورهم كغائبين وإرسال رسائل لأولياء أمورهم. هل تريد المتابعة؟')) return;
    const schoolId = this.getSchoolId();
    this.loading = true;
    this.http.post(`${this.apiUrl}/api/live-classes/${liveClassId}/auto-mark-absent?schoolId=${schoolId}`, {
      sendSMS: true
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert(`✅ تم تسجيل ${response.data?.absentCount || 0} طالب كغائبين`);
          if (response.data?.smsResults?.sent > 0) {
            alert(`✅ تم إرسال ${response.data.smsResults.sent} رسالة إشعار`);
          }
          this.loadLiveClasses();
        } else {
          alert(response.error || 'حدث خطأ');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ حدث خطأ أثناء تسجيل الغائبين');
        this.loading = false;
      }
    });
  }

  // ==============================================
  // SUBMIT QUICK ATTENDANCE
  // ==============================================
  submitQuickAttendance(): void {
    if (!this.selectedLiveClass || !this.quickAttendance.studentId) {
      alert('يرجى اختيار طالب');
      return;
    }
    this.markStudentAttendance(
      this.selectedLiveClass._id,
      this.quickAttendance.studentId,
      this.quickAttendance.status
    );
    this.quickAttendance = { studentId: '', status: 'present', method: 'manual' };
  }

  // ==============================================
  // REMOVE ATTENDANCE
  // ==============================================
  removeAttendance(liveClassId: string, student: any): void {
    if (!confirm('هل تريد حذف سجل الحضور هذا؟')) return;
    const liveClass = this.liveClasses.find(lc => lc._id === liveClassId);
    if (liveClass?.attendance) {
      const studentId = typeof student === 'object' ? student._id : student;
      liveClass.attendance = liveClass.attendance.filter((a: any) => {
        const id = typeof a.student === 'object' ? a.student?._id : a.student;
        return id !== studentId;
      });
      alert('✅ تم حذف سجل الحضور');
    }
  }

  // ==============================================
  // GET ATTENDANCE REPORT
  // ==============================================
  getClassAttendanceReport(classId: string): void {
    if (!classId) { alert('لا يمكن عرض التقرير بدون معرف الحصة'); return; }
    const schoolId = this.getSchoolId();
    this.reportLoading = true;
    this.showReportModal = true;
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.http.get<any>(
      `${this.apiUrl}/api/live-classes/class/${classId}/attendance?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&schoolId=${schoolId}`
    ).subscribe({
      next: (data) => {
        this.attendanceReport = data;
        this.reportLoading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.reportLoading = false;
        alert('❌ حدث خطأ أثناء تحميل التقرير');
      }
    });
  }

  // ==============================================
  // EXPORT MONTHLY ATTENDANCE
  // ==============================================
  exportMonthlyAttendance(classId: string): void {
    if (!classId) { alert('لا يمكن تصدير التقرير بدون معرف الحصة'); return; }
    const schoolId = this.getSchoolId();
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    window.open(
      `${this.apiUrl}/api/classes/${classId}/monthly-attendance/export?month=${month}&year=${year}&schoolId=${schoolId}`,
      '_blank'
    );
  }

  // ==============================================
  // EXPORT REPORT
  // ==============================================
  exportReport(): void {
    if (!this.attendanceReport?.class?._id) return;
    const schoolId = this.getSchoolId();
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    window.open(
      `${this.apiUrl}/api/classes/${this.attendanceReport.class._id}/monthly-attendance/export?month=${month}&year=${year}&schoolId=${schoolId}`,
      '_blank'
    );
  }

  // ==============================================
  // OPEN/CLOSE MODALS
  // ==============================================
  openAttendanceModal(liveClass: LiveClass): void {
    this.selectedLiveClass = liveClass;
    this.showAttendanceModal = true;
    this.loadLiveClassAttendance(liveClass._id);
  }

  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
    this.selectedLiveClass = null;
    this.quickAttendance = { studentId: '', status: 'present', method: 'manual' };
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.attendanceReport = null;
  }

  // ==============================================
  // TOGGLE / EDIT / CANCEL
  // ==============================================
  toggleClassDetails(liveClass: LiveClass): void {
    liveClass.showDetails = !liveClass.showDetails;
    if (liveClass.showDetails && !liveClass.studentsLoaded) {
      this.loadClassStudents(liveClass);
    }
  }

  editLiveClass(liveClass: LiveClass): void {
    this.editingClassId = liveClass._id;
    liveClass.showDetails = true;
  }

  cancelEdit(): void {
    this.editingClassId = null;
    this.loadLiveClasses();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetNewLiveClass();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadLiveClasses();
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  // ==============================================
  // HELPER FUNCTIONS
  // ==============================================
  getCardClass(status: string): string { return status; }
  
  getStatusText(status: string): string {
    const map: any = { scheduled: 'مجدولة', ongoing: 'جارية', completed: 'مكتملة', cancelled: 'ملغاة' };
    return map[status] || status;
  }
  
  getStatusClass(status: string): string { return status; }
  
  getClassName(liveClass: LiveClass): string {
    return typeof liveClass.class === 'object' && liveClass.class ? liveClass.class.name || 'غير محدد' : 'غير محدد';
  }
  
  getClassSubject(liveClass: LiveClass): string {
    return typeof liveClass.class === 'object' && liveClass.class ? liveClass.class.subject || 'غير محدد' : 'غير محدد';
  }
  
  getTeacherName(liveClass: LiveClass): string {
    return typeof liveClass.teacher === 'object' && liveClass.teacher ? liveClass.teacher.name || 'غير محدد' : 'غير محدد';
  }
  
  getClassroomName(liveClass: LiveClass): string {
    return typeof liveClass.classroom === 'object' && liveClass.classroom ? liveClass.classroom.name || '' : '';
  }
  
  getAttendanceStatus(liveClass: LiveClass, studentId: string): string {
    if (!liveClass.attendance) return 'لم يسجل';
    const att = liveClass.attendance.find((a: any) => {
      const id = typeof a.student === 'object' ? a.student?._id : a.student;
      return id === studentId;
    });
    if (!att) return 'لم يسجل';
    const map: any = { present: 'حاضر', absent: 'غائب', late: 'متأخر' };
    return map[att.status] || att.status;
  }
  
  getAttendanceStatusClass(liveClass: LiveClass, studentId: string): string {
    if (!liveClass.attendance) return '';
    const att = liveClass.attendance.find((a: any) => {
      const id = typeof a.student === 'object' ? a.student?._id : a.student;
      return id === studentId;
    });
    return att?.status || '';
  }
  
  countAttendance(liveClass: LiveClass, status: string): number {
    if (!liveClass.attendance) return 0;
    return liveClass.attendance.filter((a: any) => a.status === status).length;
  }
  
  getTotalStudents(liveClass: LiveClass): number {
    if (typeof liveClass.class === 'object' && liveClass.class && 'students' in liveClass.class) {
      return (liveClass.class as Class).students?.length || 0;
    }
    return 0;
  }
  
  getStudentName(student: any): string {
    if (!student) return 'غير معروف';
    if (typeof student === 'object') return student.name || 'غير معروف';
    const s = this.allStudents.find(st => st._id === student);
    return s?.name || 'غير معروف';
  }
  
  getStudentId(student: any): string {
    if (!student) return '-';
    if (typeof student === 'object') return student.studentId || '-';
    const s = this.allStudents.find(st => st._id === student);
    return s?.studentId || '-';
  }
  
  getAttendanceCount(liveClass: LiveClass | null, status: string): number {
    if (!liveClass?.attendance) return 0;
    if (status === 'total') return liveClass.attendance.length;
    return liveClass.attendance.filter((a: any) => a.status === status).length;
  }
  
  getAttendanceRateClass(rate: number): string {
    if (rate >= 80) return 'good';
    if (rate >= 60) return 'warning';
    return 'poor';
  }
  
  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  formatTime(date: Date | string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }

  // ==============================================
  // VALIDATE FORM
  // ==============================================
  validateLiveClassForm(): boolean {
    if (!this.newLiveClass.classId) { alert('⚠️ يجب اختيار الحصة'); return false; }
    if (!this.newLiveClass.date) { alert('⚠️ يجب تحديد التاريخ'); return false; }
    const selectedDate = new Date(this.newLiveClass.date);
    if (isNaN(selectedDate.getTime())) { alert('⚠️ تاريخ غير صالح'); return false; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) { alert('⚠️ لا يمكن إنشاء حصة في تاريخ سابق'); return false; }
    if (!this.newLiveClass.startTime) { alert('⚠️ يجب تحديد وقت البداية'); return false; }
    if (!this.newLiveClass.teacherId) { alert('⚠️ يجب اختيار الأستاذ'); return false; }
    if (!this.getSchoolId()) { alert('⚠️ لم يتم العثور على معرف المدرسة'); return false; }
    return true;
  }

  resetNewLiveClass(): void {
    this.newLiveClass = { classId: '', date: '', startTime: '08:00', endTime: '', teacherId: '', classroomId: '', status: 'scheduled', notes: '' };
  }
}