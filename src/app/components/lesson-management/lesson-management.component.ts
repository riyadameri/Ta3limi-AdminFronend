import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Class {
  _id: string;
  name: string;
  subject: string;
  academicYear: string;
  price: number;
  teacher?: {
    _id: string;
    name: string;
  };
  students?: any[];
  paymentSystem: 'monthly' | 'rounds';
  schedule?: Array<{
    day: string;
    time: string;
    classroom?: {
      name: string;
    };
  }>;
  createdAt: Date;
}

@Component({
  selector: 'app-lesson-management',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  template: `
    <div class="dashboard-wrapper" dir="rtl">
      <header class="page-header">
        <div class="header-content">
          <div class="header-title">
            <h1>إدارة الحصص والدروس</h1>
            <p class="subtitle">قم بتنظيم ومتابعة كافة الحصص التعليمية في مكان واحد</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openAddLessonDialog()">
              <i class="fas fa-plus"></i>
              <span class="btn-text-mobile">إضافة حصة</span>
            </button>
            <button class="btn btn-outline" (click)="exportToExcel()">
              <i class="fas fa-file-export"></i>
              <span class="btn-text-mobile">تصدير</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Stats in horizontal row -->
      <div class="stats-horizontal">
        <div class="stat-card-horizontal">
          <div class="stat-icon-small blue">
            <i class="fas fa-book"></i>
          </div>
          <div class="stat-info-horizontal">
            <span class="label-small">إجمالي الحصص</span>
            <span class="value-small">{{ lessons.length }}</span>
          </div>
        </div>
        <div class="stat-card-horizontal">
          <div class="stat-icon-small green">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info-horizontal">
            <span class="label-small">إجمالي الطلاب</span>
            <span class="value-small">{{ getTotalStudents() }}</span>
          </div>
        </div>
        <div class="stat-card-horizontal">
          <div class="stat-icon-small orange">
            <i class="fas fa-wallet"></i>
          </div>
          <div class="stat-info-horizontal">
            <span class="label-small">متوسط السعر</span>
            <span class="value-small">{{ formatPrice(getAveragePrice()) }}</span>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <section class="filter-section">
        <div class="filter-grid">
          <div class="form-group">
            <label>المادة</label>
            <select [(ngModel)]="filterSubject" (change)="applyFilter()" class="form-control">
              <option value="">كل المواد</option>
              <option *ngFor="let s of subjects" [value]="s">{{s}}</option>
            </select>
          </div>
          <div class="form-group">
            <label>المستوى</label>
            <select [(ngModel)]="filterAcademicYear" (change)="applyFilter()" class="form-control">
              <option value="">كل المستويات</option>
              <option *ngFor="let y of academicYears" [value]="y">{{y}}</option>
            </select>
          </div>
          <div class="form-group">
            <label>الأستاذ</label>
            <input type="text" [(ngModel)]="filterTeacher" (input)="applyFilter()" 
                   placeholder="اسم الأستاذ..." class="form-control">
          </div>
          <div class="filter-btns">
            <button class="btn btn-secondary btn-sm-full" (click)="clearFilters()">مسح</button>
          </div>
        </div>
      </section>

      <!-- Table Container with Card View for Mobile -->
      <div class="table-container">
        <div class="table-header-actions" *ngIf="selectedLessons.size > 0">
          <span>تم تحديد {{ selectedLessons.size }} حصة</span>
          <button class="btn btn-danger btn-sm" (click)="deleteSelectedLessons()">حذف المحدد</button>
        </div>

        <!-- Desktop Table View -->
        <div class="desktop-table-view">
          <table class="custom-table">
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" (change)="toggleAllSelection()" 
                         [checked]="selectedLessons.size === paginatedLessons.length && paginatedLessons.length > 0">
                </th>
                <th (click)="onSort('name')" class="sortable">اسم الحصة</th>
                <th>المادة</th>
                <th>الأستاذ</th>
                <th>المستوى</th>
                <th>السعر</th>
                <th>النظام</th>
                <th>الطلاب</th>
                <th class="text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lesson of paginatedLessons">
                <td (click)="$event.stopPropagation()">
                  <input type="checkbox" [checked]="selectedLessons.has(lesson._id)" 
                         (change)="toggleSelection(lesson._id, $event)">
                </td>
                <td (click)="navigateToDetails(lesson._id)" class="clickable-cell">
                  <strong>{{ lesson.name }}</strong>
                </td>
                <td (click)="navigateToDetails(lesson._id)" class="clickable-cell">
                  <span class="badge badge-info">{{ lesson.subject }}</span>
                </td>
                <td (click)="navigateToDetails(lesson._id)" class="clickable-cell">
                  {{ getTeacherName(lesson) }}
                </td>
                <td (click)="navigateToDetails(lesson._id)" class="clickable-cell">
                  {{ lesson.academicYear }}
                </td>
                <td (click)="navigateToDetails(lesson._id)" class="clickable-cell">
                  {{ formatPrice(lesson.price) }}
                </td>
                <td (click)="navigateToDetails(lesson._id)" class="clickable-cell">
                  <span [class]="'system-tag ' + lesson.paymentSystem">
                    {{ getPaymentSystemText(lesson.paymentSystem) }}
                  </span>
                </td>
                <td (click)="navigateToDetails(lesson._id)" class="clickable-cell">
                  <div class="student-count">
                    <i class="fas fa-user-graduate"></i>
                    <span>{{ getStudentsCount(lesson) }}</span>
                  </div>
                </td>
                <td class="text-center" (click)="$event.stopPropagation()">
                  <div class="action-btns">
                    <button class="icon-btn edit" (click)="navigateToDetails(lesson._id)" title="تعديل">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" (click)="deleteLesson(lesson._id, $event)" title="حذف">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredLessons.length === 0">
                <td colspan="9" class="empty-state">
                  <i class="fas fa-folder-open"></i>
                  <p>لا توجد نتائج تطابق بحثك</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-card-view">
          <div *ngFor="let lesson of paginatedLessons" class="lesson-card">
            <div class="card-header">
              <input type="checkbox" [checked]="selectedLessons.has(lesson._id)" 
                     (change)="toggleSelection(lesson._id, $event)"
                     (click)="$event.stopPropagation()">
              <div class="card-title" (click)="navigateToDetails(lesson._id)">
                <strong>{{ lesson.name }}</strong>
              </div>
              <div class="card-actions">
                <button class="icon-btn edit" (click)="navigateToDetails(lesson._id)" title="تعديل">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete" (click)="deleteLesson(lesson._id, $event)" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="card-body" (click)="navigateToDetails(lesson._id)">
              <div class="card-info-grid">
                <div class="info-item">
                  <span class="info-label">المادة:</span>
                  <span class="badge badge-info">{{ lesson.subject }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الأستاذ:</span>
                  <span>{{ getTeacherName(lesson) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">المستوى:</span>
                  <span>{{ lesson.academicYear }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">السعر:</span>
                  <span class="price">{{ formatPrice(lesson.price) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">النظام:</span>
                  <span [class]="'system-tag ' + lesson.paymentSystem">
                    {{ getPaymentSystemText(lesson.paymentSystem) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">الطلاب:</span>
                  <span>{{ getStudentsCount(lesson) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="filteredLessons.length === 0" class="empty-state-mobile">
            <i class="fas fa-folder-open"></i>
            <p>لا توجد نتائج تطابق بحثك</p>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-footer">
          <span class="total-info">عرض {{ paginatedLessons.length }} من {{ totalItems }}</span>
          <div class="pagination-controls">
            <button [disabled]="currentPage === 1" (click)="prevPage()" class="page-btn">
              <i class="fas fa-chevron-right"></i>
            </button>
            <button *ngFor="let page of getVisiblePages()" 
                    [class.active]="currentPage === page"
                    (click)="page !== '...' ? goToPage(page) : null"
                    class="page-btn">
              {{ page }}
            </button>
            <button [disabled]="currentPage === totalPages" (click)="nextPage()" class="page-btn">
              <i class="fas fa-chevron-left"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Add Lesson Dialog -->
      <div class="popup-backdrop" *ngIf="showAddDialog" (click)="closeDialogOnBackdrop($event)">
        <div class="popup-container">
          <div class="popup-header">
            <h3>إنشاء حصة تعليمية جديدة</h3>
            <button class="close-btn" (click)="showAddDialog = false">&times;</button>
          </div>
          <div class="popup-body">
            <div class="form-grid">
              <div class="form-group full">
                <label>اسم الحصة *</label>
                <input type="text" [(ngModel)]="newLesson.name" class="form-control" 
                       placeholder="مثلاً: مراجعة الميكانيك للباكالوريا">
              </div>
              <div class="form-group">
                <label>المادة</label>
                <select [(ngModel)]="newLesson.subject" class="form-control">
                  <option *ngFor="let s of subjects" [value]="s">{{s}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>المستوى</label>
                <select [(ngModel)]="newLesson.academicYear" class="form-control">
                  <option *ngFor="let y of academicYears" [value]="y">{{y}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>الأستاذ</label>
                <select [(ngModel)]="newLesson.teacher" class="form-control">
                  <option *ngFor="let t of teachers" [value]="t._id">{{t.name}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>سعر الحصة (د.ج)</label>
                <input type="number" [(ngModel)]="newLesson.price" class="form-control">
              </div>
              <div class="form-group">
                <label>نظام الدفع</label>
                <select [(ngModel)]="newLesson.paymentSystem" class="form-control">
                  <option value="monthly">شهري</option>
                  <option value="rounds">جولات</option>
                </select>
              </div>
            </div>

            <div class="schedule-section">
              <div class="section-title">
                <h4>التوقيت والمكان</h4>
                <button class="btn-text" (click)="addScheduleRow()">+ إضافة موعد</button>
              </div>
              <div class="schedule-rows">
                <div class="schedule-row" *ngFor="let row of newLesson.schedule; let i = index">
                  <select [(ngModel)]="row.day" class="form-control small">
                    <option value="">اليوم</option>
                    <option *ngFor="let d of days" [value]="d">{{d}}</option>
                  </select>
                  <input type="time" [(ngModel)]="row.time" class="form-control small">
                  <select [(ngModel)]="row.classroom" class="form-control small">
                    <option value="">القاعة</option>
                    <option *ngFor="let c of classrooms" [value]="c._id">{{c.name}}</option>
                  </select>
                  <button class="remove-btn" (click)="removeScheduleRow(i)">&times;</button>
                </div>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <button class="btn btn-outline" (click)="showAddDialog = false">إلغاء</button>
            <button class="btn btn-primary" (click)="createLesson()" [disabled]="loading">
              {{ loading ? 'جاري الحفظ...' : 'حفظ الحصة' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Toast Messages -->
      <div class="toast success" *ngIf="successMessage">
        <i class="fas fa-check-circle"></i>
        <span>{{ successMessage }}</span>
      </div>
      <div class="toast error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #4361ee;
      --primary-dark: #3a56d4;
      --secondary: #7209b7;
      --success: #4cc9f0;
      --danger: #f72585;
      --warning: #f8961e;
      --bg: #f8f9fc;
      --text-main: #2b2d42;
      --text-muted: #6c757d;
      --white: #ffffff;
      --border: #e9ecef;
      --shadow: 0 1px 3px rgba(0,0,0,0.08);
      --shadow-hover: 0 4px 12px rgba(0,0,0,0.1);
      --radius: 12px;
      --radius-sm: 8px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .dashboard-wrapper {
      padding: 1rem;
      background: var(--bg);
      min-height: 100vh;
      color: var(--text-main);
      max-width: 100%;
      overflow-x: hidden;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.25rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-title {
      flex: 1;
    }

    .page-header h1 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .subtitle {
      color: var(--text-muted);
      margin-top: 0.25rem;
      font-size: 0.75rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Buttons */
    .btn {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .btn-outline {
      background: transparent;
      border: 1.5px solid var(--border);
      color: var(--text-main);
    }

    .btn-outline:hover {
      background: var(--white);
      border-color: var(--primary);
      color: var(--primary);
    }

    .btn-secondary {
      background: var(--white);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.7rem;
    }

    /* Horizontal Stats */
    .stats-horizontal {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .stats-horizontal::-webkit-scrollbar {
      display: none;
    }

    .stat-card-horizontal {
      background: var(--white);
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 120px;
      box-shadow: var(--shadow);
    }

    .stat-icon-small {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .stat-icon-small.blue { background: #e3f2fd; color: #1976d2; }
    .stat-icon-small.green { background: #e8f5e9; color: #388e3c; }
    .stat-icon-small.orange { background: #fff3e0; color: #f57c00; }

    .stat-info-horizontal {
      flex: 1;
    }

    .label-small {
      font-size: 0.65rem;
      color: var(--text-muted);
      display: block;
    }

    .value-small {
      font-size: 1rem;
      font-weight: 700;
    }

    /* Filter Section */
    .filter-section {
      background: var(--white);
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1.25rem;
      box-shadow: var(--shadow);
    }

    .filter-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .form-group {
      flex: 1;
      min-width: 120px;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.25rem;
      font-weight: 500;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      outline: none;
      font-size: 0.8rem;
    }

    .form-control:focus {
      border-color: var(--primary);
    }

    .filter-btns {
      flex-shrink: 0;
    }

    /* Table Container */
    .table-container {
      background: var(--white);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    /* Desktop Table View */
    .desktop-table-view {
      display: block;
      overflow-x: auto;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }

    .custom-table th {
      background: #f8f9fa;
      padding: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.7rem;
      text-align: right;
    }

    .custom-table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.8rem;
    }

    .clickable-cell {
      cursor: pointer;
    }

    .sortable {
      cursor: pointer;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      display: inline-block;
    }

    .badge-info {
      background: #e3f2fd;
      color: #1976d2;
    }

    .system-tag {
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 500;
      display: inline-block;
    }

    .system-tag.monthly {
      background: #fff3e0;
      color: #f57c00;
    }

    .system-tag.rounds {
      background: #e8f5e9;
      color: #388e3c;
    }

    .student-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .action-btns {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon-btn.edit {
      background: #e3f2fd;
      color: #1976d2;
    }

    .icon-btn.delete {
      background: #ffebee;
      color: var(--danger);
    }

    .table-header-actions {
      padding: 0.75rem;
      background: #fff3e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }

    /* Mobile Card View */
    .mobile-card-view {
      display: none;
    }

    .lesson-card {
      background: var(--white);
      border-bottom: 1px solid var(--border);
      padding: 0.75rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .card-title {
      flex: 1;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .card-body {
      cursor: pointer;
    }

    .card-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .info-label {
      color: var(--text-muted);
      font-weight: 500;
    }

    .price {
      color: var(--primary);
      font-weight: 600;
    }

    .empty-state-mobile {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    /* Pagination */
    .pagination-footer {
      padding: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      border-top: 1px solid var(--border);
    }

    .total-info {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .pagination-controls {
      display: flex;
      gap: 0.25rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .page-btn {
      padding: 0.375rem 0.625rem;
      border: 1px solid var(--border);
      background: white;
      cursor: pointer;
      border-radius: 6px;
      font-size: 0.7rem;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: var(--primary);
      color: white;
    }

    .page-btn.active {
      background: var(--primary);
      color: white;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 2rem !important;
      color: var(--text-muted);
    }

    /* Popup Dialog */
    .popup-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .popup-container {
      background: var(--white);
      width: 100%;
      max-width: 600px;
      border-radius: var(--radius);
      max-height: 90vh;
      overflow-y: auto;
    }

    .popup-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .popup-header h3 {
      font-size: 1rem;
    }

    .close-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: transparent;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .popup-body {
      padding: 1rem;
    }

    .popup-footer {
      padding: 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .form-group.full {
      grid-column: span 2;
    }

    /* Schedule Section */
    .schedule-section {
      margin-top: 1rem;
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
    }

    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .section-title h4 {
      font-size: 0.8rem;
    }

    .schedule-rows {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .schedule-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 0.5rem;
      align-items: center;
    }

    .form-control.small {
      padding: 0.375rem;
      font-size: 0.7rem;
    }

    .remove-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: white;
      cursor: pointer;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      font-size: 0.75rem;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      padding: 0.625rem 1rem;
      border-radius: var(--radius-sm);
      color: white;
      z-index: 2000;
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .toast.success {
      background: #10b981;
    }

    .toast.error {
      background: #ef4444;
    }

    @keyframes slideIn {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-wrapper {
        padding: 0.75rem;
      }

      .desktop-table-view {
        display: none;
      }

      .mobile-card-view {
        display: block;
      }

      .stats-horizontal {
        gap: 0.5rem;
      }

      .stat-card-horizontal {
        min-width: 100px;
        padding: 0.5rem;
      }

      .stat-icon-small {
        width: 32px;
        height: 32px;
      }

      .filter-grid {
        flex-direction: column;
      }

      .form-group {
        width: 100%;
      }

      .filter-btns {
        width: 100%;
      }

      .btn-sm-full {
        width: 100%;
        justify-content: center;
      }

      .btn-text-mobile {
        display: inline;
      }

      .card-info-grid {
        grid-template-columns: 1fr;
        gap: 0.375rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .form-group.full {
        grid-column: span 1;
      }

      .schedule-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .remove-btn {
        justify-self: end;
      }

      .popup-container {
        margin: 0.5rem;
      }
    }

    @media (min-width: 769px) {
      .btn-text-mobile {
        display: inline;
      }
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--primary);
    }
  `]
})
export class LessonManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  lessons: Class[] = [];
  filteredLessons: Class[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  filterSubject = '';
  filterAcademicYear = '';
  filterTeacher = '';
  
  showAddDialog = false;
  newLesson = {
    name: '',
    subject: '',
    academicYear: '',
    price: 0,
    teacher: '',
    description: '',
    paymentSystem: 'monthly' as 'monthly' | 'rounds',
    roundSettings: {
      sessionCount: 8,
      sessionDuration: 2,
      breakBetweenSessions: 0
    },
    schedule: [] as Array<{
      day: string;
      time: string;
      classroom: string;
    }>
  };
  
  subjects = ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'];
  academicYears = ['1AS', '2AS', '3AS', '1MS', '2MS', '3MS', '4MS', '5MS', '1AP', '2AP', '3AP', '4AP', '5AP', 'NS'];
  days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  teachers: any[] = [];
  classrooms: any[] = [];
  
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedLessons = new Set<string>();
  
  ngOnInit(): void {
    this.loadClasses();
    this.loadTeachers();
    this.loadClassrooms();
  }
  
  loadClasses(): void {
    this.loading = true;
    this.http.get<Class[]>(`${environment.apiUrl}/classes`)
      .subscribe({
        next: (classes) => {
          this.lessons = classes;
          this.filteredLessons = [...classes];
          this.applyFilter();
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'فشل تحميل قائمة الحصص';
          this.loading = false;
        }
      });
  }

  loadTeachers(): void {
    this.http.get<any[]>(`${environment.apiUrl}/teachers`).subscribe(t => this.teachers = t);
  }

  loadClassrooms(): void {
    this.http.get<any[]>(`${environment.apiUrl}/classrooms`).subscribe(c => this.classrooms = c);
  }
  
  applyFilter(): void {
    this.filteredLessons = this.lessons.filter(lesson => {
      const matchesSubject = !this.filterSubject || lesson.subject === this.filterSubject;
      const matchesAcademicYear = !this.filterAcademicYear || lesson.academicYear === this.filterAcademicYear;
      const matchesTeacher = !this.filterTeacher || 
        lesson.teacher?.name?.toLowerCase().includes(this.filterTeacher.toLowerCase());
      return matchesSubject && matchesAcademicYear && matchesTeacher;
    });
    this.totalItems = this.filteredLessons.length;
    this.currentPage = 1;
    this.sortData();
  }
  
  clearFilters(): void {
    this.filterSubject = '';
    this.filterAcademicYear = '';
    this.filterTeacher = '';
    this.applyFilter();
  }
  
  sortData(): void {
    this.filteredLessons.sort((a, b) => {
      let valueA = a[this.sortField as keyof Class];
      let valueB = b[this.sortField as keyof Class];
      if (valueA === undefined || valueB === undefined) return 0;
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }
  
  navigateToDetails(lessonId: string): void {
    this.router.navigate(['/home/lesson-detail', lessonId]);
  }
  
  openAddLessonDialog(): void {
    this.showAddDialog = true;
    this.newLesson = {
      name: '', subject: '', academicYear: '', price: 0, teacher: '', description: '',
      paymentSystem: 'monthly',
      roundSettings: { sessionCount: 8, sessionDuration: 2, breakBetweenSessions: 0 },
      schedule: []
    };
  }
  
  closeDialogOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('popup-backdrop')) {
      this.showAddDialog = false;
    }
  }
  
  addScheduleRow(): void {
    this.newLesson.schedule.push({ day: '', time: '', classroom: '' });
  }
  
  removeScheduleRow(index: number): void {
    this.newLesson.schedule.splice(index, 1);
  }
  
  createLesson(): void {
    if (!this.newLesson.name || !this.newLesson.subject || !this.newLesson.academicYear || !this.newLesson.price) {
      this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    
    this.loading = true;
    this.http.post(`${environment.apiUrl}/classes`, this.newLesson)
      .subscribe({
        next: (response: any) => {
          this.showToast(response.message || 'تم إنشاء الحصة بنجاح', 'success');
          this.showAddDialog = false;
          this.loadClasses();
          this.loading = false;
        },
        error: (err) => {
          this.showToast(err.error?.error || 'فشل إنشاء الحصة', 'error');
          this.loading = false;
        }
      });
  }
  
  deleteLesson(lessonId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      this.http.delete(`${environment.apiUrl}/classes/${lessonId}`).subscribe(() => {
        this.showToast('تم حذف الحصة بنجاح', 'success');
        this.loadClasses();
      });
    }
  }

  showToast(msg: string, type: 'success' | 'error') {
    if (type === 'success') {
      this.successMessage = msg;
      setTimeout(() => this.successMessage = '', 3000);
    } else {
      this.errorMessage = msg;
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }
  
  toggleSelection(lessonId: string, event: Event): void {
    event.stopPropagation();
    this.selectedLessons.has(lessonId) ? this.selectedLessons.delete(lessonId) : this.selectedLessons.add(lessonId);
  }
  
  toggleAllSelection(): void {
    if (this.selectedLessons.size === this.paginatedLessons.length) {
      this.selectedLessons.clear();
    } else {
      this.paginatedLessons.forEach(lesson => this.selectedLessons.add(lesson._id));
    }
  }
  
  deleteSelectedLessons(): void {
    if (confirm(`حذف ${this.selectedLessons.size} حصص؟`)) {
      const promises = Array.from(this.selectedLessons).map(id => this.http.delete(`${environment.apiUrl}/classes/${id}`).toPromise());
      Promise.all(promises).then(() => {
        this.showToast('تم الحذف بنجاح', 'success');
        this.selectedLessons.clear();
        this.loadClasses();
      });
    }
  }

  get paginatedLessons(): Class[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredLessons.slice(start, start + this.itemsPerPage);
  }
  
  get totalPages(): number { return Math.ceil(this.totalItems / this.itemsPerPage); }
  
  goToPage(page: any): void { if (typeof page === 'number') this.currentPage = page; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  
  formatPrice(price: number): string { return new Intl.NumberFormat('ar-DZ').format(price) + ' د.ج'; }
  getPaymentSystemText(system: string): string { return system === 'monthly' ? 'دفع شهري' : 'نظام جولات'; }
  getStudentsCount(lesson: Class): number { return lesson.students?.length || 0; }
  getTeacherName(lesson: Class): string { return lesson.teacher?.name || 'غير محدد'; }
  getTotalStudents(): number { return this.lessons.reduce((sum, l) => sum + (l.students?.length || 0), 0); }
  getAveragePrice(): number { return this.lessons.length ? Math.round(this.lessons.reduce((s, l) => s + l.price, 0) / this.lessons.length) : 0; }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (this.currentPage < this.totalPages - 2) pages.push('...');
      pages.push(this.totalPages);
    }
    return pages;
  }
  
  exportToExcel(): void { 
    this.showToast('جاري تحضير ملف الإكسل...', 'success');
  }
}