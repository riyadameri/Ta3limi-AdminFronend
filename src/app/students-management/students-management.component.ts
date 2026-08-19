// ==================== students-management.component.ts - النسخة المحدثة ====================
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PrinterService, ReceiptData } from '../services/printer.service';
import { environment } from '../../environments/environment.development';
import { SoundService } from '../sound.service';

// ==============================================
// Data Interfaces
// ==============================================

interface Student {
  _id?: string;
  id?: string;
  name: string;
  studentId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  academicYear: string;
  birthDate?: string;
  registrationDate?: string;
  active?: boolean;
  status?: string;
  hasPaidRegistration?: boolean;
  classes?: any[];
  new?: boolean;
  schoolId?: string;
  // ✅ حقول جديدة
  username?: string;
  studentAccountCreated?: boolean;
}

interface StudentWithAvatar extends Student {
  avatarInitials?: string;
  avatarColor?: string;

}

@Component({
  selector: 'app-students-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="students-container" dir="rtl">
      <!-- ========== HEADER ========== -->
      <div class="main-header">
        <div class="header-content">
          <!-- Brand -->
          <div class="brand-section">
            <div class="brand-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="brand-info">
              <span class="brand-name">{{schoolName}}</span>
              <span class="brand-sub">إدارة الطلاب</span>
            </div>
          </div>

          <!-- Search -->
          <div class="search-container">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (input)="filterStudents()"
              placeholder="🔍 البحث عن طالب بالاسم أو المعرف..." 
              class="search-input"
            />
          </div>
        </div>

        <!-- Stats -->
        <div class="header-stats">
          <div class="stat-item">
            <div class="stat-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="stat-values">
              <span class="stat-number">{{ students.length }}</span>
              <span class="stat-label">إجمالي الطلاب</span>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-values">
              <span class="stat-number">{{ getPaidCount() }}</span>
              <span class="stat-label">مدفوع</span>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div class="stat-values">
              <span class="stat-number">{{ getUnpaidCount() }}</span>
              <span class="stat-label">غير مدفوع</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="header-actions">
          <button class="btn-import" (click)="openBulkImport()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            استيراد
          </button>
          <button class="btn-add" (click)="openAddStudent()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            إضافة طالب
          </button>
        </div>
      </div>

      <!-- ========== FILTERS ========== -->
      <div class="filter-bar">
          <div class="filter-group">
    <label>💰 حالة الدفع</label>
    <select [(ngModel)]="selectedPaymentStatus" (change)="filterStudents()" class="filter-select">
      <option value="all">الكل</option>
      <option value="paid">✅ مدفوع</option>
      <option value="unpaid">⏳ غير مدفوع</option>
    </select>
  </div>

        <div class="filter-group">
          <label>📚 السنة الدراسية</label>
          <select [(ngModel)]="selectedAcademicYear" (change)="filterStudents()" class="filter-select">
            <option value="all">جميع المستويات</option>
            <option *ngFor="let year of academicYears" [value]="year.value">{{ year.label }}</option>
          </select>
        </div>
        <button *ngIf="searchTerm || selectedAcademicYear !== 'all'" class="btn-clear" (click)="clearFilters()">
          🗑️ مسح التصفية
        </button>
      </div>

      <!-- ========== LOADING ========== -->
      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>⏳ جاري تحميل الطلاب...</p>
      </div>

      <!-- ========== STUDENTS GRID ========== -->
      <div *ngIf="!isLoading" class="cards-container">
        <div class="students-grid">

          <!-- Empty State -->
          <div *ngIf="getDisplayedStudents().length === 0" class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>📭 لا يوجد طلاب</p>
            <span>حاول تعديل البحث أو التصفية</span>
          </div>

          <!-- Student Card -->
          <div class="student-card" *ngFor="let student of getDisplayedStudents()">
            <!-- Card Header -->
            <div class="card-header">
              <div class="student-avatar" [style.background]="student.avatarColor || '#6C63FF'">
                <span class="avatar-initials">{{ student.avatarInitials || '?' }}</span>
              </div>
              <div class="card-header-info">
                <h3 class="student-name">{{ student.name }}</h3>
                <div class="student-id-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  {{ student.studentId || 'غير محدد' }}
                </div>
                <!-- ✅ عرض اسم المستخدم إذا كان موجوداً -->
                <div *ngIf="student.username" class="student-username-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ student.username }}
                </div>
              </div>
              <div class="card-status">
                <span class="status-badge" [class.status-paid]="student.hasPaidRegistration" [class.status-unpaid]="!student.hasPaidRegistration">
                  <span class="status-dot"></span>
                  {{ student.hasPaidRegistration ? '✅ مدفوع' : '⏳ غير مدفوع' }}
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div class="detail-content">
                    <span class="detail-label">المستوى</span>
                    <span class="detail-value">{{ getAcademicYearName(student.academicYear) }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div class="detail-content">
                    <span class="detail-label">ولي الأمر</span>
                    <span class="detail-value">{{ student.parentName || '—' }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="5" y="2" width="14" height="20" rx="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </div>
                  <div class="detail-content">
                    <span class="detail-label">الهاتف</span>
                    <span class="detail-value">{{ student.parentPhone || '—' }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div class="detail-content">
                    <span class="detail-label">التسجيل</span>
                    <span class="detail-value">{{ student.registrationDate | date:'shortDate' }}</span>
                  </div>
                </div>
              </div>
            </div>

<!-- Card Footer -->
<div class="card-footer">
  <button class="action-btn view-btn" (click)="viewStudent(student)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    عرض
  </button>
  <button class="action-btn edit-btn" (click)="editStudent(student)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
    تعديل
  </button>
  
  <!-- زر الدفع -->
  <button class="action-btn pay-btn" (click)="openPayment(student)" [disabled]="student.hasPaidRegistration">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <circle cx="16" cy="14" r="1"/>
    </svg>
    دفع
  </button>
  
  <!-- ✅ زر إلغاء الدفع (يظهر فقط إذا كان مدفوعاً) -->
  <button 
    *ngIf="student.hasPaidRegistration" 
    class="action-btn cancel-btn" 
    (click)="cancelRegistrationPayment(student)"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
    إلغاء الدفع
  </button>
  
  <button class="action-btn delete-btn" (click)="deleteStudent(student)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
    حذف
  </button>
</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== MODAL: ADD/EDIT STUDENT ========== -->
    <div class="modal-overlay" *ngIf="showStudentModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ isEditMode ? '✏️ تعديل طالب' : '➕ إضافة طالب جديد' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form (ngSubmit)="saveStudent()" #studentForm="ngForm">
          <div class="form-group">
            <label>👤 اسم الطالب <span class="required">*</span></label>
            <input type="text" [(ngModel)]="formData.name" name="name" required placeholder="أدخل الاسم الكامل" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>👨‍👦 اسم ولي الأمر</label>
              <input type="text" [(ngModel)]="formData.parentName" name="parentName" placeholder="أدخل اسم ولي الأمر" />
            </div>
            <div class="form-group">
              <label>📱 هاتف ولي الأمر</label>
              <input type="tel" [(ngModel)]="formData.parentPhone" name="parentPhone" placeholder="أدخل رقم الهاتف" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>📚 المستوى الدراسي <span class="required">*</span></label>
              <select [(ngModel)]="formData.academicYear" name="academicYear" required>
                <option value="">اختر المستوى...</option>
                <option *ngFor="let year of academicYears" [value]="year.value">{{ year.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>🎂 تاريخ الميلاد</label>
              <input type="date" [(ngModel)]="formData.birthDate" name="birthDate" />
            </div>
          </div>
          <div class="form-group">
            <label>📅 تاريخ التسجيل</label>
            <input type="date" [(ngModel)]="formData.registrationDate" name="registrationDate" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="closeModal()">إلغاء</button>
            <button type="submit" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? '⏳ جاري الحفظ...' : (isEditMode ? '💾 تحديث الطالب' : '💾 تسجيل الطالب') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== MODAL: PAYMENT ========== -->
    <div class="modal-overlay" *ngIf="showPaymentModal" (click)="closePaymentModal()">
      <div class="modal-content payment-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>💰 دفع رسوم التسجيل</h3>
          <button class="modal-close" (click)="closePaymentModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="payment-info" *ngIf="selectedStudent">
          <div class="payment-student">
            <span class="payment-label">👤 الطالب:</span>
            <strong>{{ selectedStudent.name }}</strong>
          </div>
          <div class="payment-student">
            <span class="payment-label">📚 المستوى:</span>
            <span>{{ getAcademicYearName(selectedStudent.academicYear) }}</span>
          </div>
          <div class="payment-student" *ngIf="selectedStudent.username">
            <span class="payment-label">👤 اسم المستخدم:</span>
            <span style="color: #6C63FF; font-weight: 600;">{{ selectedStudent.username }}</span>
          </div>
        </div>
        <form (ngSubmit)="processPayment()">
          <div class="form-group">
            <label>💰 المبلغ (دج)</label>
            <input type="number" [(ngModel)]="paymentData.amount" name="amount" required min="100" />
          </div>
          <div class="form-group">
            <label>💳 طريقة الدفع</label>
            <select [(ngModel)]="paymentData.method" name="method">
              <option value="cash">نقدي</option>
              <option value="bank">تحويل بنكي</option>
              <option value="cheque">شيك</option>
              <option value="online">دفع إلكتروني</option>
            </select>
          </div>
          <div class="form-group">
            <label>📝 ملاحظات</label>
            <textarea [(ngModel)]="paymentData.notes" name="notes" rows="2" placeholder="ملاحظات اختيارية..."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="closePaymentModal()">إلغاء</button>
            <button type="submit" class="btn-success" [disabled]="isLoading">
              {{ isLoading ? '⏳ جاري المعالجة...' : '✅ تأكيد الدفع' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== MODAL: BULK IMPORT ========== -->
    <div class="modal-overlay" *ngIf="showBulkModal" (click)="closeBulkModal()">
      <div class="modal-content bulk-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📥 استيراد طلاب متعددين</h3>
          <button class="modal-close" (click)="closeBulkModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="import-actions">
          <button class="btn-outline" (click)="downloadTemplate()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            تحميل النموذج
          </button>
          <button class="btn-outline" (click)="importFromText()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            استيراد من نص
          </button>
        </div>
        <div class="form-group">
          <label>📚 المستوى الدراسي الافتراضي</label>
          <select [(ngModel)]="bulkData.defaultYear" class="filter-select">
            <option value="">اختر المستوى الافتراضي...</option>
            <option *ngFor="let year of academicYears" [value]="year.value">{{ year.label }}</option>
          </select>
        </div>
        <div class="table-container import-table">
          <table>
            <thead>
              <tr>
                <th>👤 الاسم *</th>
                <th>👨‍👦 ولي الأمر</th>
                <th>📱 الهاتف</th>
                <th>📚 المستوى</th>
                <th>🎂 تاريخ الميلاد</th>
                <th style="width:40px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of bulkData.students; let i = index">
                <td><input type="text" [(ngModel)]="student.name" placeholder="اسم الطالب" /></td>
                <td><input type="text" [(ngModel)]="student.parentName" placeholder="ولي الأمر" /></td>
                <td><input type="text" [(ngModel)]="student.parentPhone" placeholder="الهاتف" /></td>
                <td>
                  <select [(ngModel)]="student.academicYear">
                    <option value="">تلقائي</option>
                    <option *ngFor="let year of academicYears" [value]="year.value">{{ year.label }}</option>
                  </select>
                </td>
                <td><input type="date" [(ngModel)]="student.birthDate" /></td>
                <td>
                  <button class="btn-remove" (click)="removeBulkRow(i)" *ngIf="bulkData.students.length > 1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="import-actions-bottom">
          <button class="btn-outline" (click)="addBulkRow()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            إضافة صف
          </button>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="closeBulkModal()">إلغاء</button>
            <button type="button" class="btn-primary" (click)="importStudents()" [disabled]="isLoading">
              {{ isLoading ? '⏳ جاري الاستيراد...' : '📥 استيراد الكل' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CSS Variables ===== */
    :host {
      --primary: #6C63FF;
      --primary-dark: #5A52D5;
      --primary-light: #8B83FF;
      --success: #00C9A7;
      --warning: #FFC107;
      --danger: #FF6B6B;
      --dark: #2D3436;
      --gray: #636E72;
      --light-gray: #DFE6E9;
      --bg: #F8F9FA;
      --white: #FFFFFF;
      --radius: 16px;
      --radius-sm: 10px;
      --shadow: 0 10px 40px rgba(0,0,0,0.08);
      --shadow-hover: 0 20px 60px rgba(108,99,255,0.15);
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ===== Container ===== */
    .students-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px 20px 40px;
      font-family: 'Cairo', 'Segoe UI', sans-serif;
    }

    /* ===== Header ===== */
    .main-header {
      background: var(--white);
      border-radius: var(--radius);
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: var(--shadow);
      border: 1px solid var(--light-gray);
      transition: var(--transition);
    }
    .main-header:hover { box-shadow: var(--shadow-hover); }

    .header-content {
      display: flex;
      align-items: center;
      gap: 24px;
      flex: 1;
    }
/* زر إلغاء الدفع */
.cancel-btn {
  color: #FF6B6B;
  border-color: #FCA5A5;
  background: #FEF2F2;
}
.cancel-btn:hover:not(:disabled) {
  background: #FEE2E2;
  border-color: #FF6B6B;
}
    /* Brand */
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(108,99,255,0.3);
    }
    .brand-info { display: flex; flex-direction: column; }
    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--dark);
      line-height: 1.2;
    }
    .brand-sub {
      font-size: 0.7rem;
      color: var(--gray);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Search */
    .search-container {
      position: relative;
      flex: 1;
      max-width: 400px;
    }
    .search-icon {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--gray);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 10px 44px 10px 16px;
      border: 2px solid var(--light-gray);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      background: var(--bg);
      transition: var(--transition);
      color: var(--dark);
      font-family: inherit;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      background: var(--white);
      box-shadow: 0 0 0 4px rgba(108,99,255,0.08);
    }
    .search-input::placeholder { color: var(--gray); }

    /* Stats */
    .header-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 16px;
      background: var(--bg);
      border-radius: 50px;
      border: 1px solid var(--light-gray);
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      transition: var(--transition);
      border-radius: 6px;
    }
    .stat-item:hover { background: var(--white); }
    .stat-icon {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon.blue { background: #DBEAFE; color: var(--primary); }
    .stat-icon.green { background: #ECFDF5; color: var(--success); }
    .stat-icon.orange { background: #FFFBEB; color: #D97706; }
    .stat-values { display: flex; flex-direction: column; line-height: 1.2; }
    .stat-number { font-weight: 700; font-size: 1.05rem; color: var(--dark); }
    .stat-label { font-size: 0.6rem; color: var(--gray); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .stat-divider { width: 1px; height: 28px; background: var(--light-gray); }

    /* Actions */
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .btn-import, .btn-add {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      color: white;
      font-family: inherit;
    }
    .btn-import { background: var(--gray); }
    .btn-import:hover { background: #4A5568; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-add { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); }
    .btn-add:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(108,99,255,0.35); }

    /* ===== Filter Bar ===== */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      flex-wrap: wrap;
    }
    .filter-group { display: flex; align-items: center; gap: 8px; }
    .filter-group label { font-size: 0.85rem; font-weight: 600; color: var(--gray); }
    .filter-select {
      padding: 8px 16px;
      border: 2px solid var(--light-gray);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      background: var(--white);
      color: var(--dark);
      cursor: pointer;
      transition: var(--transition);
      min-width: 150px;
      font-family: inherit;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23636E72' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: left 12px center;
      padding-left: 36px;
    }
    .filter-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(108,99,255,0.08);
    }
    .btn-clear {
      padding: 8px 18px;
      border: none;
      background: var(--bg);
      color: var(--gray);
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
    }
    .btn-clear:hover { background: var(--light-gray); color: var(--dark); }

    /* ===== Loading ===== */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 20px;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid var(--light-gray);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-container p { color: var(--gray); font-size: 0.95rem; }

    /* ===== Students Grid ===== */
    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    /* ===== Student Card ===== */
    .student-card {
      background: var(--white);
      border-radius: var(--radius);
      border: 1px solid var(--light-gray);
      overflow: hidden;
      transition: var(--transition);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
    }
    .student-card:hover {
      box-shadow: var(--shadow-hover);
      transform: translateY(-4px);
      border-color: var(--primary-light);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px 14px;
      background: linear-gradient(135deg, var(--bg), var(--white));
      border-bottom: 1px solid var(--light-gray);
    }
    .student-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 3px solid var(--white);
      color: white;
    }
    .avatar-initials { font-size: 1.1rem; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .card-header-info { flex: 1; min-width: 0; }
    .student-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--dark);
      margin: 0;
      line-height: 1.3;
    }
    .student-id-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      color: var(--gray);
      background: var(--bg);
      padding: 2px 10px;
      border-radius: 20px;
      margin-top: 2px;
      width: fit-content;
    }
    .student-id-badge svg { color: var(--gray); }
    .student-username-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.65rem;
      color: var(--primary);
      background: #EDE7FF;
      padding: 2px 10px;
      border-radius: 20px;
      margin-top: 2px;
      width: fit-content;
    }
    .card-status { display: flex; align-items: center; flex-shrink: 0; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: 1px solid transparent;
    }
    .status-paid {
      background: #ECFDF5;
      color: var(--success);
      border-color: #A7F3D0;
    }
    .status-paid .status-dot { background: var(--success); }
    .status-unpaid {
      background: #FEF2F2;
      color: var(--danger);
      border-color: #FCA5A5;
    }
    .status-unpaid .status-dot { background: var(--danger); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

    /* Card Body */
    .card-body { padding: 16px 20px; flex: 1; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
    .detail-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 0;
    }
    .detail-icon-wrapper {
      width: 32px;
      height: 32px;
      background: var(--bg);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--gray);
    }
    .detail-content { display: flex; flex-direction: column; min-width: 0; }
    .detail-label {
      font-size: 0.6rem;
      color: var(--gray);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .detail-value {
      font-size: 0.85rem;
      color: var(--dark);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Card Footer */
    .card-footer {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      padding: 10px 16px 16px;
      border-top: 1px solid var(--light-gray);
      background: var(--bg);
    }
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 10px;
      border: none;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
      color: var(--gray);
      background: var(--white);
      border: 1px solid var(--light-gray);
    }
    .action-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .action-btn svg { flex-shrink: 0; }
    .view-btn { color: var(--primary); }
    .view-btn:hover:not(:disabled) { background: #DBEAFE; border-color: var(--primary); }
    .edit-btn { color: #D97706; }
    .edit-btn:hover:not(:disabled) { background: #FFFBEB; border-color: #D97706; }
    .pay-btn { color: var(--success); border-color: #A7F3D0; background: #ECFDF5; }
    .pay-btn:hover:not(:disabled) { background: #D1FAE5; border-color: var(--success); }
    .delete-btn { color: var(--danger); border-color: #FCA5A5; background: #FEF2F2; }
    .delete-btn:hover:not(:disabled) { background: #FEE2E2; border-color: var(--danger); }

    /* ===== Empty State ===== */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      grid-column: 1 / -1;
    }
    .empty-state svg { color: var(--light-gray); margin-bottom: 20px; }
    .empty-state p { font-size: 1.1rem; font-weight: 600; color: var(--gray); margin-bottom: 4px; }
    .empty-state span { font-size: 0.9rem; color: var(--gray); }

    /* ===== Modal ===== */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(17,24,39,0.6);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-content {
      background: var(--white);
      border-radius: var(--radius);
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 28px 32px 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: slideUp 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-content.payment-modal { max-width: 480px; }
    .modal-content.bulk-modal { max-width: 920px; }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--light-gray);
      margin-bottom: 20px;
    }
    .modal-header h3 { font-size: 1.15rem; font-weight: 700; color: var(--dark); margin: 0; }
    .modal-close {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      color: var(--gray);
    }
    .modal-close:hover { background: var(--light-gray); transform: rotate(90deg); }

    /* Form */
    .form-group { margin-bottom: 16px; }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--dark);
      margin-bottom: 6px;
    }
    .form-group label .required { color: var(--danger); margin-right: 4px; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 10px 14px;
      border: 2px solid var(--light-gray);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-family: inherit;
      transition: var(--transition);
      background: var(--white);
      color: var(--dark);
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(108,99,255,0.08);
    }
    .form-group input::placeholder { color: var(--gray); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 20px;
      border-top: 2px solid var(--light-gray);
      margin-top: 8px;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-success {
      padding: 10px 28px;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      box-shadow: 0 2px 8px rgba(108,99,255,0.25);
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(108,99,255,0.35); }
    .btn-success {
      background: linear-gradient(135deg, var(--success), #00B894);
      color: white;
      box-shadow: 0 2px 8px rgba(0,201,167,0.25);
    }
    .btn-success:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,201,167,0.35); }
    .btn-secondary { background: var(--bg); color: var(--gray); }
    .btn-secondary:hover { background: var(--light-gray); }
    .btn-primary:disabled, .btn-success:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

    /* Payment Info */
    .payment-info {
      background: var(--bg);
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--light-gray);
    }
    .payment-student { display: flex; gap: 10px; font-size: 0.9rem; }
    .payment-label { color: var(--gray); font-weight: 500; min-width: 60px; }

    /* Import */
    .import-actions { display: flex; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .import-actions-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 2px solid var(--light-gray);
    }
    .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: 2px solid var(--light-gray);
      background: transparent;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--gray);
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
    }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: rgba(108,99,255,0.04); }
    .btn-remove {
      width: 32px;
      height: 32px;
      border: none;
      background: #FEF2F2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      color: var(--danger);
    }
    .btn-remove:hover { background: var(--danger); color: white; transform: scale(1.05); }

    /* Import Table */
    .import-table {
      max-height: 320px;
      overflow-y: auto;
      border: 2px solid var(--light-gray);
      border-radius: var(--radius-sm);
    }
    .import-table table { width: 100%; border-collapse: collapse; }
    .import-table th {
      padding: 10px 12px;
      background: var(--bg);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--gray);
      border-bottom: 2px solid var(--light-gray);
      position: sticky;
      top: 0;
      z-index: 1;
      letter-spacing: 0.5px;
    }
    .import-table td { padding: 6px 8px; border-bottom: 1px solid var(--light-gray); }
    .import-table input, .import-table select {
      width: 100%;
      padding: 6px 10px;
      border: 1.5px solid var(--light-gray);
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: inherit;
      transition: var(--transition);
      background: var(--white);
    }
    .import-table input:focus, .import-table select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(108,99,255,0.08);
    }

    /* ===== Scrollbar ===== */
    .modal-content::-webkit-scrollbar, .import-table::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .modal-content::-webkit-scrollbar-track, .import-table::-webkit-scrollbar-track {
      background: var(--bg);
      border-radius: 3px;
    }
    .modal-content::-webkit-scrollbar-thumb, .import-table::-webkit-scrollbar-thumb {
      background: var(--light-gray);
      border-radius: 3px;
    }
    .modal-content::-webkit-scrollbar-thumb:hover, .import-table::-webkit-scrollbar-thumb:hover {
      background: var(--gray);
    }

    /* ===== Responsive ===== */
    @media (max-width: 1200px) { .header-stats { display: none; } }
    @media (max-width: 992px) {
      .main-header { flex-direction: column; align-items: stretch; gap: 12px; padding: 16px 20px; }
      .header-content { flex-wrap: wrap; }
      .search-container { max-width: 100%; flex: 1; }
      .header-actions { justify-content: flex-start; }
      .form-row { grid-template-columns: 1fr; }
      .students-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    }
    @media (max-width: 768px) {
      .students-container { padding: 0 12px 24px; }
      .main-header { padding: 14px 16px; margin: 12px 0 16px; border-radius: var(--radius-sm); }
      .brand-sub { display: none; }
      .brand-icon { width: 38px; height: 38px; }
      .brand-name { font-size: 1rem; }
      .students-grid { grid-template-columns: 1fr; gap: 14px; }
      .student-card { border-radius: var(--radius-sm); }
      .card-header { padding: 14px 16px 12px; }
      .student-avatar { width: 48px; height: 48px; font-size: 1rem; }
      .card-body { padding: 12px 16px; }
      .details-grid { grid-template-columns: 1fr 1fr; gap: 8px 12px; }
      .detail-item { padding: 4px 0; }
      .detail-icon-wrapper { width: 28px; height: 28px; }
      .detail-value { font-size: 0.8rem; }
      .card-footer { grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 8px 12px 12px; }
      .action-btn { font-size: 0.65rem; padding: 6px 4px; }
      .action-btn svg { width: 14px; height: 14px; }
      .modal-content { padding: 20px 18px; margin: 12px; max-width: 100%; border-radius: var(--radius-sm); }
      .modal-content.bulk-modal { max-width: 100%; }
      .filter-bar { flex-direction: column; align-items: stretch; gap: 10px; }
      .filter-group { flex-wrap: wrap; }
      .filter-select { flex: 1; min-width: 120px; }
      .btn-import span, .btn-add span { display: none; }
      .header-actions { gap: 8px; }
      .btn-import, .btn-add { padding: 8px 14px; font-size: 0.8rem; }
      .import-actions { flex-direction: column; }
      .import-actions-bottom { flex-direction: column; align-items: stretch; }
      .modal-footer { flex-direction: column-reverse; }
      .modal-footer button { width: 100%; justify-content: center; }
      .payment-info { padding: 12px 14px; }
    }
    @media (max-width: 420px) {
      .students-grid { grid-template-columns: 1fr; gap: 12px; }
      .card-footer { grid-template-columns: repeat(2, 1fr); gap: 4px; }
      .action-btn { font-size: 0.6rem; padding: 5px 4px; }
      .action-btn svg { width: 12px; height: 12px; }
      .student-name { font-size: 0.95rem; }
      .detail-value { font-size: 0.75rem; }
      .details-grid { gap: 4px 8px; }
      .header-stats { display: none; }
      .brand-icon { width: 32px; height: 32px; }
      .brand-name { font-size: 0.9rem; }
      .search-input { font-size: 0.8rem; padding: 8px 38px 8px 12px; }
    }
  `]
})



export class StudentsManagementComponent implements OnInit, OnDestroy {

  // ==============================================
  // Properties
  // ==============================================

  private apiUrl = environment.apiUrl; // Replace with your actual API URL
  
  // ✅ School Data - loaded from localStorage
  schoolId: string = '';
  schoolKey: string = '';
  school  : any = localStorage.getItem('school') ? JSON.parse(localStorage.getItem('school')!) : null;
  schoolName : string =  this.school.name ;
  // Data
  students: StudentWithAvatar[] = [];
  filteredStudents: StudentWithAvatar[] = [];

  // Loading state
  isLoading: boolean = false;

  // Search & Filter
  searchTerm: string = '';
  selectedAcademicYear: string = 'all';

  // Modals
  showStudentModal: boolean = false;
  showPaymentModal: boolean = false;
  showBulkModal: boolean = false;
  
  isEditMode: boolean = false;
  selectedStudent: StudentWithAvatar | null = null;
selectedPaymentStatus: string = 'all'; // 'all' | 'paid' | 'unpaid'

  // Student Form
  formData = {
    name: '',
    parentName: '',
    parentPhone: '',
    academicYear: '',
    birthDate: '',
    registrationDate: new Date().toISOString().split('T')[0]
  };

  // Payment Data
  paymentData = {
    amount: 600,
    method: 'cash',
    notes: ''
  };

  // Bulk Import Data
  bulkData = {
    students: [
      { name: '', parentName: '', parentPhone: '', academicYear: '', birthDate: '' }
    ],
    defaultYear: ''
  };

  // Academic Years List
  academicYears = [
    { value: 'all', label: 'جميع المستويات' },
    { value: '1AS', label: 'السنة الأولى ثانوي' },
    { value: '2AS', label: 'السنة الثانية ثانوي' },
    { value: '3AS', label: 'السنة الثالثة ثانوي' },
    { value: '1MS', label: 'السنة الأولى متوسط' },
    { value: '2MS', label: 'السنة الثانية متوسط' },
    { value: '3MS', label: 'السنة الثالثة متوسط' },
    { value: '4MS', label: 'السنة الرابعة متوسط' },
    { value: '1AP', label: 'السنة الأولى ابتدائي' },
    { value: '2AP', label: 'السنة الثانية ابتدائي' },
    { value: '3AP', label: 'السنة الثالثة ابتدائي' },
    { value: '4AP', label: 'السنة الرابعة ابتدائي' },
    { value: '5AP', label: 'السنة الخامسة ابتدائي' }
  ];

  // Avatar Colors
  private avatarColors: string[] = [
    '#6C63FF', '#00C9A7', '#FF6B6B', '#FFC107',
    '#4A9EFF', '#FF6584', '#00B894', '#6C5CE7',
    '#FD79A8', '#0984E3', '#00CEC9', '#FDCB6E',
    '#E17055', '#00B894', '#6C63FF', '#A29BFE'
  ];

  // ==============================================
  // Constructor
  // ==============================================

  constructor(
    private router: Router,
    private printerService: PrinterService,
    private soundService: SoundService

  ) {}

  // ==============================================
  // Lifecycle Hooks
  // ==============================================

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadSchoolData();
    this.loadStudents();
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }

  // ==============================================
  // ✅ Auth Helpers
  // ==============================================

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    localStorage.removeItem('subscription');
    localStorage.removeItem('permissions');
    localStorage.removeItem('loginTime');
    this.router.navigate(['/login']);
  }

  // ==============================================
  // ✅ Load School Data from localStorage
  // ==============================================

  private loadSchoolData(): void {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        const school = JSON.parse(schoolData);
        this.schoolId = school._id || '';
        this.schoolKey = school.schoolKey || '';
        console.log('🏫 School data loaded:', { 
          id: this.schoolId,
          key: this.schoolKey,
          name: school.name
        });
      } else {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.schoolId) {
              this.schoolId = user.schoolId;
              console.log('🏫 School ID loaded from user data:', this.schoolId);
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading school data:', error);
    }
  }

  // ==============================================
  // ✅ Get School ID
  // ==============================================

  getSchoolId(): string {
    if (this.schoolId) return this.schoolId;
    
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        const school = JSON.parse(schoolData);
        return school._id || '';
      }
    } catch (e) {}
    
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.schoolId || '';
      }
    } catch (e) {}
    
    return '';
  }

  // ==============================================
  // ✅ Check Permissions
  // ==============================================

  private checkPermission(permission: string, actionName: string = 'هذه العملية'): boolean {
    const permissionsStr = localStorage.getItem('permissions');
    const userStr = localStorage.getItem('user');
    
    let permissions: any = {};
    
    if (permissionsStr) {
      try {
        permissions = JSON.parse(permissionsStr);
      } catch (e) {
        console.error('❌ Error parsing permissions:', e);
      }
    }
    
    if (!permissions || Object.keys(permissions).length === 0) {
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.permissions) {
            permissions = user.permissions;
          }
        } catch (e) {
          console.error('❌ Error parsing user:', e);
        }
      }
    }
    
    const hasPermission = permissions[permission] === true;
    
    if (!hasPermission) {
      Swal.fire({
        title: '⚠️ غير مصرح',
        text: `ليس لديك صلاحية لـ ${actionName}`,
        icon: 'warning',
        confirmButtonColor: '#6C63FF'
      });
      return false;
    }
    
    return true;
  }

  // ==============================================
  // HTTP Helpers
  // ==============================================

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders()
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('انتهت الجلسة');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || `خطأ ${response.status}`);
    }

    return response.json();
  }

  // ==============================================
  // ✅ Load Students - Filtered by School
  // ==============================================

  loadStudents(): void {
    this.isLoading = true;
    
    const schoolId = this.getSchoolId();
    const url = schoolId 
      ? `${this.apiUrl}/students?schoolId=${schoolId}`
      : `${this.apiUrl}/students`;
    
    console.log(`📚 Loading students for school: ${schoolId || 'all'}`);
    
    this.handleRequest<any>(url)
      .then(response => {
        console.log('📥 API Response:', response);
        
        let studentsData: Student[] = [];
        
        if (Array.isArray(response)) {
          studentsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          studentsData = response.data;
        } else if (response.students && Array.isArray(response.students)) {
          studentsData = response.students;
        } else {
          for (const key in response) {
            if (Array.isArray(response[key])) {
              studentsData = response[key];
              break;
            }
          }
        }

        console.log(`✅ Found ${studentsData.length} students`);
        
        this.students = studentsData.map(student => ({
          ...student,
          avatarColor: this.getAvatarColor(student),
          avatarInitials: this.getStudentInitials(student)
        }));
        
        this.filteredStudents = [...this.students];
        this.isLoading = false;
      })
      .catch(error => {
        console.error('❌ Error loading students:', error);
        Swal.fire('خطأ', error.message || 'فشل تحميل بيانات الطلاب', 'error');
        this.students = [];
        this.filteredStudents = [];
        this.isLoading = false;
      });
  }

  // ==============================================
  // ✅ Save Student (Create/Update) - with School ID
  // ==============================================

  saveStudent(): void {
    if (!this.checkPermission('canManageStudents', 'إدارة الطلاب')) {
      return;
    }

    if (!this.validateForm()) return;

    this.isLoading = true;
    const isEdit = this.isEditMode;
    const studentId = this.selectedStudent?._id || this.selectedStudent?.id;
    const schoolId = this.getSchoolId();
    
    const url = isEdit 
      ? `${this.apiUrl}/students/${studentId}?schoolId=${schoolId}`
      : `${this.apiUrl}/students`;
    const method = isEdit ? 'PUT' : 'POST';

    const data = {
      ...this.formData,
      registrationDate: this.formData.registrationDate || new Date().toISOString().split('T')[0],
      schoolId: schoolId
    };

    console.log('📝 Saving student with schoolId:', schoolId);

    this.handleRequest(url, {
      method,
      body: JSON.stringify(data)
    })
      .then((response: any) => {
          this.soundService.playStudentAdded();

        const message = isEdit ? 'تم تحديث الطالب بنجاح' : 'تم تسجيل الطالب بنجاح';
        
        // ✅ عرض بيانات الاعتماد إذا كانت موجودة
        if (response.credentials) {
          Swal.fire({
            title: '✅ نجاح',
            html: `
              <div style="text-align: right;">
                <p style="color: #00C9A7; font-size: 18px; font-weight: 700;">${message}</p>
                <div style="background: #F8F9FA; padding: 12px; border-radius: 8px; margin: 10px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #2D3436;">🔑 بيانات تسجيل الدخول</h4>
                  <p style="margin: 5px 0;">
                    <strong>👤 اسم المستخدم:</strong> 
                    <span style="color: #6C63FF; font-weight: 700;">${response.credentials.username}</span>
                  </p>
                  <p style="margin: 5px 0;">
                    <strong>🔑 كلمة المرور:</strong> 
                    <span style="color: #FF6B6B; font-weight: 700;">${response.credentials.password}</span>
                  </p>
                </div>
                <p style="font-size: 12px; color: #636E72;">⚠️ يرجى حفظ بيانات تسجيل الدخول في مكان آمن</p>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#6C63FF'
          });
        } else {
          Swal.fire('نجاح', message, 'success');
        }
        
        this.closeModal();
        this.loadStudents();
      })
      .catch(error => {
        console.error('❌ Error saving student:', error);
        Swal.fire('خطأ', error.message || 'فشل حفظ الطالب', 'error');
        this.isLoading = false;
      });
  }

  // ==============================================
  // ✅ Delete Student
  // ==============================================

  deleteStudent(student: StudentWithAvatar): void {
    if (!this.checkPermission('canManageStudents', 'حذف الطلاب')) {
      return;
    }

    const studentId = student._id || student.id;
    if (!studentId) {
      Swal.fire('خطأ', 'لا يمكن تحديد الطالب', 'error');
      return;
    }

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف الطالب "${student.name}" بشكل دائم.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF6B6B',
      cancelButtonColor: '#636E72',
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء'
    }).then(result => {
      if (result.isConfirmed) {
        this.isLoading = true;
        const schoolId = this.getSchoolId();
        const url = `${this.apiUrl}/students/${studentId}?schoolId=${schoolId}`;
        
        this.handleRequest(url, {
          method: 'DELETE'
        })
          .then(() => {
            Swal.fire('تم الحذف', 'تم حذف الطالب بنجاح', 'success');
            this.loadStudents();
          })
          .catch(error => {
            console.error('❌ Error deleting student:', error);
            Swal.fire('خطأ', error.message || 'فشل حذف الطالب', 'error');
            this.isLoading = false;
          });
      }
    });
  }

  // ==============================================
  // ✅ Process Payment - مع طباعة الإيصال
  // ==============================================

  async processPayment(): Promise<void> {
    if (!this.checkPermission('canManagePayments', 'إدارة المدفوعات')) {
      return;
    }

    if (!this.selectedStudent) return;
    
    const studentId = this.selectedStudent._id || this.selectedStudent.id;
    if (!studentId) {
      Swal.fire('خطأ', 'لا يمكن تحديد الطالب', 'error');
      return;
    }

    this.isLoading = true;
    
    const schoolId = this.getSchoolId();
    const url = `${this.apiUrl}/students/${studentId}/pay-registration?schoolId=${schoolId}`;
    
    const payload = {
      amount: this.paymentData.amount,
      paymentMethod: this.paymentData.method,
      paymentDate: new Date().toISOString(),
      notes: this.paymentData.notes,
      schoolId: schoolId
    };
    
    try {
      const response: any = await this.handleRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      console.log('✅ Payment successful:', response);
      this.soundService.playPayment();
      // ✅ عرض بيانات الاعتماد في رسالة النجاح
      const username = response.credentials?.username || this.selectedStudent?.username || 'غير متاح';
      const password = response.credentials?.password || 'يرجى التواصل مع الإدارة';
      const platformUrl = response.credentials?.platformUrl || `https://alrouad.com/studentsPlatform/${studentId}`;
      const qrCodeUrl = response.credentials?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(platformUrl)}`;
      
      // عرض رسالة النجاح مع بيانات الاعتماد
      await Swal.fire({
        title: '✅ تم الدفع بنجاح',
        html: `
          <div style="text-align: right; direction: rtl;">
            <p style="color: #00C9A7; font-size: 18px; font-weight: 700;">✅ تم دفع رسوم التسجيل</p>
            <p style="margin: 10px 0; color: #636E72;">
              <strong>👤 الطالب:</strong> ${this.selectedStudent?.name}
            </p>
            <p style="margin: 5px 0; color: #636E72;">
              <strong>📌 رقم الفاتورة:</strong> ${response.receiptNumber || 'N/A'}
            </p>
            <p style="margin: 5px 0; color: #636E72;">
              <strong>💰 المبلغ:</strong> ${this.paymentData.amount} دج
            </p>
            
            <hr style="margin: 15px 0; border: 1px dashed #DFE6E9;">
            
            <div style="background: #F8F9FA; padding: 12px; border-radius: 8px; margin: 10px 0;">
              <h4 style="margin: 0 0 10px 0; color: #2D3436;">🔑 بيانات تسجيل الدخول</h4>
              <p style="margin: 5px 0; font-size: 14px;">
                <strong>👤 اسم المستخدم:</strong> 
                <span style="color: #6C63FF; font-weight: 700; background: #EDE7FF; padding: 2px 8px; border-radius: 4px;">${username}</span>
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                <strong>🔑 كلمة المرور:</strong> 
                <span style="color: #FF6B6B; font-weight: 700; background: #FFE8E8; padding: 2px 8px; border-radius: 4px;">${password}</span>
              </p>
            </div>
            
            <div style="margin: 10px 0; text-align: center;">
              <p style="font-size: 12px; color: #636E72;">🌐 رابط المنصة:</p>
              <p style="font-size: 14px; color: #6C63FF; word-break: break-all;">
                <a href="${platformUrl}" target="_blank" style="color: #6C63FF; text-decoration: underline;">
                  ${platformUrl}
                </a>
              </p>
            </div>
            
            <div style="margin: 10px 0; text-align: center;">
              <img src="${qrCodeUrl}" style="width: 120px; height: 120px; border: 2px solid #DFE6E9; border-radius: 8px; padding: 5px;" />
            </div>
            
            <div style="margin-top: 10px; padding: 8px; background: #FFFBEB; border-radius: 6px; border: 1px solid #FDE68A;">
              <p style="font-size: 12px; color: #92400E; margin: 0;">
                ⚠️ يرجى حفظ بيانات تسجيل الدخول في مكان آمن
              </p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#6C63FF',
        confirmButtonText: '🖨️ طباعة الإيصال',
        showCancelButton: true,
        cancelButtonText: 'إغلاق',
        cancelButtonColor: '#636E72',
        width: 550
      }).then(async (result) => {
        if (result.isConfirmed) {
          // ✅ طباعة الإيصال مع بيانات الاعتماد
          await this.printReceiptWithCredentials({
            ...response,
            username: username,
            password: password,
            platformUrl: platformUrl,
            qrCodeUrl: qrCodeUrl
          });
        }
      });
      
      this.closePaymentModal();
      this.loadStudents();
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      Swal.fire('خطأ', error.message || 'فشل معالجة الدفع', 'error');
      this.isLoading = false;
    }
  }

  // ==============================================
  // ✅ دالة طباعة الإيصال مع بيانات الاعتماد
  // ==============================================

  private async printReceiptWithCredentials(paymentResponse: any): Promise<void> {
    try {
      if (!this.printerService.checkConnectionStatus()) {
        const connected = await this.printerService.connectToThermalPrinter();
        if (!connected) {
          console.warn('⚠️ Cannot print: printer not connected');
          return;
        }
      }

      const receiptData: ReceiptData = {
        receiptNumber: paymentResponse.receiptNumber || `R${Date.now()}`,
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('ar-EG'),
        studentName: this.selectedStudent?.name || 'Unknown',
        studentId: this.selectedStudent?.studentId || 'N/A',
        className: this.getAcademicYearName(this.selectedStudent?.academicYear),
        month: new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
        amount: this.paymentData.amount,
        paymentMethod: this.paymentData.method,
        academicYear: this.selectedStudent?.academicYear,
        parentPhone: this.selectedStudent?.parentPhone,
        notes: this.paymentData.notes || 'رسوم تسجيل',
        // ✅ بيانات الاعتماد للطباعة
        username: paymentResponse.username,
        password: paymentResponse.password,
        platformUrl: paymentResponse.platformUrl,
        qrCodeUrl: paymentResponse.qrCodeUrl
      };

      const printed = await this.printerService.printProfessionalReceipt(receiptData);
      
      if (printed) {
        console.log('✅ Receipt printed successfully');
      } else {
        console.warn('⚠️ Receipt printing failed');
      }
    } catch (error) {
      console.error('❌ Error printing receipt:', error);
    }
  }

  // ==============================================
  // ✅ Bulk Import
  // ==============================================

  importStudents(): void {
    this.soundService.playWarning();
    if (!this.checkPermission('canManageStudents', 'استيراد الطلاب')) {
      return;
    }

    if (!this.validateBulkData()) return;

    Swal.fire({
      title: 'تأكيد الاستيراد',
      html: `سيتم استيراد <strong>${this.bulkData.students.length}</strong> طالب. هل تريد المتابعة؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، استيراد',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#6C63FF'
    }).then(result => {
      if (result.isConfirmed) {
        this.processBulkImport();
      }
    });
  }

  private processBulkImport(): void {
    this.isLoading = true;
    
    const schoolId = this.getSchoolId();
    
    const students = this.bulkData.students.map(s => ({
      ...s,
      academicYear: s.academicYear || this.bulkData.defaultYear,
      registrationDate: new Date().toISOString().split('T')[0],
      schoolId: schoolId
    }));

    console.log(`📥 Importing ${students.length} students to school ${schoolId}`);

    let successCount = 0;
    let errorCount = 0;
    const total = students.length;

    const processNext = async (index: number) => {
      if (index >= total) {
        this.isLoading = false;
        this.closeBulkModal();
        
        await Swal.fire({
          title: 'اكتمل الاستيراد',
          html: `
            <div style="text-align: center;">
              <p style="color: #00C9A7;">✅ تم استيراد: <strong>${successCount}</strong></p>
              <p style="color: #FF6B6B;">❌ فشل: <strong>${errorCount}</strong></p>
            </div>
          `,
          confirmButtonText: 'تم',
          confirmButtonColor: '#6C63FF'
        });
        
        this.loadStudents();
        return;
      }

      try {
        await this.handleRequest(`${this.apiUrl}/students`, {
          method: 'POST',
          body: JSON.stringify(students[index])
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error importing student ${students[index].name}:`, error);
      }

      processNext(index + 1);
    };

    processNext(0);
  }

  // ==============================================
// ✅ إلغاء دفع حقوق التسجيل للطالب
// ==============================================

cancelRegistrationPayment(student: StudentWithAvatar): void {
  if (!this.checkPermission('canManagePayments', 'إلغاء المدفوعات')) {
    return;
  }

  if (!student.hasPaidRegistration) {
    Swal.fire('معلومات', 'هذا الطالب لم يدفع رسوم التسجيل بعد', 'info');
    return;
  }

  const studentId = student._id || student.id;
  if (!studentId) {
    Swal.fire('خطأ', 'لا يمكن تحديد الطالب', 'error');
    return;
  }

  Swal.fire({
    title: '⚠️ تأكيد الإلغاء',
    html: `
      <div style="text-align: right; direction: rtl;">
        <p style="font-size: 16px; margin-bottom: 10px;">
          هل أنت متأكد من إلغاء دفع رسوم التسجيل للطالب؟
        </p>
        <div style="background: #FEF2F2; padding: 12px; border-radius: 8px; border: 1px solid #FCA5A5;">
          <p style="margin: 5px 0;">
            <strong>👤 الطالب:</strong> ${student.name}
          </p>
          <p style="margin: 5px 0;">
            <strong>📚 المستوى:</strong> ${this.getAcademicYearName(student.academicYear)}
          </p>
          <p style="margin: 5px 0; color: #FF6B6B;">
            <strong>⚠️ تنبيه:</strong> سيتم إلغاء حالة الدفع وسيحتاج الطالب إلى دفع الرسوم مرة أخرى.
          </p>
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#FF6B6B',
    cancelButtonColor: '#636E72',
    confirmButtonText: 'نعم، إلغاء الدفع',
    cancelButtonText: 'إلغاء',
    input: 'textarea',
    inputPlaceholder: '📝 اكتب سبب الإلغاء (اختياري)...',
    inputAttributes: {
      style: 'direction: rtl; text-align: right; font-family: inherit;'
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      this.isLoading = true;
      const reason = result.value || 'لم يتم تحديد سبب';
      
      try {
        const schoolId = this.getSchoolId();
        const url = `${this.apiUrl}/students/${studentId}/cancel-registration?schoolId=${schoolId}`;
        
        const response = await this.handleRequest(url, {
          method: 'PUT',
          body: JSON.stringify({ reason })
        });
        
        console.log('✅ تم إلغاء دفع حقوق التسجيل:', response);
        
        // عرض رسالة نجاح مع ملخص
        await Swal.fire({
          title: '✅ تم الإلغاء بنجاح',
          html: `
            <div style="text-align: right; direction: rtl;">
              <p style="color: #FF6B6B; font-size: 18px; font-weight: 700;">
                ⚠️ تم إلغاء دفع رسوم التسجيل
              </p>
              <div style="background: #F8F9FA; padding: 12px; border-radius: 8px; margin: 10px 0;">
                <p style="margin: 5px 0;">
                  <strong>👤 الطالب:</strong> ${student.name}
                </p>
                <p style="margin: 5px 0;">
                  <strong>📚 المستوى:</strong> ${this.getAcademicYearName(student.academicYear)}
                </p>
                <p style="margin: 5px 0; color: #FF6B6B;">
                  <strong>📝 سبب الإلغاء:</strong> ${reason}
                </p>
              </div>
              <p style="font-size: 12px; color: #636E72;">
                ⚠️ تم إلغاء حالة الدفع. سيظهر الطالب كـ "غير مدفوع".
              </p>
            </div>
          `,
          icon: 'info',
          confirmButtonColor: '#FF6B6B',
          confirmButtonText: 'حسناً'
        });
        
        this.closePaymentModal();
        this.loadStudents();
        
      } catch (error) {
        console.error('❌ خطأ في إلغاء دفع حقوق التسجيل:', error);
        Swal.fire('خطأ', (error as any).message || 'فشل إلغاء الدفع', 'error');
        this.isLoading = false;
      }
    }
  });
}

  getAvatarColor(student: Student): string {
    const index = (student.name?.length || 0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getStudentInitials(student: Student): string {
    return (student.name?.charAt(0) || '?').toUpperCase();
  }

filterStudents(): void {
  this.filteredStudents = this.students.filter(student => {
    const matchesSearch = !this.searchTerm || 
      student.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (student.studentId?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      (student.parentName?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      (student.username?.toLowerCase().includes(this.searchTerm.toLowerCase()));
    
    const matchesYear = this.selectedAcademicYear === 'all' || 
      student.academicYear === this.selectedAcademicYear;
    
    // ✅ فلتر حالة الدفع
    const matchesPayment = this.selectedPaymentStatus === 'all' ||
      (this.selectedPaymentStatus === 'paid' && student.hasPaidRegistration === true) ||
      (this.selectedPaymentStatus === 'unpaid' && student.hasPaidRegistration !== true);
    
    return matchesSearch && matchesYear && matchesPayment;
  });
}

  getDisplayedStudents(): StudentWithAvatar[] {
    return this.filteredStudents;
  }

  clearFilters(): void {
    this.soundService.playRefresh();
    this.searchTerm = '';
    this.selectedAcademicYear = 'all';
      this.selectedPaymentStatus = 'all'; // ✅ إضافة هذا السطر

    this.filterStudents();
  }

  getAcademicYearName(code: string | undefined): string {
    if (!code) return 'غير محدد';
    const year = this.academicYears.find(y => y.value === code);
    return year ? year.label : code;
  }

  getPaidCount(): number {
    return this.students.filter(s => s.hasPaidRegistration).length;
  }

  getUnpaidCount(): number {
    return this.students.filter(s => !s.hasPaidRegistration).length;
  }

  validateForm(): boolean {
    if (!this.formData.name?.trim()) {
      Swal.fire('خطأ', 'يرجى إدخال اسم الطالب', 'error');
      return false;
    }
    if (!this.formData.academicYear) {
      Swal.fire('خطأ', 'يرجى اختيار المستوى الدراسي', 'error');
      return false;
    }
    return true;
  }

  validateBulkData(): boolean {
    for (let i = 0; i < this.bulkData.students.length; i++) {
      if (!this.bulkData.students[i].name?.trim()) {
        Swal.fire('خطأ', `يرجى إدخال اسم الطالب في الصف ${i + 1}`, 'error');
        return false;
      }
    }
    return true;
  }

  resetForm(): void {
    this.formData = {
      name: '',
      parentName: '',
      parentPhone: '',
      academicYear: '',
      birthDate: '',
      registrationDate: new Date().toISOString().split('T')[0]
    };
  }

  // ==============================================
  // Modal Controls
  // ==============================================

  private toggleBodyScroll(disable: boolean): void {
    const body = document.querySelector('body');
    if (body) {
      body.style.overflow = disable ? 'hidden' : '';
    }
  }

  openAddStudent(): void {
    if (!this.checkPermission('canManageStudents', 'إضافة طلاب')) {
      return;
    }
    
    this.soundService.playClick();
    this.isEditMode = false;
    this.selectedStudent = null;
    this.resetForm();
    this.showStudentModal = true;
    this.toggleBodyScroll(true);
  }

  editStudent(student: StudentWithAvatar): void {
    if (!this.checkPermission('canManageStudents', 'تعديل الطلاب')) {
      return;
    }
    
    this.isEditMode = true;
    this.selectedStudent = student;
    this.formData = {
      name: student.name || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      academicYear: student.academicYear || '',
      birthDate: student.birthDate || '',
      registrationDate: student.registrationDate ? 
        new Date(student.registrationDate).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0]
    };
    this.showStudentModal = true;
    this.toggleBodyScroll(true);
  }

  closeModal(): void {
    this.showStudentModal = false;
    this.toggleBodyScroll(false);
  }

  openPayment(student: StudentWithAvatar): void {
    if (!this.checkPermission('canManagePayments', 'إدارة المدفوعات')) {
      return;
    }
    
    if (student.hasPaidRegistration) {
      Swal.fire('معلومات', 'هذا الطالب قام بدفع رسوم التسجيل بالفعل', 'info');
      return;
    }
    
    this.selectedStudent = student;
    this.paymentData = { amount: 600, method: 'cash', notes: '' };
    this.showPaymentModal = true;
    this.toggleBodyScroll(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedStudent = null;
    this.toggleBodyScroll(false);
  }

  openBulkImport(): void {
    if (!this.checkPermission('canManageStudents', 'استيراد الطلاب')) {
      return;
    }
    
    this.bulkData = {
      students: [{ name: '', parentName: '', parentPhone: '', academicYear: '', birthDate: '' }],
      defaultYear: ''
    };
    this.showBulkModal = true;
    this.toggleBodyScroll(true);
  }

  closeBulkModal(): void {
    this.soundService.playRefresh();
    this.showBulkModal = false;
    this.toggleBodyScroll(false);
  }

  addBulkRow(): void {
    this.bulkData.students.push({ name: '', parentName: '', parentPhone: '', academicYear: '', birthDate: '' });
  }

  removeBulkRow(index: number): void {
    if (this.bulkData.students.length > 1) {
      this.bulkData.students.splice(index, 1);
    }
  }

  viewStudent(student: StudentWithAvatar): void {
    const studentId = student._id || student.id;
    if (studentId) {
      this.soundService.playWarning();
      this.router.navigate(['/home/students-management', studentId]);
    } else {
      Swal.fire('خطأ', 'لا يمكن عرض تفاصيل الطالب', 'error');
    }
  }

  // ==============================================
  // Import Functions
  // ==============================================

  importFromText(): void {
    Swal.fire({
      title: 'استيراد من نص',
      html: `
        <div style="text-align: right;">
          <p style="margin-bottom: 10px;">أدخل بيانات الطلاب، طالب واحد في كل سطر.</p>
          <p style="margin-bottom: 10px; color: #666; font-size: 14px;">
            التنسيق: <strong>الاسم,ولي_الأمر,الهاتف,المستوى,تاريخ_الميلاد (اختياري)</strong>
          </p>
          <p style="margin-bottom: 15px; color: #888; font-size: 13px;">
            مثال: محمد أحمد,أحمد محمد,0551234567,1AS,2008-01-15
          </p>
          <textarea id="studentsText" rows="10" class="swal2-textarea" 
            placeholder="أدخل بيانات الطلاب هنا..." style="width:100%;padding:12px;border:2px solid #DFE6E9;border-radius:8px;font-family:inherit;"></textarea>
          <div style="margin-top: 12px;">
            <label for="delimiter" style="font-weight:600;margin-left:8px;">الفاصل:</label>
            <select id="delimiter" class="swal2-select" style="padding:8px 12px;border:2px solid #DFE6E9;border-radius:8px;">
              <option value=",">فاصلة (,)</option>
              <option value=";">فاصلة منقوطة (;)</option>
              <option value="	">تبويب</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'استيراد',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#6C63FF',
      preConfirm: () => {
        const text = (document.getElementById('studentsText') as HTMLTextAreaElement).value;
        const delimiter = (document.getElementById('delimiter') as HTMLSelectElement).value;
        
        if (!text.trim()) {
          Swal.showValidationMessage('يرجى إدخال بيانات الطلاب');
          return false;
        }

        return { text, delimiter };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.parseTextData(result.value.text, result.value.delimiter);
      }
    });
  }

  private parseTextData(text: string, delimiter: string): void {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const students = lines.map(line => {
      const parts = line.split(delimiter).map(p => p.trim());
      return parts.length >= 3 ? {
        name: parts[0],
        parentName: parts[1] || '',
        parentPhone: parts[2] || '',
        academicYear: this.bulkData.defaultYear || parts[3] || '',
        birthDate: parts[4] || ''
      } : null;
    }).filter(s => s !== null);
    
    if (students.length > 0) {
      this.bulkData.students = students;
      Swal.fire('نجاح', `تم استيراد ${students.length} طالب`, 'success');
    } else {
      Swal.fire('خطأ', 'لم يتم العثور على بيانات صالحة', 'error');
    }
  }

  downloadTemplate(): void {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "الاسم,ولي_الأمر,الهاتف,المستوى,تاريخ_الميلاد\n" +
      "محمد أحمد,أحمد محمد,0551234567,1AS,2008-01-15\n" +
      "سارة محمد,محمد خالد,0557654321,2AS,2007-05-20\n" +
      "علي حسن,حسن علي,0551122334,1MS,2009-08-10";
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "students_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==============================================
  // Keyboard Events
  // ==============================================

  @HostListener('window:keydown.esc')
  onEscapePress(): void {
    if (this.showStudentModal) this.closeModal();
    if (this.showPaymentModal) this.closePaymentModal();
    if (this.showBulkModal) this.closeBulkModal();
  }
}