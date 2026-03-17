import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-live-class',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- HTML Template Here -->
    <div class="live-class-container" dir="rtl">
      <!-- Header -->
      <div class="header">
        <h2><i class="fas fa-video"></i> نظام الحصص الحية</h2>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="showCreateForm = !showCreateForm">
            <i class="fas fa-plus"></i> إنشاء حصة جديدة
          </button>
          <button class="btn btn-secondary" (click)="loadLiveClasses()">
            <i class="fas fa-sync-alt"></i> تحديث
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section card">
        <div class="card-header">
          <h5><i class="fas fa-filter"></i> تصفية الحصص</h5>
        </div>
        <div class="card-body">
          <div class="filter-row">
            <div class="filter-group">
              <label for="statusFilter">الحالة:</label>
              <select id="statusFilter" class="form-control" [(ngModel)]="filters.status" (change)="applyFilters()">
                <option value="">جميع الحالات</option>
                <option value="scheduled">مجدولة</option>
                <option value="ongoing">جارية</option>
                <option value="completed">مكتملة</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="dateFilter">التاريخ:</label>
              <input type="date" id="dateFilter" class="form-control" [(ngModel)]="filters.date" (change)="applyFilters()">
            </div>
            
            <div class="filter-group">
              <label for="classFilter">الحصة:</label>
              <select id="classFilter" class="form-control" [(ngModel)]="filters.class" (change)="applyFilters()">
                <option value="">جميع الحصص</option>
                <option *ngFor="let cls of allClasses" [value]="cls._id">
                  {{cls.name}} - {{cls.subject}}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="teacherFilter">الأستاذ:</label>
              <select id="teacherFilter" class="form-control" [(ngModel)]="filters.teacher" (change)="applyFilters()">
                <option value="">جميع الأساتذة</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">
                  {{teacher.name}}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Live Class Form -->
      <div *ngIf="showCreateForm" class="create-form-section card">
        <div class="card-header">
          <h5><i class="fas fa-plus-circle"></i> إنشاء حصة جديدة</h5>
        </div>
        <div class="card-body">
          <form #createForm="ngForm" (ngSubmit)="createLiveClass()">
            <div class="form-row">
              <div class="form-group">
                <label for="createClass">الحصة <span class="required">*</span></label>
                <select id="createClass" class="form-control" [(ngModel)]="newLiveClass.class" name="class" required>
                  <option value="">اختر الحصة</option>
                  <option *ngFor="let cls of allClasses" [value]="cls._id">
                    {{cls.name}} - {{cls.subject}} ({{cls.academicYear}})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="createDate">التاريخ <span class="required">*</span></label>
                <input type="date" id="createDate" class="form-control" [(ngModel)]="newLiveClass.date" name="date" required>
              </div>
              
              <div class="form-group">
                <label for="createStartTime">وقت البداية <span class="required">*</span></label>
                <input type="time" id="createStartTime" class="form-control" [(ngModel)]="newLiveClass.startTime" name="startTime" required>
              </div>
              
              <div class="form-group">
                <label for="createEndTime">وقت النهاية</label>
                <input type="time" id="createEndTime" class="form-control" [(ngModel)]="newLiveClass.endTime" name="endTime">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="createTeacher">الأستاذ <span class="required">*</span></label>
                <select id="createTeacher" class="form-control" [(ngModel)]="newLiveClass.teacher" name="teacher" required>
                  <option value="">اختر الأستاذ</option>
                  <option *ngFor="let teacher of teachers" [value]="teacher._id">
                    {{teacher.name}} - {{teacher.subjects?.join('، ')}}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="createClassroom">القاعة</label>
                <select id="createClassroom" class="form-control" [(ngModel)]="newLiveClass.classroom" name="classroom">
                  <option value="">اختر القاعة</option>
                  <option *ngFor="let room of classrooms" [value]="room._id">
                    {{room.name}} (سعة: {{room.capacity}})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="createStatus">الحالة</label>
                <select id="createStatus" class="form-control" [(ngModel)]="newLiveClass.status" name="status">
                  <option value="scheduled">مجدولة</option>
                  <option value="ongoing">جارية</option>
                  <option value="completed">مكتملة</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="createNotes">ملاحظات</label>
              <textarea id="createNotes" class="form-control" [(ngModel)]="newLiveClass.notes" name="notes" rows="3" placeholder="أدخل أي ملاحظات إضافية..."></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-success" [disabled]="!createForm.valid">
                <i class="fas fa-save"></i> حفظ الحصة
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancelCreate()">
                <i class="fas fa-times"></i> إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Live Classes List -->
      <div class="live-classes-list">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner">
            <div class="spinner-circle"></div>
          </div>
          <p>جاري تحميل الحصص الحية...</p>
        </div>

        <div *ngIf="!loading && liveClasses.length === 0" class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <h4>لا توجد حصص حية</h4>
          <p>لم يتم إنشاء أي حصص حية بعد. يمكنك إنشاء حصة جديدة باستخدام الزر أعلاه.</p>
        </div>

        <div *ngFor="let liveClass of liveClasses" class="live-class-card card">
          <div class="card-header" [ngClass]="getStatusClass(liveClass.status)">
            <div class="header-content">
              <div class="class-info">
                <h3 class="class-title">
                  <i class="fas fa-video"></i>
                  {{liveClass.class?.name || 'غير محدد'}}
                </h3>
                <div class="class-subtitle">
                  <span class="subject-badge">{{liveClass.class?.subject || 'غير محدد'}}</span>
                  <span class="status-badge">{{getStatusText(liveClass.status)}}</span>
                </div>
              </div>
              
              <div class="class-actions">
                <button class="btn-action" (click)="toggleClassDetails(liveClass)">
                  <i class="fas" [ngClass]="liveClass.showDetails ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>
                <button class="btn-action" (click)="openAttendanceModal(liveClass)">
                  <i class="fas fa-clipboard-check"></i>
                </button>
                <button class="btn-action" (click)="editLiveClass(liveClass)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-danger" (click)="confirmDeleteLiveClass(liveClass._id)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="class-meta">
              <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>{{formatDate(liveClass.date)}}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-clock"></i>
                <span>{{liveClass.startTime}} {{liveClass.endTime ? '- ' + liveClass.endTime : ''}}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-chalkboard-teacher"></i>
                <span>{{liveClass.teacher?.name || 'غير محدد'}}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-door-open"></i>
                <span>{{liveClass.classroom?.name || 'غير محدد'}}</span>
              </div>
            </div>
          </div>

          <!-- Class Details -->
          <div class="card-body" *ngIf="liveClass.showDetails || liveClass._id === editingClassId">
            <!-- Edit Form -->
            <div *ngIf="liveClass._id === editingClassId" class="edit-section">
              <h5><i class="fas fa-edit"></i> تعديل الحصة</h5>
              <form #editForm="ngForm" (ngSubmit)="updateLiveClass(liveClass)">
                <div class="form-row">
                  <div class="form-group">
                    <label for="editStatus">الحالة</label>
                    <select id="editStatus" class="form-control" [(ngModel)]="liveClass.status" name="status">
                      <option value="scheduled">مجدولة</option>
                      <option value="ongoing">جارية</option>
                      <option value="completed">مكتملة</option>
                      <option value="cancelled">ملغاة</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="editEndTime">وقت النهاية</label>
                    <input type="time" id="editEndTime" class="form-control" [(ngModel)]="liveClass.endTime" name="endTime">
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="editNotes">ملاحظات</label>
                  <textarea id="editNotes" class="form-control" [(ngModel)]="liveClass.notes" name="notes" rows="2"></textarea>
                </div>
                
                <div class="edit-actions">
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-check"></i> حفظ التغييرات
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="cancelEdit()">
                    <i class="fas fa-times"></i> إلغاء
                  </button>
                </div>
              </form>
            </div>

            <!-- Class Details -->
            <div *ngIf="!liveClass._id === editingClassId" class="details-section">
              <div class="details-row">
                <div class="detail-item">
                  <strong><i class="fas fa-info-circle"></i> معلومات إضافية:</strong>
                  <p>{{liveClass.notes || 'لا توجد ملاحظات'}}</p>
                </div>
                
                <div class="detail-item">
                  <strong><i class="fas fa-users"></i> إحصائيات الحضور:</strong>
                  <div class="attendance-stats">
                    <div class="stat-box present">
                      <div class="stat-count">{{countAttendance(liveClass, 'present')}}</div>
                      <div class="stat-label">حاضر</div>
                    </div>
                    <div class="stat-box absent">
                      <div class="stat-count">{{countAttendance(liveClass, 'absent')}}</div>
                      <div class="stat-label">غائب</div>
                    </div>
                    <div class="stat-box late">
                      <div class="stat-count">{{countAttendance(liveClass, 'late')}}</div>
                      <div class="stat-label">متأخر</div>
                    </div>
                    <div class="stat-box total">
                      <div class="stat-count">{{getTotalStudents(liveClass)}}</div>
                      <div class="stat-label">إجمالي</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="quick-actions">
                <button class="btn btn-warning" (click)="autoMarkAbsent(liveClass._id)">
                  <i class="fas fa-robot"></i> تسجيل الغائبين تلقائياً
                </button>
                <button class="btn btn-info" (click)="getClassAttendanceReport(liveClass.class?._id)">
                  <i class="fas fa-chart-bar"></i> تقرير الحضور
                </button>
                <button class="btn btn-success" (click)="exportMonthlyAttendance(liveClass.class?._id)">
                  <i class="fas fa-file-excel"></i> تصدير Excel
                </button>
              </div>

              <!-- Students List (if loaded) -->
              <div *ngIf="liveClass.studentsLoaded && liveClass.class?.students?.length > 0" class="students-section">
                <h6><i class="fas fa-user-graduate"></i> قائمة الطلاب</h6>
                <div class="table-container">
                  <table class="students-table">
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
                        <td>{{student.name}}</td>
                        <td>{{student.studentId}}</td>
                        <td>
                          <span class="status-badge" [ngClass]="getAttendanceStatusClass(liveClass, student._id)">
                            {{getAttendanceStatus(liveClass, student._id)}}
                          </span>
                        </td>
                        <td>
                          <div class="action-buttons">
                            <button class="btn-sm btn-success" (click)="markStudentAttendance(liveClass._id, student._id, 'present')">
                              حاضر
                            </button>
                            <button class="btn-sm btn-danger" (click)="markStudentAttendance(liveClass._id, student._id, 'absent')">
                              غائب
                            </button>
                            <button class="btn-sm btn-warning" (click)="markStudentAttendance(liveClass._id, student._id, 'late')">
                              متأخر
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
                <button class="btn btn-outline-primary" (click)="loadClassStudents(liveClass)">
                  <i class="fas fa-user-friends"></i> تحميل قائمة الطلاب
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Modal -->
      <div *ngIf="showAttendanceModal && selectedLiveClass" class="modal-overlay" (click)="closeAttendanceModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fas fa-clipboard-check"></i>
              تسجيل حضور - {{selectedLiveClass.class?.name}}
            </h3>
            <button class="modal-close" (click)="closeAttendanceModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- Quick Attendance Form -->
            <div class="quick-attendance-form">
              <h5>تسجيل حضور سريع</h5>
              <form #attendanceForm="ngForm" (ngSubmit)="submitQuickAttendance()">
                <div class="form-row">
                  <div class="form-group">
                    <label for="studentSelect">اختر الطالب:</label>
                    <select id="studentSelect" class="form-control" [(ngModel)]="quickAttendance.studentId" name="studentId" required>
                      <option value="">-- اختر طالب --</option>
                      <option *ngFor="let student of allStudents" [value]="student._id">
                        {{student.name}} ({{student.studentId}})
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="statusSelect">الحالة:</label>
                    <select id="statusSelect" class="form-control" [(ngModel)]="quickAttendance.status" name="status" required>
                      <option value="present">حاضر</option>
                      <option value="absent">غائب</option>
                      <option value="late">متأخر</option>
                    </select>
                  </div>
                </div>
                
                <button type="submit" class="btn btn-primary" [disabled]="!attendanceForm.valid">
                  <i class="fas fa-check"></i> تسجيل الحضور
                </button>
              </form>
            </div>

            <!-- Current Attendance -->
            <div *ngIf="selectedLiveClass.attendance?.length > 0" class="current-attendance">
              <h5>الحضور المسجل</h5>
              <div class="table-container">
                <table class="attendance-table">
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
                        <span class="status-badge" [ngClass]="record.status">
                          {{getAttendanceStatusText(record.status)}}
                        </span>
                      </td>
                      <td>{{formatTime(record.timestamp)}}</td>
                      <td>
                        <button class="btn-sm btn-danger" (click)="removeAttendance(selectedLiveClass._id, record.student)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAttendanceModal()">
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <!-- Report Modal -->
      <div *ngIf="showReportModal && attendanceReport" class="modal-overlay" (click)="closeReportModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fas fa-chart-bar"></i>
              تقرير الحضور
            </h3>
            <button class="modal-close" (click)="closeReportModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div *ngIf="reportLoading" class="loading-state">
              <div class="spinner">
                <div class="spinner-circle"></div>
              </div>
              <p>جاري تحميل التقرير...</p>
            </div>
            
            <div *ngIf="!reportLoading && attendanceReport">
              <div class="report-header">
                <h4>{{attendanceReport.class?.name}}</h4>
                <p>{{attendanceReport.class?.subject}} | {{attendanceReport.period || 'الفترة المحددة'}}</p>
              </div>
              
              <div class="report-summary">
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
              
              <div class="table-container">
                <table class="report-table">
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
                        <div class="progress-bar-container">
                          <div class="progress-bar" 
                               [style.width]="(student.statistics?.attendanceRate || 0) + '%'"
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
          
          <div class="modal-footer">
            <button class="btn btn-success" (click)="exportReport()" *ngIf="attendanceReport?.class?._id">
              <i class="fas fa-file-excel"></i> تصدير إلى Excel
            </button>
            <button class="btn btn-secondary" (click)="closeReportModal()">
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="liveClasses.length > 0" class="pagination">
        <button class="page-btn" [disabled]="currentPage === 1" (click)="previousPage()">
          <i class="fas fa-chevron-right"></i> السابق
        </button>
        <span class="page-info">الصفحة {{currentPage}} من {{totalPages}}</span>
        <button class="page-btn" [disabled]="currentPage === totalPages" (click)="nextPage()">
          التالي <i class="fas fa-chevron-left"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* CSS Styles Here */
    .live-class-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e9ecef;
    }

    .header h2 {
      color: #2c3e50;
      margin: 0;
      font-size: 28px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .filters-section {
      margin-bottom: 24px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #495057;
    }

    .create-form-section {
      margin-bottom: 24px;
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

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #495057;
    }

    .form-group label .required {
      color: #dc3545;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.15s ease-in-out;
    }

    .form-control:focus {
      border-color: #3498db;
      outline: 0;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #dee2e6;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background-color: #2980b9;
    }

    .btn-secondary {
      background-color: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #7f8c8d;
    }

    .btn-success {
      background-color: #27ae60;
      color: white;
    }

    .btn-success:hover {
      background-color: #219653;
    }

    .btn-danger {
      background-color: #e74c3c;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c0392b;
    }

    .btn-warning {
      background-color: #f39c12;
      color: white;
    }

    .btn-warning:hover {
      background-color: #d68910;
    }

    .btn-info {
      background-color: #17a2b8;
      color: white;
    }

    .btn-info:hover {
      background-color: #138496;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-outline-primary {
      background-color: transparent;
      border: 2px solid #3498db;
      color: #3498db;
    }

    .btn-outline-primary:hover {
      background-color: #3498db;
      color: white;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
      color: #6c757d;
    }

    .spinner {
      display: inline-block;
      width: 50px;
      height: 50px;
      margin-bottom: 16px;
    }

    .spinner-circle {
      width: 100%;
      height: 100%;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px dashed #dee2e6;
    }

    .empty-state i {
      font-size: 48px;
      color: #95a5a6;
      margin-bottom: 16px;
    }

    .empty-state h4 {
      color: #495057;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #6c757d;
    }

    .live-class-card {
      margin-bottom: 20px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .live-class-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .card-header.scheduled {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    }

    .card-header.ongoing {
      background: linear-gradient(135deg, #d1ecf1 0%, #a2d9ce 100%);
    }

    .card-header.completed {
      background: linear-gradient(135deg, #d4edda 0%, #a8e6cf 100%);
    }

    .card-header.cancelled {
      background: linear-gradient(135deg, #f8d7da 0%, #f5b7b1 100%);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .class-title {
      margin: 0;
      color: #2c3e50;
      font-size: 20px;
    }

    .class-subtitle {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .subject-badge {
      background-color: #3498db;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge.scheduled { background-color: #ffc107; color: #212529; }
    .status-badge.ongoing { background-color: #17a2b8; color: white; }
    .status-badge.completed { background-color: #28a745; color: white; }
    .status-badge.cancelled { background-color: #dc3545; color: white; }

    .class-actions {
      display: flex;
      gap: 8px;
    }

    .btn-action {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background-color: rgba(255, 255, 255, 0.9);
      color: #495057;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-action:hover {
      background-color: white;
      transform: scale(1.1);
    }

    .btn-action.btn-danger {
      color: #dc3545;
    }

    .btn-action.btn-danger:hover {
      background-color: #dc3545;
      color: white;
    }

    .class-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 14px;
      color: #495057;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meta-item i {
      color: #6c757d;
    }

    .details-section {
      padding: 20px;
    }

    .details-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .detail-item {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .detail-item strong {
      display: block;
      margin-bottom: 12px;
      color: #495057;
    }

    .attendance-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .stat-box {
      text-align: center;
      padding: 12px;
      border-radius: 6px;
      color: white;
    }

    .stat-box.present { background-color: #28a745; }
    .stat-box.absent { background-color: #dc3545; }
    .stat-box.late { background-color: #ffc107; color: #212529; }
    .stat-box.total { background-color: #17a2b8; }

    .stat-count {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .students-section {
      margin-top: 24px;
    }

    .table-container {
      overflow-x: auto;
      margin-top: 12px;
    }

    .students-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    .students-table th,
    .students-table td {
      padding: 12px;
      text-align: right;
      border: 1px solid #dee2e6;
    }

    .students-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #495057;
      position: sticky;
      top: 0;
    }

    .students-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .load-students-btn {
      text-align: center;
      margin-top: 20px;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
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

    .modal-content.modal-lg {
      max-width: 1000px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
    }

    .modal-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #6c757d;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .modal-close:hover {
      background-color: #f8f9fa;
      color: #dc3545;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #dee2e6;
      text-align: left;
    }

    .quick-attendance-form {
      margin-bottom: 24px;
    }

    .quick-attendance-form h5 {
      margin-bottom: 16px;
      color: #495057;
    }

    .attendance-table {
      width: 100%;
      border-collapse: collapse;
    }

    .attendance-table th,
    .attendance-table td {
      padding: 10px;
      text-align: right;
      border-bottom: 1px solid #dee2e6;
    }

    .attendance-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #495057;
    }

    .report-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .report-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-item {
      text-align: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .summary-value {
      font-size: 28px;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 4px;
    }

    .summary-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
    }

    .report-table th,
    .report-table td {
      padding: 12px;
      text-align: right;
      border: 1px solid #dee2e6;
    }

    .report-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #495057;
      position: sticky;
      top: 0;
    }

    .progress-bar-container {
      height: 24px;
      background-color: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      text-align: center;
      color: white;
      font-size: 12px;
      line-height: 24px;
      transition: width 0.3s ease;
    }

    .progress-bar.good {
      background-color: #28a745;
    }

    .progress-bar.warning {
      background-color: #ffc107;
    }

    .progress-bar.poor {
      background-color: #dc3545;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
    }

    .page-btn {
      padding: 10px 20px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .page-btn:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

    .page-info {
      color: #6c757d;
      font-weight: 600;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
      }

      .filter-row {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .details-row {
        grid-template-columns: 1fr;
      }

      .attendance-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .quick-actions {
        flex-direction: column;
      }

      .report-summary {
        grid-template-columns: 1fr;
      }

      .modal-content {
        width: 95%;
        margin: 10px;
      }
    }
  `]
})
export class LiveClassComponent implements OnInit {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  
  // البيانات
  liveClasses: any[] = [];
  allClasses: any[] = [];
  teachers: any[] = [];
  students: any[] = [];
  allStudents: any[] = [];
  classrooms: any[] = [];
  
  // متغيرات التحكم
  loading = false;
  showCreateForm = false;
  showAttendanceModal = false;
  showReportModal = false;
  showBulkMessagesModal = false;
  
  // النماذج
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
  
  // التحديدات
  selectedLiveClass: any = null;
  editingClassId: string | null = null;
  
  // التقارير
  attendanceReport: any = null;
  reportLoading = false;
  
  // التواريخ
  attendanceStartDate = '';
  attendanceEndDate = '';
  monthlyAttendanceMonth = '';
  
  // الترقيم
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ==================== تحميل البيانات ====================
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
        console.error('❌ خطأ في تحميل الحصص الحية:', error);
        this.loading = false;
        alert('حدث خطأ في تحميل الحصص الحية');
      }
    });
  }

  loadAllClasses(): void {
    this.http.get<any[]>(`${this.apiUrl}/classes`).subscribe({
      next: (data) => {
        this.allClasses = data;
      },
      error: (error) => {
        console.error('❌ خطأ في تحميل الحصص:', error);
      }
    });
  }

  loadTeachers(): void {
    this.http.get<any[]>(`${this.apiUrl}/teachers`).subscribe({
      next: (data) => {
        this.teachers = data;
      },
      error: (error) => {
        console.error('❌ خطأ في تحميل الأساتذة:', error);
      }
    });
  }

  loadAllStudents(): void {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => {
        this.allStudents = data;
      },
      error: (error) => {
        console.error('❌ خطأ في تحميل الطلاب:', error);
      }
    });
  }

  loadClassrooms(): void {
    this.http.get<any[]>(`${this.apiUrl}/classrooms`).subscribe({
      next: (data) => {
        this.classrooms = data;
      },
      error: (error) => {
        console.error('❌ خطأ في تحميل القاعات:', error);
      }
    });
  }

  loadClassStudents(liveClass: any): void {
    if (!liveClass.class?._id) return;
    
    this.http.get<any[]>(`${this.apiUrl}/classes/${liveClass.class._id}/students`).subscribe({
      next: (students) => {
        liveClass.class.students = students;
        liveClass.studentsLoaded = true;
      },
      error: (error) => {
        console.error('❌ خطأ في تحميل طلاب الحصة:', error);
      }
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
      error: (error) => {
        console.error('❌ خطأ في تحميل الحضور:', error);
      }
    });
  }

  // ==================== CRUD Operations ====================
  createLiveClass(): void {
    if (!this.validateLiveClassForm()) {
      return;
    }
    
    const liveClassData = {
      ...this.newLiveClass,
      month: new Date(this.newLiveClass.date).toISOString().slice(0, 7)
    };
    
    this.http.post(`${this.apiUrl}/live-classes`, liveClassData).subscribe({
      next: (response: any) => {
        alert('✅ تم إنشاء الحصة الحية بنجاح');
        this.loadLiveClasses();
        this.resetNewLiveClass();
        this.showCreateForm = false;
      },
      error: (error) => {
        console.error('❌ خطأ في إنشاء الحصة:', error);
        alert('❌ حدث خطأ أثناء إنشاء الحصة');
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
        alert('✅ تم تحديث الحصة بنجاح');
        this.editingClassId = null;
        this.loadLiveClasses();
      },
      error: (error) => {
        console.error('❌ خطأ في تحديث الحصة:', error);
        alert('❌ حدث خطأ أثناء تحديث الحصة');
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
        alert('✅ تم حذف الحصة بنجاح');
        this.loadLiveClasses();
      },
      error: (error) => {
        console.error('❌ خطأ في حذف الحصة:', error);
        alert('❌ حدث خطأ أثناء حذف الحصة');
      }
    });
  }

  // ==================== Attendance Operations ====================
  markStudentAttendance(liveClassId: string, studentId: string, status: string): void {
    const data = {
      studentId,
      status,
      method: 'manual'
    };
    
    this.http.post(`${this.apiUrl}/live-classes/${liveClassId}/attendance`, data).subscribe({
      next: (response: any) => {
        // تحديث الحضور محلياً
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
      },
      error: (error) => {
        console.error('❌ خطأ في تسجيل الحضور:', error);
        alert('❌ حدث خطأ أثناء تسجيل الحضور');
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
    
    this.quickAttendance = {
      studentId: '',
      status: 'present',
      method: 'manual'
    };
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
    if (confirm('⚠️ سيتم تسجيل جميع الطلاب غير المسجل حضورهم كغائبين وإرسال رسائل SMS لأولياء أمورهم. هل تريد المتابعة؟')) {
      const data = {
        autoSendSMS: true,
        customMessage: ''
      };
      
      this.http.post(`${this.apiUrl}/live-classes/${liveClassId}/auto-mark-absent`, data).subscribe({
        next: (response: any) => {
          if (response.success) {
            alert(`✅ ${response.message}\n\nتم تسجيل ${response.data?.absentCount || 0} طالب كغائبين\nوإرسال ${response.data?.messagesSent || 0} رسالة`);
            this.loadLiveClasses();
          } else {
            alert(`❌ ${response.error}`);
          }
        },
        error: (error) => {
          console.error('❌ خطأ في تسجيل الغائبين:', error);
          alert('❌ حدث خطأ أثناء تسجيل الغائبين');
        }
      });
    }
  }

  // ==================== Reports ====================
  getClassAttendanceReport(classId: string): void {
    if (!classId) {
      alert('⚠️ لا يمكن عرض التقرير بدون معرف الحصة');
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
      error: (error) => {
        console.error('❌ خطأ في تحميل التقرير:', error);
        this.reportLoading = false;
        alert('❌ حدث خطأ أثناء تحميل التقرير');
      }
    });
  }

  exportMonthlyAttendance(classId: string): void {
    if (!classId) {
      alert('⚠️ لا يمكن تصدير التقرير بدون معرف الحصة');
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
    
    // تحميل تفاصيل الحضور
    this.loadLiveClassAttendance(liveClass._id);
  }

  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
    this.selectedLiveClass = null;
    this.quickAttendance = {
      studentId: '',
      status: 'present',
      method: 'manual'
    };
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
    
    // إذا كان studentId كائن
    if (typeof studentId === 'object') {
      return studentId.name || 'غير معروف';
    }
    
    // إذا كان معرف
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
      minute: '2-digit',
      hour12: true 
    });
  }

  getAttendanceRateClass(rate: number): string {
    if (rate >= 80) return 'good';
    if (rate >= 60) return 'warning';
    return 'poor';
  }

  validateLiveClassForm(): boolean {
    if (!this.newLiveClass.class) {
      alert('⚠️ يجب اختيار الحصة');
      return false;
    }
    
    if (!this.newLiveClass.date) {
      alert('⚠️ يجب تحديد التاريخ');
      return false;
    }
    
    if (!this.newLiveClass.startTime) {
      alert('⚠️ يجب تحديد وقت البداية');
      return false;
    }
    
    if (!this.newLiveClass.teacher) {
      alert('⚠️ يجب اختيار الأستاذ');
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
}