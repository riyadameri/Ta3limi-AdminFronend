import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-live-class',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modern Professional Template -->
    <div class="live-class-container" dir="rtl">
      <!-- Modern Header -->
      <div class="modern-header">
        <div class="header-content">
          <div class="title-section">
            <div class="icon-wrapper">
              <i class="fas fa-chalkboard-user"></i>
            </div>
            <div>
              <h1>نظام الحصص الحية</h1>
              <p>إدارة الحصص والحضور بكفاءة عالية</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-glass" (click)="loadLiveClasses()">
              <i class="fas fa-sync-alt"></i>
              <span>تحديث</span>
            </button>
            <button class="btn-primary-modern" (click)="showCreateForm = !showCreateForm">
              <i class="fas fa-plus-circle"></i>
              <span>حصة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters Section -->
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

      <!-- Modern Create Form -->
      <div *ngIf="showCreateForm" class="create-form-modern">
        <div class="form-header">
          <i class="fas fa-plus-circle"></i>
          <h3>إنشاء حصة جديدة</h3>
          <button class="close-btn" (click)="cancelCreate()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form #createForm="ngForm" (ngSubmit)="createLiveClass()">
          <div class="form-grid">
            <div class="form-field">
              <label><i class="fas fa-book"></i> الحصة *</label>
              <select class="modern-select" [(ngModel)]="newLiveClass.class" name="class" required>
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
              <select class="modern-select" [(ngModel)]="newLiveClass.teacher" name="teacher" required>
                <option value="">اختر الأستاذ</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">
                  {{teacher.name}}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label><i class="fas fa-door-open"></i> القاعة</label>
              <select class="modern-select" [(ngModel)]="newLiveClass.classroom" name="classroom">
                <option value="">اختر القاعة</option>
                <option *ngFor="let room of classrooms" [value]="room._id">
                  {{room.name}}
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
            <textarea class="modern-textarea" [(ngModel)]="newLiveClass.notes" name="notes" rows="3" 
                      placeholder="أدخل أي ملاحظات إضافية..."></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-submit" [disabled]="!createForm.valid">
              <i class="fas fa-save"></i> حفظ الحصة
            </button>
            <button type="button" class="btn-cancel" (click)="cancelCreate()">
              <i class="fas fa-times"></i> إلغاء
            </button>
          </div>
        </form>
      </div>

      <!-- Modern Loading State -->
      <div *ngIf="loading" class="loading-modern">
        <div class="spinner-modern">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p>جاري تحميل الحصص الحية...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && liveClasses.length === 0" class="empty-state-modern">
        <div class="empty-icon">
          <i class="fas fa-calendar-times"></i>
        </div>
        <h3>لا توجد حصص حية</h3>
        <p>لم يتم إنشاء أي حصص حية بعد. يمكنك إنشاء حصة جديدة باستخدام الزر أعلاه.</p>
      </div>

      <!-- Modern Cards Grid -->
      <div class="cards-grid">
        <div *ngFor="let liveClass of liveClasses" class="class-card" [ngClass]="getCardClass(liveClass.status)">
          <div class="card-status-badge" [ngClass]="getStatusClass(liveClass.status)">
            {{getStatusText(liveClass.status)}}
          </div>
          <div class="card-header">
            <div class="class-icon">
              <i class="fas fa-video"></i>
            </div>
            <div class="class-info">
              <h3>{{liveClass.class?.name || 'غير محدد'}}</h3>
              <span class="subject-tag">{{liveClass.class?.subject || 'غير محدد'}}</span>
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
            <span class="meta-chip"><i class="fas fa-chalkboard-user"></i> {{liveClass.teacher?.name || 'غير محدد'}}</span>
            <span class="meta-chip"><i class="fas fa-door-open"></i> {{liveClass.classroom?.name || 'غير محدد'}}</span>
          </div>

          <!-- Expanded Details -->
          <div *ngIf="liveClass.showDetails" class="card-details">
            <!-- Edit Form -->
            <div *ngIf="liveClass._id === editingClassId" class="edit-section">
              <div class="edit-header">
                <i class="fas fa-edit"></i>
                <h4>تعديل الحصة</h4>
              </div>
              <form #editForm="ngForm" (ngSubmit)="updateLiveClass(liveClass)">
                <div class="form-grid compact">
                  <div class="form-field">
                    <label>الحالة</label>
                    <select class="modern-select" [(ngModel)]="liveClass.status" name="status">
                      <option value="scheduled">مجدولة</option>
                      <option value="ongoing">جارية</option>
                      <option value="completed">مكتملة</option>
                      <option value="cancelled">ملغاة</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>وقت النهاية</label>
                    <input type="time" class="modern-input" [(ngModel)]="liveClass.endTime" name="endTime">
                  </div>
                </div>
                <div class="form-field">
                  <label>ملاحظات</label>
                  <textarea class="modern-textarea" [(ngModel)]="liveClass.notes" name="notes" rows="2"></textarea>
                </div>
                <div class="edit-actions">
                  <button type="submit" class="btn-submit small">
                    <i class="fas fa-check"></i> حفظ
                  </button>
                  <button type="button" class="btn-cancel small" (click)="cancelEdit()">
                    <i class="fas fa-times"></i> إلغاء
                  </button>
                </div>
              </form>
            </div>

            <!-- Stats Grid -->
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
            </div>

            <!-- Students Table -->
            <div *ngIf="liveClass.studentsLoaded && liveClass.class?.students?.length > 0" class="students-table-modern">
              <div class="table-header">
                <i class="fas fa-user-graduate"></i>
                <h5>قائمة الطلاب</h5>
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
            
            <!-- Load Students Button -->
            <div *ngIf="!liveClass.studentsLoaded && liveClass.class?._id" class="load-students-btn">
              <button class="outline-btn" (click)="loadClassStudents(liveClass)">
                <i class="fas fa-user-friends"></i> تحميل قائمة الطلاب
              </button>
            </div>

            <!-- Notes Section -->
            <div *ngIf="liveClass.notes" class="notes-section">
              <i class="fas fa-sticky-note"></i>
              <p><strong>ملاحظات:</strong> {{liveClass.notes}}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Pagination -->
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

      <!-- Modern Attendance Modal -->
      <div *ngIf="showAttendanceModal && selectedLiveClass" class="modal-overlay-modern" (click)="closeAttendanceModal()">
        <div class="modal-modern" (click)="$event.stopPropagation()">
          <div class="modal-header-modern">
            <div>
              <i class="fas fa-clipboard-check"></i>
              <h3>تسجيل حضور - {{selectedLiveClass.class?.name}}</h3>
            </div>
            <button class="modal-close-modern" (click)="closeAttendanceModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body-modern">
            <div class="quick-attendance">
              <h4><i class="fas fa-bolt"></i> تسجيل حضور سريع</h4>
              <form #attendanceForm="ngForm" (ngSubmit)="submitQuickAttendance()">
                <div class="form-row-modern">
                  <div class="form-field">
                    <label>اختر الطالب</label>
                    <select class="modern-select" [(ngModel)]="quickAttendance.studentId" name="studentId" required>
                      <option value="">-- اختر طالب --</option>
                      <option *ngFor="let student of allStudents" [value]="student._id">
                        {{student.name}} ({{student.studentId}})
                      </option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>الحالة</label>
                    <select class="modern-select" [(ngModel)]="quickAttendance.status" name="status" required>
                      <option value="present">حاضر</option>
                      <option value="absent">غائب</option>
                      <option value="late">متأخر</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="btn-submit full-width" [disabled]="!attendanceForm.valid">
                  <i class="fas fa-check"></i> تسجيل الحضور
                </button>
              </form>
            </div>

            <div *ngIf="selectedLiveClass.attendance?.length > 0" class="current-attendance-modern">
              <h4><i class="fas fa-list"></i> الحضور المسجل</h4>
              <div class="table-responsive">
                <table class="attendance-table-modern">
                  <thead>
                    <tr>
                      <th>اسم الطالب</th>
                      <th>الحالة</th>
                      <th>الوقت</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let record of selectedLiveClass.attendance">
                      <td>{{getStudentName(record.student)}}</td>
                      <td>
                        <span class="status-badge-modern" [ngClass]="record.status">
                          {{getAttendanceStatusText(record.status)}}
                        </span>
                      </td>
                      <td>{{formatTime(record.timestamp)}}</td>
                      <td>
                        <button class="icon-btn small danger" (click)="removeAttendance(selectedLiveClass._id, record.student)">
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer-modern">
            <button class="btn-secondary-modern" (click)="closeAttendanceModal()">إغلاق</button>
          </div>
        </div>
      </div>

      <!-- Modern Report Modal -->
      <div *ngIf="showReportModal && attendanceReport" class="modal-overlay-modern" (click)="closeReportModal()">
        <div class="modal-modern modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header-modern">
            <div>
              <i class="fas fa-chart-bar"></i>
              <h3>تقرير الحضور</h3>
            </div>
            <button class="modal-close-modern" (click)="closeReportModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body-modern">
            <div *ngIf="reportLoading" class="loading-modern">
              <div class="spinner-modern"></div>
              <p>جاري تحميل التقرير...</p>
            </div>
            <div *ngIf="!reportLoading && attendanceReport">
              <div class="report-header-modern">
                <h4>{{attendanceReport.class?.name}}</h4>
                <p>{{attendanceReport.class?.subject}} | {{attendanceReport.period || 'الفترة المحددة'}}</p>
              </div>
              <div class="report-summary-modern">
                <div class="summary-item">
                  <div class="summary-value">{{attendanceReport.summary?.totalClasses || 0}}</div>
                  <div class="summary-label">عدد الحصص</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{attendanceReport.summary?.totalStudents || 0}}</div>
                  <div class="summary-label">عدد الطلاب</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{attendanceReport.summary?.averageAttendance || 0}}%</div>
                  <div class="summary-label">متوسط الحضور</div>
                </div>
              </div>
              <div class="table-responsive">
                <table class="report-table-modern">
                  <thead>
                    <tr>
                      <th>اسم الطالب</th>
                      <th>رقم الطالب</th>
                      <th>الحضور</th>
                      <th>الغياب</th>
                      <th>التأخير</th>
                      <th>النسبة %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let student of attendanceReport.students">
                      <td>{{student.student?.name}}</td>
                      <td>{{student.student?.studentId}}</td>
                      <td>{{student.statistics?.present || 0}}</td>
                      <td>{{student.statistics?.absent || 0}}</td>
                      <td>{{student.statistics?.late || 0}}</td>
                      <td>
                        <div class="progress-modern">
                          <div class="progress-fill" [style.width]="(student.statistics?.attendanceRate || 0) + '%'" 
                               [ngClass]="getAttendanceRateClass(student.statistics?.attendanceRate)">
                            {{student.statistics?.attendanceRate || 0}}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer-modern">
            <button class="btn-success-modern" (click)="exportReport()" *ngIf="attendanceReport?.class?._id">
              <i class="fas fa-file-excel"></i> تصدير إلى Excel
            </button>
            <button class="btn-secondary-modern" (click)="closeReportModal()">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modern CSS Variables */
    :host {
      --primary: #4361ee;
      --primary-dark: #3a56d4;
      --secondary: #3b82f6;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --info: #06b6d4;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .live-class-container {
      background: var(--gray-50);
      min-height: 100vh;
      padding: 24px;
    }

    /* Modern Header */
    .modern-header {
      background: white;
      border-radius: 20px;
      padding: 20px 28px;
      margin-bottom: 28px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-wrapper {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-wrapper i {
      font-size: 28px;
      color: white;
    }

    .title-section h1 {
      font-size: 24px;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0 0 4px 0;
    }

    .title-section p {
      font-size: 14px;
      color: var(--gray-500);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-glass {
      background: var(--gray-100);
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-glass:hover {
      background: var(--gray-200);
      transform: translateY(-1px);
    }

    .btn-primary-modern {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border: none;
      padding: 10px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(67, 97, 238, 0.2);
    }

    .btn-primary-modern:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(67, 97, 238, 0.25);
    }

    /* Filters Section */
    .filters-modern {
      background: white;
      border-radius: 20px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .filters-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--gray-200);
    }

    .filters-header i {
      font-size: 18px;
      color: var(--primary);
    }

    .filters-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-700);
      margin: 0;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .filter-item label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-600);
      margin-bottom: 8px;
    }

    .filter-item label i {
      font-size: 12px;
    }

    .modern-select, .modern-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--gray-300);
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
      background: white;
    }

    .modern-select:focus, .modern-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }

    /* Create Form */
    .create-form-modern {
      background: white;
      border-radius: 20px;
      margin-bottom: 28px;
      overflow: hidden;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .form-header {
      background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
      padding: 18px 24px;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
    }

    .form-header i {
      font-size: 20px;
      color: var(--primary);
    }

    .form-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0;
    }

    .close-btn {
      position: absolute;
      left: 24px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--gray-400);
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: var(--gray-100);
      color: var(--danger);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      padding: 24px;
    }

    .form-grid.compact {
      gap: 16px;
      padding: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
      padding: 0 24px 24px 24px;
    }

    .form-field label {
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-600);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .form-field label i {
      font-size: 12px;
    }

    .modern-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--gray-300);
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      transition: all 0.2s;
    }

    .modern-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 20px 24px;
      background: var(--gray-50);
      border-top: 1px solid var(--gray-200);
    }

    .btn-submit {
      background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-submit.small {
      padding: 6px 16px;
      font-size: 13px;
    }

    .btn-cancel {
      background: var(--gray-100);
      border: 1px solid var(--gray-300);
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: var(--gray-200);
    }

    .btn-cancel.small {
      padding: 6px 16px;
      font-size: 13px;
    }

    /* Loading State */
    .loading-modern {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner-modern {
      position: relative;
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
    }

    .spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    }

    .spinner-ring:nth-child(2) {
      border-top-color: var(--secondary);
      animation-delay: 0.2s;
      width: 80%;
      height: 80%;
      top: 10%;
      left: 10%;
    }

    .spinner-ring:nth-child(3) {
      border-top-color: var(--info);
      animation-delay: 0.4s;
      width: 60%;
      height: 60%;
      top: 20%;
      left: 20%;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-modern p {
      color: var(--gray-500);
      font-size: 14px;
    }

    /* Empty State */
    .empty-state-modern {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 20px;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      background: var(--gray-100);
      border-radius: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .empty-icon i {
      font-size: 40px;
      color: var(--gray-400);
    }

    .empty-state-modern h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--gray-700);
      margin-bottom: 8px;
    }

    .empty-state-modern p {
      color: var(--gray-500);
      font-size: 14px;
    }

    /* Cards Grid */
    .cards-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .class-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s ease;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .class-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -12px rgba(0,0,0,0.1);
    }

    .class-card.scheduled {
      border-right: 4px solid var(--warning);
    }

    .class-card.ongoing {
      border-right: 4px solid var(--info);
    }

    .class-card.completed {
      border-right: 4px solid var(--success);
    }

    .class-card.cancelled {
      border-right: 4px solid var(--danger);
    }

    .card-status-badge {
      position: absolute;
      top: 16px;
      right: 20px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .card-status-badge.scheduled {
      background: #fef3c7;
      color: #d97706;
    }

    .card-status-badge.ongoing {
      background: #dbeafe;
      color: var(--primary);
    }

    .card-status-badge.completed {
      background: #d1fae5;
      color: var(--success);
    }

    .card-status-badge.cancelled {
      background: #fee2e2;
      color: var(--danger);
    }

    .card-header {
      padding: 20px 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .class-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .class-icon i {
      font-size: 24px;
      color: white;
    }

    .class-info {
      flex: 1;
    }

    .class-info h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-800);
      margin-bottom: 6px;
    }

    .subject-tag {
      background: var(--gray-100);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      color: var(--gray-600);
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--gray-100);
      border-radius: 10px;
      cursor: pointer;
      color: var(--gray-600);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-btn:hover {
      background: var(--gray-200);
      transform: scale(1.05);
    }

    .icon-btn.danger:hover {
      background: #fee2e2;
      color: var(--danger);
    }

    .icon-btn.small {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }

    .card-meta {
      padding: 12px 24px 20px 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      border-top: 1px solid var(--gray-200);
    }

    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: var(--gray-100);
      border-radius: 20px;
      font-size: 12px;
      color: var(--gray-600);
    }

    .meta-chip i {
      font-size: 11px;
    }

    /* Card Details */
    .card-details {
      padding: 0 24px 24px 24px;
      border-top: 1px solid var(--gray-200);
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .edit-section {
      background: var(--gray-50);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .edit-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .edit-header i {
      font-size: 18px;
      color: var(--primary);
    }

    .edit-header h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-700);
      margin: 0;
    }

    .edit-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--gray-50);
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      position: relative;
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.present { border-bottom: 3px solid var(--success); }
    .stat-card.absent { border-bottom: 3px solid var(--danger); }
    .stat-card.late { border-bottom: 3px solid var(--warning); }
    .stat-card.total { border-bottom: 3px solid var(--primary); }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--gray-800);
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--gray-500);
    }

    .stat-icon {
      position: absolute;
      bottom: 12px;
      left: 12px;
      font-size: 20px;
      opacity: 0.3;
    }

    .stat-card.present .stat-icon { color: var(--success); }
    .stat-card.absent .stat-icon { color: var(--danger); }
    .stat-card.late .stat-icon { color: var(--warning); }
    .stat-card.total .stat-icon { color: var(--primary); }

    /* Quick Actions */
    .quick-actions-modern {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
    }

    .action-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .action-btn.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .action-btn.warning:hover {
      background: #fde68a;
    }

    .action-btn.info {
      background: #dbeafe;
      color: var(--primary);
    }

    .action-btn.info:hover {
      background: #bfdbfe;
    }

    .action-btn.success {
      background: #d1fae5;
      color: var(--success);
    }

    .action-btn.success:hover {
      background: #a7f3d0;
    }

    /* Students Table */
    .students-table-modern {
      margin-top: 24px;
    }

    .table-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .table-header i {
      font-size: 18px;
      color: var(--primary);
    }

    .table-header h5 {
      font-size: 15px;
      font-weight: 600;
      color: var(--gray-700);
      margin: 0;
    }

    .table-responsive {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th, td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid var(--gray-200);
    }

    th {
      background: var(--gray-50);
      font-weight: 600;
      color: var(--gray-600);
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .student-info i {
      font-size: 14px;
      color: var(--primary);
    }

    .status-badge-modern {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-badge-modern.present {
      background: #d1fae5;
      color: var(--success);
    }

    .status-badge-modern.absent {
      background: #fee2e2;
      color: var(--danger);
    }

    .status-badge-modern.late {
      background: #fef3c7;
      color: var(--warning);
    }

    .action-buttons-modern {
      display: flex;
      gap: 6px;
    }

    .tiny-btn {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .tiny-btn.success {
      background: #d1fae5;
      color: var(--success);
    }

    .tiny-btn.success:hover {
      background: var(--success);
      color: white;
    }

    .tiny-btn.danger {
      background: #fee2e2;
      color: var(--danger);
    }

    .tiny-btn.danger:hover {
      background: var(--danger);
      color: white;
    }

    .tiny-btn.warning {
      background: #fef3c7;
      color: var(--warning);
    }

    .tiny-btn.warning:hover {
      background: var(--warning);
      color: white;
    }

    .load-students-btn {
      text-align: center;
      margin-top: 20px;
    }

    .outline-btn {
      background: transparent;
      border: 2px solid var(--primary);
      padding: 10px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      color: var(--primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .outline-btn:hover {
      background: var(--primary);
      color: white;
    }

    .notes-section {
      background: var(--gray-50);
      border-radius: 12px;
      padding: 12px 16px;
      margin-top: 20px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .notes-section i {
      color: var(--primary);
      font-size: 16px;
      margin-top: 2px;
    }

    .notes-section p {
      margin: 0;
      font-size: 13px;
      color: var(--gray-600);
      line-height: 1.5;
    }

    /* Pagination */
    .pagination-modern {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 32px;
      padding-top: 20px;
    }

    .page-nav {
      background: white;
      border: 1px solid var(--gray-300);
      padding: 8px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .page-nav:hover:not(:disabled) {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .page-nav:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-number {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      font-weight: 500;
    }

    .page-number.active {
      background: var(--primary);
      color: white;
    }

    .page-separator {
      color: var(--gray-400);
    }

    .page-total {
      color: var(--gray-500);
    }

    /* Modal */
    .modal-overlay-modern {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .modal-modern {
      background: white;
      border-radius: 24px;
      max-width: 800px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    .modal-modern.modal-lg {
      max-width: 1000px;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header-modern {
      padding: 20px 24px;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header-modern > div {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-header-modern i {
      font-size: 22px;
      color: var(--primary);
    }

    .modal-header-modern h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0;
    }

    .modal-close-modern {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--gray-100);
      border-radius: 10px;
      cursor: pointer;
      color: var(--gray-400);
      transition: all 0.2s;
    }

    .modal-close-modern:hover {
      background: #fee2e2;
      color: var(--danger);
    }

    .modal-body-modern {
      padding: 24px;
    }

    .modal-footer-modern {
      padding: 16px 24px;
      border-top: 1px solid var(--gray-200);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary-modern {
      background: var(--gray-100);
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary-modern:hover {
      background: var(--gray-200);
    }

    .btn-success-modern {
      background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-success-modern:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
    }

    /* Quick Attendance Form */
    .quick-attendance {
      background: var(--gray-50);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .quick-attendance h4, .current-attendance-modern h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-700);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .quick-attendance h4 i, .current-attendance-modern h4 i {
      color: var(--primary);
    }

    .form-row-modern {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
    }

    /* Attendance Table */
    .attendance-table-modern {
      width: 100%;
      border-collapse: collapse;
    }

    .attendance-table-modern th,
    .attendance-table-modern td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid var(--gray-200);
    }

    .attendance-table-modern th {
      background: var(--gray-50);
      font-weight: 600;
      color: var(--gray-600);
    }

    /* Report */
    .report-header-modern {
      text-align: center;
      margin-bottom: 24px;
    }

    .report-header-modern h4 {
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-800);
      margin-bottom: 4px;
    }

    .report-header-modern p {
      font-size: 13px;
      color: var(--gray-500);
    }

    .report-summary-modern {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-item {
      text-align: center;
      padding: 16px;
      background: var(--gray-50);
      border-radius: 16px;
    }

    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .summary-label {
      font-size: 12px;
      color: var(--gray-500);
    }

    .report-table-modern {
      width: 100%;
      border-collapse: collapse;
    }

    .report-table-modern th,
    .report-table-modern td {
      padding: 12px;
      text-align: right;
      border: 1px solid var(--gray-200);
    }

    .report-table-modern th {
      background: var(--gray-50);
      font-weight: 600;
      color: var(--gray-600);
    }

    .progress-modern {
      background: var(--gray-200);
      border-radius: 20px;
      overflow: hidden;
      height: 28px;
    }

    .progress-fill {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      color: white;
      transition: width 0.3s ease;
    }

    .progress-fill.good {
      background: linear-gradient(90deg, var(--success) 0%, #059669 100%);
    }

    .progress-fill.warning {
      background: linear-gradient(90deg, var(--warning) 0%, #d97706 100%);
    }

    .progress-fill.poor {
      background: linear-gradient(90deg, var(--danger) 0%, #dc2626 100%);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .live-class-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
      }

      .btn-glass, .btn-primary-modern {
        flex: 1;
        justify-content: center;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .quick-actions-modern {
        flex-direction: column;
      }

      .action-btn {
        justify-content: center;
      }

      .report-summary-modern {
        grid-template-columns: 1fr;
      }

      .form-row-modern {
        grid-template-columns: 1fr;
      }

      .modal-modern {
        width: 95%;
        margin: 16px;
      }
    }
  `]
})
export class LiveClassComponent implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl || '/api';
  
  // Data
  liveClasses: any[] = [];
  allClasses: any[] = [];
  teachers: any[] = [];
  students: any[] = [];
  allStudents: any[] = [];
  classrooms: any[] = [];
  
  // Control variables
  loading = false;
  showCreateForm = false;
  showAttendanceModal = false;
  showReportModal = false;
  editingClassId: string | null = null;
  selectedLiveClass: any = null;
  attendanceReport: any = null;
  reportLoading = false;
  
  // Form models
  newLiveClass: any = {
    class: '',
    date: '',
    startTime: '',
    endTime: '',
    teacher: '',
    classroom: '',
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
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;
  
  private refreshInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadInitialData();
    // Auto refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadLiveClasses();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ==================== Load Data ====================
  loadInitialData(): void {
    this.loadLiveClasses();
    this.loadAllClasses();
    this.loadTeachers();
    this.loadAllStudents();
    this.loadClassrooms();
  }

  loadLiveClasses(): void {
    this.loading = true;
    let url = `${this.apiUrl}/live-classes`;
    const params = new URLSearchParams();
    
    if (this.filters.status) params.append('status', this.filters.status);
    if (this.filters.date) params.append('date', this.filters.date);
    if (this.filters.class) params.append('class', this.filters.class);
    if (this.filters.teacher) params.append('teacher', this.filters.teacher);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.liveClasses = data.map(lc => ({
          ...lc,
          showDetails: false,
          studentsLoaded: false
        }));
        this.totalPages = Math.ceil(this.liveClasses.length / this.itemsPerPage);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading live classes:', error);
        this.loading = false;
        this.showError('حدث خطأ في تحميل الحصص الحية');
      }
    });
  }

  loadAllClasses(): void {
    this.http.get<any[]>(`${this.apiUrl}/classes`).subscribe({
      next: (data) => this.allClasses = data,
      error: (err) => console.error('Error loading classes:', err)
    });
  }

  loadTeachers(): void {
    this.http.get<any[]>(`${this.apiUrl}/teachers`).subscribe({
      next: (data) => this.teachers = data,
      error: (err) => console.error('Error loading teachers:', err)
    });
  }

  loadAllStudents(): void {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => this.allStudents = data,
      error: (err) => console.error('Error loading students:', err)
    });
  }

  loadClassrooms(): void {
    this.http.get<any[]>(`${this.apiUrl}/classrooms`).subscribe({
      next: (data) => this.classrooms = data,
      error: (err) => console.error('Error loading classrooms:', err)
    });
  }

  loadClassStudents(liveClass: any): void {
    if (!liveClass.class?._id) return;
    
    this.http.get<any[]>(`${this.apiUrl}/classes/${liveClass.class._id}/students`).subscribe({
      next: (students) => {
        liveClass.class.students = students;
        liveClass.studentsLoaded = true;
      },
      error: (err) => console.error('Error loading class students:', err)
    });
  }

  loadLiveClassAttendance(liveClassId: string): void {
    this.http.get<any>(`${this.apiUrl}/live-classes/${liveClassId}/attendance`).subscribe({
      next: (data) => {
        const liveClass = this.liveClasses.find(lc => lc._id === liveClassId);
        if (liveClass) {
          liveClass.attendance = data.attendance || [];
        }
      },
      error: (err) => console.error('Error loading attendance:', err)
    });
  }

  // ==================== CRUD Operations ====================
  createLiveClass(): void {
    if (!this.validateLiveClassForm()) return;
    
    const liveClassData = {
      ...this.newLiveClass,
      month: new Date(this.newLiveClass.date).toISOString().slice(0, 7)
    };
    
    this.http.post(`${this.apiUrl}/live-classes`, liveClassData).subscribe({
      next: () => {
        this.showSuccess('تم إنشاء الحصة الحية بنجاح');
        this.loadLiveClasses();
        this.resetNewLiveClass();
        this.showCreateForm = false;
      },
      error: (err) => {
        console.error('Error creating live class:', err);
        this.showError('حدث خطأ أثناء إنشاء الحصة');
      }
    });
  }

  updateLiveClass(liveClass: any): void {
    const updateData = {
      status: liveClass.status,
      endTime: liveClass.endTime,
      notes: liveClass.notes
    };
    
    this.http.put(`${this.apiUrl}/live-classes/${liveClass._id}`, updateData).subscribe({
      next: () => {
        this.showSuccess('تم تحديث الحصة بنجاح');
        this.editingClassId = null;
        this.loadLiveClasses();
      },
      error: (err) => {
        console.error('Error updating live class:', err);
        this.showError('حدث خطأ أثناء تحديث الحصة');
      }
    });
  }

  confirmDeleteLiveClass(liveClassId: string): void {
    if (confirm('⚠️ هل أنت متأكد من حذف هذه الحصة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      this.deleteLiveClass(liveClassId);
    }
  }

  deleteLiveClass(liveClassId: string): void {
    this.http.delete(`${this.apiUrl}/live-classes/${liveClassId}`).subscribe({
      next: () => {
        this.showSuccess('تم حذف الحصة بنجاح');
        this.loadLiveClasses();
      },
      error: (err) => {
        console.error('Error deleting live class:', err);
        this.showError('حدث خطأ أثناء حذف الحصة');
      }
    });
  }

  // ==================== Attendance Operations ====================
  markStudentAttendance(liveClassId: string, studentId: string, status: string): void {
    const data = { studentId, status, method: 'manual' };
    
    this.http.post(`${this.apiUrl}/live-classes/${liveClassId}/attendance`, data).subscribe({
      next: (response: any) => {
        const liveClass = this.liveClasses.find(lc => lc._id === liveClassId);
        if (liveClass) {
          const existingIndex = liveClass.attendance?.findIndex(
            (a: any) => a.student?._id === studentId || a.student === studentId
          );
          
          const attendanceRecord = {
            student: studentId,
            status,
            timestamp: new Date()
          };
          
          if (existingIndex >= 0 && liveClass.attendance) {
            liveClass.attendance[existingIndex] = attendanceRecord;
          } else {
            if (!liveClass.attendance) liveClass.attendance = [];
            liveClass.attendance.push(attendanceRecord);
          }
        }
        this.showSuccess('تم تسجيل الحضور بنجاح');
      },
      error: (err) => {
        console.error('Error marking attendance:', err);
        this.showError('حدث خطأ أثناء تسجيل الحضور');
      }
    });
  }

  submitQuickAttendance(): void {
    if (!this.selectedLiveClass || !this.quickAttendance.studentId) return;
    
    this.markStudentAttendance(
      this.selectedLiveClass._id,
      this.quickAttendance.studentId,
      this.quickAttendance.status
    );
    
    this.quickAttendance = { studentId: '', status: 'present', method: 'manual' };
  }

  removeAttendance(liveClassId: string, studentId: any): void {
    const liveClass = this.liveClasses.find(lc => lc._id === liveClassId);
    if (liveClass && liveClass.attendance) {
      liveClass.attendance = liveClass.attendance.filter(
        (a: any) => a.student?._id !== studentId && a.student !== studentId
      );
    }
  }

  autoMarkAbsent(liveClassId: string): void {
    if (confirm('⚠️ سيتم تسجيل جميع الطلاب غير المسجل حضورهم كغائبين وإرسال رسائل لأولياء أمورهم. هل تريد المتابعة؟')) {
      const data = { autoSendSMS: true, customMessage: '' };
      
      this.http.post(`${this.apiUrl}/live-classes/${liveClassId}/auto-mark-absent`, data).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess(`✅ ${response.message}\n\nتم تسجيل ${response.data?.absentCount || 0} طالب كغائبين`);
            this.loadLiveClasses();
          } else {
            this.showError(response.error);
          }
        },
        error: (err) => {
          console.error('Error auto marking absent:', err);
          this.showError('حدث خطأ أثناء تسجيل الغائبين');
        }
      });
    }
  }

  // ==================== Reports ====================
  getClassAttendanceReport(classId: string): void {
    if (!classId) {
      this.showError('لا يمكن عرض التقرير بدون معرف الحصة');
      return;
    }
    
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.reportLoading = true;
    this.showReportModal = true;
    
    const params = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    
    this.http.get<any>(`${this.apiUrl}/live-classes/class/${classId}/attendance?${params}`).subscribe({
      next: (data) => {
        this.attendanceReport = data;
        this.reportLoading = false;
      },
      error: (err) => {
        console.error('Error loading report:', err);
        this.reportLoading = false;
        this.showError('حدث خطأ أثناء تحميل التقرير');
      }
    });
  }

  exportMonthlyAttendance(classId: string): void {
    if (!classId) {
      this.showError('لا يمكن تصدير التقرير بدون معرف الحصة');
      return;
    }
    
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    
    const url = `${this.apiUrl}/classes/${classId}/monthly-attendance/export?month=${month}&year=${year}`;
    window.open(url, '_blank');
  }

  exportReport(): void {
    if (!this.attendanceReport?.class?._id) return;
    
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    
    const url = `${this.apiUrl}/classes/${this.attendanceReport.class._id}/monthly-attendance/export?month=${month}&year=${year}`;
    window.open(url, '_blank');
  }

  // ==================== Modal Controls ====================
  openAttendanceModal(liveClass: any): void {
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

  // ==================== UI Helpers ====================
  toggleClassDetails(liveClass: any): void {
    liveClass.showDetails = !liveClass.showDetails;
    
    if (liveClass.showDetails && !liveClass.studentsLoaded) {
      this.loadClassStudents(liveClass);
    }
  }

  editLiveClass(liveClass: any): void {
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

  // ==================== Pagination ====================
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // ==================== Utilities ====================
  getCardClass(status: string): string {
    return status;
  }

  getStatusText(status: string): string {
    const statusMap: {[key: string]: string} = {
      'scheduled': 'مجدولة',
      'ongoing': 'جارية',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return status;
  }

  getAttendanceStatus(liveClass: any, studentId: string): string {
    if (!liveClass.attendance) return 'لم يسجل';
    
    const attendance = liveClass.attendance.find((a: any) => 
      a.student?._id === studentId || a.student === studentId
    );
    
    if (!attendance) return 'لم يسجل';
    
    const statusMap: {[key: string]: string} = {
      'present': 'حاضر',
      'absent': 'غائب',
      'late': 'متأخر'
    };
    return statusMap[attendance.status] || attendance.status;
  }

  getAttendanceStatusClass(liveClass: any, studentId: string): string {
    if (!liveClass.attendance) return '';
    
    const attendance = liveClass.attendance.find((a: any) => 
      a.student?._id === studentId || a.student === studentId
    );
    
    if (!attendance) return '';
    return attendance.status;
  }

  getAttendanceStatusText(status: string): string {
    const statusMap: {[key: string]: string} = {
      'present': 'حاضر',
      'absent': 'غائب',
      'late': 'متأخر'
    };
    return statusMap[status] || status;
  }

  countAttendance(liveClass: any, status: string): number {
    if (!liveClass.attendance) return 0;
    return liveClass.attendance.filter((a: any) => a.status === status).length;
  }

  getTotalStudents(liveClass: any): number {
    return liveClass.class?.students?.length || 0;
  }

  getStudentName(studentId: any): string {
    if (!studentId) return 'غير معروف';
    
    if (typeof studentId === 'object') {
      return studentId.name || 'غير معروف';
    }
    
    const student = this.allStudents.find(s => s._id === studentId);
    return student?.name || 'غير معروف';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  getAttendanceRateClass(rate: number): string {
    if (rate >= 80) return 'good';
    if (rate >= 60) return 'warning';
    return 'poor';
  }

  validateLiveClassForm(): boolean {
    if (!this.newLiveClass.class) {
      this.showError('⚠️ يجب اختيار الحصة');
      return false;
    }
    
    if (!this.newLiveClass.date) {
      this.showError('⚠️ يجب تحديد التاريخ');
      return false;
    }
    
    if (!this.newLiveClass.startTime) {
      this.showError('⚠️ يجب تحديد وقت البداية');
      return false;
    }
    
    if (!this.newLiveClass.teacher) {
      this.showError('⚠️ يجب اختيار الأستاذ');
      return false;
    }
    
    return true;
  }

  resetNewLiveClass(): void {
    this.newLiveClass = {
      class: '',
      date: '',
      startTime: '',
      endTime: '',
      teacher: '',
      classroom: '',
      status: 'scheduled',
      notes: ''
    };
  }

  // ==================== Notifications ====================
  private showSuccess(message: string): void {
    // You can implement a toast notification service here
    console.log('✅ Success:', message);
    alert(message);
  }

  private showError(message: string): void {
    // You can implement a toast notification service here
    console.error('❌ Error:', message);
    alert(message);
  }
}