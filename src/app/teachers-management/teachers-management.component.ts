import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeachersService, Teacher } from '../services/teachers.service';
import { ClassesService, Class } from '../classes.service';
import { LiveClassesService, LiveClass } from '../services/live-classes.service';
import { LessonsService } from '../services/lessons.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-teachers-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="teachers-wrapper">
      <div class="teachers-container">
        <!-- Header -->
        <header class="page-header">
          <div class="header-title">
            <h1>إدارة هيئة التدريس</h1>
            <p>إدارة بيانات الأساتذة، تخصصاتهم، ومتابعة أدائهم الأكاديمي</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openAddPopup()">
              <i class="fas fa-plus"></i>
              <span class="btn-text">إضافة أستاذ</span>
            </button>
            <button class="btn btn-outline" (click)="exportToCSV()">
              <i class="fas fa-file-export"></i>
              <span class="btn-text">تصدير</span>
            </button>
          </div>
        </header>

        <!-- Stats Row - Horizontal Scroll -->
        <div class="stats-scroll-container">
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-icon blue">
                <i class="fas fa-chalkboard-teacher"></i>
              </div>
              <div class="stat-info">
                <span class="stat-label">إجمالي الأساتذة</span>
                <span class="stat-value">{{ teachers.length }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon green">
                <i class="fas fa-user-check"></i>
              </div>
              <div class="stat-info">
                <span class="stat-label">الأساتذة النشطين</span>
                <span class="stat-value">{{ activeTeachersCount }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon orange">
                <i class="fas fa-book-reader"></i>
              </div>
              <div class="stat-info">
                <span class="stat-label">إجمالي المواد</span>
                <span class="stat-value">{{ subjectsList.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-section">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" [(ngModel)]="searchTerm" placeholder="ابحث باسم الأستاذ، الهاتف أو البريد...">
          </div>
          <div class="filter-group">
            <select [(ngModel)]="subjectFilter" class="form-select">
              <option value="">كل المواد</option>
              <option *ngFor="let s of subjectsList" [value]="s">{{s}}</option>
            </select>
            <select [(ngModel)]="statusFilter" class="form-select">
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            <button class="btn-clear" (click)="clearFilters()">مسح</button>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="desktop-table-view">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الأستاذ</th>
                  <th>المواد التخصصية</th>
                  <th>بيانات التواصل</th>
                  <th>تاريخ التعيين</th>
                  <th>الحالة</th>
                  <th class="text-center">الإجراءات</th>
                 </tr>
              </thead>
              <tbody>
                <tr *ngFor="let teacher of paginatedTeachers" class="row-hover">
                  <td>
                    <div class="teacher-info">
                      <div class="avatar-circle">{{ teacher.name[0] }}</div>
                      <span class="teacher-name">{{ teacher.name }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="subject-tags">
                      <span *ngFor="let s of teacher.subjects" class="tag">{{ s }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="contact-info">
                      <span><i class="fas fa-phone"></i> {{ teacher.phone || '---' }}</span>
                      <span class="email-text">{{ teacher.email || '---' }}</span>
                    </div>
                  </td>
                  <td>{{ formatDate(teacher.hireDate) }}</td>
                  <td>
                    <span [class]="'status-badge ' + (isTeacherActive(teacher) ? 'active' : 'inactive')">
                      {{ getTeacherStatus(teacher) }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="action-buttons">
                      <button class="icon-btn info" (click)="selectTeacher(teacher); showDetailsPopup = true" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="icon-btn edit" (click)="openEditModal(teacher)" title="تعديل">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="icon-btn status" (click)="toggleTeacherStatus(teacher)" 
                              [title]="isTeacherActive(teacher) ? 'تعطيل' : 'تفعيل'">
                        <i [class]="isTeacherActive(teacher) ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                      </button>
                      <button class="icon-btn delete" (click)="openDeleteModal(teacher)" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-card-view">
          <div *ngFor="let teacher of paginatedTeachers" class="teacher-card">
            <div class="card-header">
              <div class="avatar-large">{{ teacher.name[0] }}</div>
              <div class="teacher-info-card">
                <div class="teacher-name-card">{{ teacher.name }}</div>
                <div class="teacher-status">
                  <span [class]="'status-badge small ' + (isTeacherActive(teacher) ? 'active' : 'inactive')">
                    {{ getTeacherStatus(teacher) }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button class="icon-btn info" (click)="selectTeacher(teacher); showDetailsPopup = true" title="التفاصيل">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="icon-btn edit" (click)="openEditModal(teacher)" title="تعديل">
                  <i class="fas fa-edit"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="info-label">المواد:</span>
                <div class="subject-tags-mobile">
                  <span *ngFor="let s of teacher.subjects" class="tag-small">{{ s }}</span>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">الهاتف:</span>
                <span class="info-value">{{ teacher.phone || '---' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">البريد:</span>
                <span class="info-value">{{ teacher.email || '---' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">تاريخ التعيين:</span>
                <span class="info-value">{{ formatDate(teacher.hireDate) }}</span>
              </div>
            </div>
            <div class="card-footer">
              <button class="icon-btn status" (click)="toggleTeacherStatus(teacher)" 
                      [title]="isTeacherActive(teacher) ? 'تعطيل' : 'تفعيل'">
                <i [class]="isTeacherActive(teacher) ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                <span>{{ isTeacherActive(teacher) ? 'تعطيل' : 'تفعيل' }}</span>
              </button>
              <button class="icon-btn delete" (click)="openDeleteModal(teacher)" title="حذف">
                <i class="fas fa-trash-alt"></i>
                <span>حذف</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="paginatedTeachers.length === 0">
          <i class="fas fa-search-minus"></i>
          <p>لا يوجد أساتذة يطابقون معايير البحث</p>
        </div>

        <!-- Pagination -->
        <div class="pagination-area" *ngIf="paginatedTeachers.length > 0">
          <span class="pagination-info">عرض {{ paginatedTeachers.length }} من أصل {{ totalItems }}</span>
          <div class="pagination-controls">
            <button class="p-btn" (click)="prevPage()" [disabled]="currentPage === 1"><i class="fas fa-chevron-right"></i></button>
            <span class="page-num">{{ currentPage }} / {{ totalPages || 1 }}</span>
            <button class="p-btn" (click)="nextPage()" [disabled]="currentPage >= totalPages"><i class="fas fa-chevron-left"></i></button>
          </div>
        </div>

        <!-- Add/Edit Popup -->
        <div class="popup-overlay" *ngIf="showAddPopup || showEditModal" (click)="closeAllPopups()">
          <div class="popup-container" (click)="$event.stopPropagation()">
            <div class="popup-header">
              <h3>{{ showAddPopup ? 'إضافة أستاذ جديد' : 'تعديل بيانات الأستاذ' }}</h3>
              <button class="close-btn" (click)="closeAllPopups()">&times;</button>
            </div>
            <div class="popup-body">
              <div class="form-group full">
                <label>الاسم الكامل *</label>
                <input type="text" [(ngModel)]="activeTeacherForm.name" class="form-input" placeholder="أدخل الاسم الكامل">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>رقم الهاتف</label>
                  <input type="text" [(ngModel)]="activeTeacherForm.phone" class="form-input" placeholder="رقم الهاتف">
                </div>
                <div class="form-group">
                  <label>البريد الإلكتروني</label>
                  <input type="email" [(ngModel)]="activeTeacherForm.email" class="form-input" placeholder="البريد الإلكتروني">
                </div>
              </div>
              <div class="form-group full">
                <label>المواد التخصصية *</label>
                <div class="subject-selection">
                  <div *ngFor="let s of subjectsList" 
                       class="subject-chip"
                       [class.selected]="activeTeacherForm.subjects?.includes(s)"
                       (click)="toggleSubject(s, showAddPopup ? 'new' : 'edit')">
                    {{ s }}
                  </div>
                </div>
              </div>
              <div class="form-group full">
                <label>تاريخ التعيين</label>
                <input type="date" [(ngModel)]="activeTeacherForm.hireDate" class="form-input">
              </div>
            </div>
            <div class="popup-footer">
              <button class="btn btn-outline" (click)="closeAllPopups()">إلغاء</button>
              <button class="btn btn-primary" (click)="showAddPopup ? addTeacher() : editTeacher()">حفظ البيانات</button>
            </div>
          </div>
        </div>

        <!-- Details Popup -->
        <div class="popup-overlay" *ngIf="showDetailsPopup" (click)="showDetailsPopup = false">
          <div class="popup-container large" (click)="$event.stopPropagation()">
            <div class="popup-header">
              <h3>ملف الأستاذ: {{ selectedTeacher?.name }}</h3>
              <button class="close-btn" (click)="showDetailsPopup = false">&times;</button>
            </div>
            <div class="popup-body">
              <div class="details-layout">
                <div class="details-sidebar">
                  <div class="profile-main">
                    <div class="profile-avatar">{{ selectedTeacher?.name?.[0] }}</div>
                    <h4>{{ selectedTeacher?.name }}</h4>
                    <span class="hire-date">منذ {{ formatDate(selectedTeacher?.hireDate || '') }}</span>
                  </div>
                  <div class="stats-mini">
                    <div class="mini-card">
                      <span class="m-val">{{ teacherStats.totalClasses }}</span>
                      <span class="m-lab">حصة مسجلة</span>
                    </div>
                    <div class="mini-card">
                      <span class="m-val">{{ teacherStats.totalStudents }}</span>
                      <span class="m-lab">طالب إجمالي</span>
                    </div>
                    <div class="mini-card">
                      <span class="m-val">{{ teacherStats.thisMonthClasses }}</span>
                      <span class="m-lab">حصة هذا الشهر</span>
                    </div>
                  </div>
                </div>
                <div class="details-main">
                  <h5 class="section-title">الحصص الحية الأخيرة</h5>
                  <div class="mini-table-container">
                    <table class="mini-table">
                      <thead>
                        <tr><th>عنوان الحصة</th><th>التاريخ</th><th>الحالة</th></tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let lc of teacherLiveClasses.slice(0, 5)">
                          <td>{{ lc.title }}</td>
                          <td>{{ formatDate(lc.date) }}</td>
                          <td><span class="dot-status" [class.completed]="lc.status === 'completed'">{{ lc.status === 'completed' ? 'مكتملة' : 'قادمة' }}</span></td>
                        </tr>
                        <tr *ngIf="teacherLiveClasses.length === 0">
                          <td colspan="3" class="empty-text">لا توجد حصص مسجلة</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete Confirmation Popup -->
        <div class="popup-overlay" *ngIf="showConfirmDeleteModal" (click)="showConfirmDeleteModal = false">
          <div class="popup-container small" (click)="$event.stopPropagation()">
            <div class="popup-body text-center">
              <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
              <h3>هل أنت متأكد؟</h3>
              <p>سيتم حذف الأستاذ <strong>{{ selectedTeacher?.name }}</strong> نهائياً من النظام.</p>
            </div>
            <div class="popup-footer centered">
              <button class="btn btn-outline" (click)="showConfirmDeleteModal = false">تراجع</button>
              <button class="btn btn-danger" (click)="deleteTeacher()">تأكيد الحذف</button>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>جاري المعالجة...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    .teachers-wrapper {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    .teachers-container {
      max-width: 100%;
      overflow-x: hidden;
      background: #f8fafc;
      min-height: 100vh;
      padding: 16px;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      direction: rtl;
    }

    /* Colors */
    :host {
      --primary: #4361ee;
      --primary-dark: #3a56d4;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --text-dark: #1e293b;
      --text-medium: #475569;
      --text-light: #64748b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --radius: 12px;
      --radius-sm: 8px;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      width: 100%;
    }

    .header-title h1 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .header-title p {
      font-size: 0.75rem;
      color: var(--text-light);
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    /* Buttons */
    .btn {
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      border: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-outline {
      background: white;
      border: 1px solid var(--border);
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }

    /* Stats Scroll Container */
    .stats-scroll-container {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      margin-bottom: 20px;
      -webkit-overflow-scrolling: touch;
    }

    .stats-scroll-container::-webkit-scrollbar {
      height: 4px;
    }

    .stats-scroll-container::-webkit-scrollbar-track {
      background: var(--border);
      border-radius: 10px;
    }

    .stats-scroll-container::-webkit-scrollbar-thumb {
      background: var(--primary);
      border-radius: 10px;
    }

    .stats-row {
      display: flex;
      gap: 12px;
      min-width: min-content;
    }

    .stat-card {
      background: white;
      padding: 12px;
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 140px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .stat-icon.blue { background: #e0f2fe; color: #0284c7; }
    .stat-icon.green { background: #d1fae5; color: var(--success); }
    .stat-icon.orange { background: #ffedd5; color: var(--warning); }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 0.65rem;
      color: var(--text-light);
      display: block;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 700;
    }

    /* Filter Section */
    .filter-section {
      background: white;
      padding: 12px;
      border-radius: var(--radius);
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      width: 100%;
    }

    .search-box {
      position: relative;
      margin-bottom: 12px;
    }

    .search-box i {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-light);
    }

    .search-box input {
      width: 100%;
      padding: 10px 36px 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      outline: none;
      font-size: 0.8rem;
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .form-select {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: white;
      font-size: 0.8rem;
    }

    .btn-clear {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid var(--danger);
      color: var(--danger);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.75rem;
    }

    /* Desktop Table */
    .desktop-table-view {
      display: block;
      width: 100%;
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      min-width: 700px;
    }

    .data-table th {
      background: #f1f5f9;
      padding: 12px;
      font-weight: 600;
      color: var(--text-medium);
      text-align: right;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }

    .row-hover:hover {
      background: #f8fafc;
    }

    .teacher-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .subject-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      padding: 4px 10px;
      background: #f1f5f9;
      border-radius: 20px;
      font-size: 0.7rem;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .contact-info i {
      width: 20px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: white;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon-btn.info { background: #e0f2fe; color: #0369a1; }
    .icon-btn.edit { background: #fef3c7; color: #92400e; }
    .icon-btn.delete { background: #fee2e2; color: #991b1b; }
    .icon-btn.status { background: #e0e7ff; color: #4338ca; }

    /* Mobile Card View */
    .mobile-card-view {
      display: none;
      width: 100%;
    }

    .teacher-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 12px;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
    }

    .avatar-large {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .teacher-info-card {
      flex: 1;
    }

    .teacher-name-card {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .status-badge.small {
      display: inline-block;
      padding: 2px 8px;
      font-size: 0.65rem;
    }

    .card-actions {
      display: flex;
      gap: 6px;
    }

    .card-body {
      padding: 12px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed var(--border);
      flex-wrap: wrap;
      gap: 8px;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: var(--text-light);
      font-size: 0.75rem;
    }

    .info-value {
      font-weight: 500;
    }

    .subject-tags-mobile {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag-small {
      padding: 2px 8px;
      background: #f1f5f9;
      border-radius: 12px;
      font-size: 0.65rem;
    }

    .card-footer {
      padding: 12px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .card-footer .icon-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: auto;
      padding: 0 12px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-light);
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    /* Pagination */
    .pagination-area {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      border-top: 1px solid var(--border);
    }

    .pagination-info {
      font-size: 0.7rem;
      color: var(--text-light);
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .p-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: white;
      cursor: pointer;
    }

    .p-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-num {
      font-size: 0.8rem;
      font-weight: 500;
    }

    /* Popup */
    .popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .popup-container {
      background: white;
      width: 100%;
      max-width: 500px;
      border-radius: var(--radius);
      max-height: 90vh;
      overflow-y: auto;
    }

    .popup-container.large {
      max-width: 700px;
    }

    .popup-container.small {
      max-width: 400px;
    }

    .popup-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .popup-header h3 {
      font-size: 1rem;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: transparent;
      font-size: 1.2rem;
      cursor: pointer;
    }

    .popup-body {
      padding: 16px;
    }

    .popup-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .popup-footer.centered {
      justify-content: center;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group.full {
      grid-column: span 2;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      outline: none;
      font-size: 0.8rem;
    }

    .form-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .form-row .form-group {
      flex: 1;
    }

    .subject-selection {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }

    .subject-chip {
      padding: 6px 14px;
      background: #f1f5f9;
      border-radius: 30px;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .subject-chip.selected {
      background: var(--primary);
      color: white;
    }

    .warning-icon {
      font-size: 3rem;
      color: var(--warning);
      margin-bottom: 16px;
    }

    .text-center {
      text-align: center;
    }

    /* Details Layout */
    .details-layout {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .details-sidebar {
      background: #f8fafc;
      border-radius: var(--radius);
      padding: 20px;
      text-align: center;
    }

    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 600;
      margin: 0 auto 12px;
    }

    .profile-main h4 {
      margin-bottom: 4px;
    }

    .hire-date {
      font-size: 0.7rem;
      color: var(--text-light);
    }

    .stats-mini {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .mini-card {
      text-align: center;
      flex: 1;
    }

    .m-val {
      display: block;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary);
    }

    .m-lab {
      font-size: 0.65rem;
      color: var(--text-light);
    }

    .details-main {
      flex: 1;
    }

    .section-title {
      font-size: 0.9rem;
      margin-bottom: 12px;
      color: var(--text-dark);
    }

    .mini-table-container {
      overflow-x: auto;
    }

    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }

    .mini-table th {
      background: #f1f5f9;
      padding: 8px;
      text-align: right;
    }

    .mini-table td {
      padding: 8px;
      border-bottom: 1px solid var(--border);
    }

    .dot-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.65rem;
    }

    .dot-status.completed {
      background: #d1fae5;
      color: #065f46;
    }

    .empty-text {
      text-align: center;
      color: var(--text-light);
    }

    /* Loading */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top: 4px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .teachers-container {
        padding: 12px;
      }

      .desktop-table-view {
        display: none;
      }

      .mobile-card-view {
        display: block;
      }

      .header-actions span {
        display: none;
      }

      .btn {
        padding: 8px 12px;
      }

      .stat-card {
        min-width: 120px;
        padding: 10px;
      }

      .stat-icon {
        width: 36px;
        height: 36px;
      }

      .filter-group {
        flex-direction: column;
      }

      .form-select {
        width: 100%;
      }

      .btn-clear {
        width: 100%;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .details-layout {
        flex-direction: column;
      }

      .stats-mini {
        gap: 8px;
      }

      .popup-container {
        width: calc(100% - 24px);
        margin: 0 auto;
      }
    }

    @media (min-width: 769px) {
      .btn-text {
        display: inline;
      }
    }
  `]
})
export class TeachersManagementComponent implements OnInit {
  private teachersService = inject(TeachersService);
  private classesService = inject(ClassesService);
  private liveClassesService = inject(LiveClassesService);
  
  teachers: Teacher[] = [];
  classes: Class[] = [];
  liveClasses: LiveClass[] = [];
  teacherClasses: Class[] = [];
  teacherLiveClasses: LiveClass[] = [];
  
  selectedTeacher: Teacher | null = null;
  selectedTeacherId: string = '';
  
  newTeacher: any = { name: '', subjects: [], phone: '', email: '', hireDate: new Date().toISOString().split('T')[0], active: true };
  editTeacherData: any = {};
  activeTeacherForm: any = {};

  searchTerm: string = '';
  subjectFilter: string = '';
  statusFilter: string = 'all';
  subjectsList = ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'];
  
  isLoading: boolean = false;
  showAddPopup: boolean = false;
  showEditModal: boolean = false;
  showDetailsPopup: boolean = false;
  showConfirmDeleteModal: boolean = false;
  
  teacherStats: any = { totalClasses: 0, totalStudents: 0, totalLiveClasses: 0, thisMonthClasses: 0 };
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  ngOnInit(): void {
    this.loadTeachers();
    this.loadClasses();
    this.loadLiveClasses();
  }

  openAddPopup(): void {
    this.resetNewTeacherForm();
    this.activeTeacherForm = { ...this.newTeacher };
    this.showAddPopup = true;
  }

  openEditModal(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.editTeacherData = { 
      ...teacher, 
      subjects: [...teacher.subjects], 
      hireDate: teacher.hireDate ? teacher.hireDate.split('T')[0] : new Date().toISOString().split('T')[0] 
    };
    this.activeTeacherForm = { ...this.editTeacherData };
    this.showEditModal = true;
  }

  closeAllPopups(): void {
    this.showAddPopup = false;
    this.showEditModal = false;
  }

  get activeTeachersCount(): number {
    return this.teachers.filter(t => this.isTeacherActive(t)).length;
  }

  loadTeachers(): void {
    this.isLoading = true;
    this.teachersService.getTeachers().subscribe({
      next: (data) => { 
        this.teachers = data; 
        this.totalItems = data.length; 
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadClasses(): void { 
    this.classesService.getClasses().subscribe(data => this.classes = data); 
  }
  
  loadLiveClasses(): void { 
    this.liveClassesService.getLiveClasses().subscribe(data => this.liveClasses = data); 
  }

  get filteredTeachers(): Teacher[] {
    let filtered = this.teachers;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(term) || 
        t.email?.toLowerCase().includes(term) ||
        t.phone?.includes(term)
      );
    }
    if (this.subjectFilter) {
      filtered = filtered.filter(t => t.subjects?.includes(this.subjectFilter));
    }
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(t => this.isTeacherActive(t));
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(t => !this.isTeacherActive(t));
    }
    this.totalItems = filtered.length;
    return filtered;
  }

  get paginatedTeachers(): Teacher[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTeachers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number { 
    return Math.ceil(this.totalItems / this.itemsPerPage); 
  }

  nextPage(): void { 
    if (this.currentPage < this.totalPages) this.currentPage++; 
  }
  
  prevPage(): void { 
    if (this.currentPage > 1) this.currentPage--; 
  }

  selectTeacher(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.selectedTeacherId = teacher._id;
    this.loadTeacherDetails();
  }

  loadTeacherDetails(): void {
    if (!this.selectedTeacher) return;
    this.teacherClasses = this.classes.filter(cls => cls.teacher && cls.teacher._id === this.selectedTeacherId);
    this.teacherLiveClasses = this.liveClasses.filter(lc => lc.teacher && lc.teacher._id === this.selectedTeacherId);
    this.calculateTeacherStats();
  }

  calculateTeacherStats(): void {
    const now = new Date();
    this.teacherStats = {
      totalClasses: this.teacherClasses.length,
      totalStudents: this.teacherClasses.reduce((sum, cls) => sum + (cls.students?.length || 0), 0),
      totalLiveClasses: this.teacherLiveClasses.length,
      thisMonthClasses: this.teacherLiveClasses.filter(lc => {
        const d = new Date(lc.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length
    };
  }

  addTeacher(): void {
    if (!this.validateTeacherForm(this.activeTeacherForm)) return;
    this.isLoading = true;
    this.teachersService.createTeacher(this.activeTeacherForm).subscribe({
      next: () => { 
        this.loadTeachers(); 
        this.showAddPopup = false; 
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  editTeacher(): void {
    if (!this.selectedTeacher || !this.validateTeacherForm(this.activeTeacherForm)) return;
    this.isLoading = true;
    this.teachersService.updateTeacher(this.selectedTeacher._id, this.activeTeacherForm).subscribe({
      next: () => { 
        this.loadTeachers(); 
        this.showEditModal = false; 
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  deleteTeacher(): void {
    if (!this.selectedTeacher) return;
    this.isLoading = true;
    this.teachersService.deleteTeacher(this.selectedTeacher._id).subscribe({
      next: () => { 
        this.loadTeachers(); 
        this.showConfirmDeleteModal = false; 
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  toggleTeacherStatus(teacher: Teacher): void {
    const current = teacher.active ?? true;
    this.teachersService.updateTeacher(teacher._id, { ...teacher, active: !current }).subscribe(() => this.loadTeachers());
  }

  validateTeacherForm(data: any): boolean {
    if (!data.name?.trim()) { 
      alert('الاسم مطلوب'); 
      return false; 
    }
    if (!data.subjects?.length) { 
      alert('اختر مادة واحدة على الأقل'); 
      return false; 
    }
    return true;
  }

  resetNewTeacherForm(): void {
    this.newTeacher = { 
      name: '', 
      subjects: [], 
      phone: '', 
      email: '', 
      hireDate: new Date().toISOString().split('T')[0], 
      active: true 
    };
  }

  openDeleteModal(teacher: Teacher): void { 
    this.selectedTeacher = teacher; 
    this.showConfirmDeleteModal = true; 
  }

  toggleSubject(subject: string, formType: 'new' | 'edit'): void {
    const data = this.activeTeacherForm;
    if (!data.subjects) data.subjects = [];
    const idx = data.subjects.indexOf(subject);
    if (idx > -1) {
      data.subjects.splice(idx, 1);
    } else {
      data.subjects.push(subject);
    }
  }

  formatDate(ds: string): string { 
    return ds ? new Date(ds).toLocaleDateString('ar-EG') : '---'; 
  }
  
  isTeacherActive(t: Teacher): boolean { 
    return t.active !== false; 
  }
  
  getTeacherStatus(t: Teacher): string { 
    return this.isTeacherActive(t) ? 'نشط' : 'غير نشط'; 
  }

  clearFilters(): void { 
    this.searchTerm = ''; 
    this.subjectFilter = ''; 
    this.statusFilter = 'all'; 
    this.currentPage = 1; 
  }

  exportToCSV(): void {
    const rows = this.filteredTeachers.map(t => [
      t.name, 
      t.subjects?.join('|') || '', 
      t.phone || '', 
      t.email || '', 
      this.getTeacherStatus(t)
    ]);
    const csv = 'الاسم,المواد,الهاتف,الايميل,الحالة\n' + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}