// messages-dashboard-enhanced.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { environment } from '../../environments/environment.development';
interface Student {
  _id: string;
  name: string;
  studentId?: string;
  parentPhone: string;
  parentEmail?: string;
  academicYear: string;
  status: string;
  active: boolean;
  classes?: any[];
}

interface ClassInfo {
  _id: string;
  name: string;
  subject: string;
  academicYear: string;
  teacher?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  schedule?: any[];
  studentsCount?: number;
  studentsWithPhone?: number;
  studentsWithEmail?: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: TemplateField[];
}

interface TemplateField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface SearchFilters {
  searchTerm: string;
  academicYear: string;
  status: string;
  active: string;
  classId: string;
}

@Component({
  selector: 'app-messages-dashboard-enhanced',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-dashboard" dir="rtl">
      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>

      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1>
            <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            نظام الرسائل
          </h1>
          <p class="subtitle">إدارة وإرسال الرسائل لأولياء الأمور</p>
        </div>
        <div class="header-right">
          <div class="whatsapp-status" [class.connected]="whatsappConnected">
            <span class="status-indicator"></span>
            <span class="status-text">{{ whatsappConnected ? 'واتساب متصل' : 'واتساب غير متصل' }}</span>
            <span class="phone-number" *ngIf="whatsappNumber">({{ whatsappNumber }})</span>
          </div>
          <button class="refresh-btn" (click)="refreshData()">
            <svg class="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalStudents }}</div>
            <div class="stat-label">إجمالي الطلاب</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon messages">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalMessages }}</div>
            <div class="stat-label">الرسائل المرسلة</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ successRate }}%</div>
            <div class="stat-label">نسبة النجاح</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ latePaymentsCount }}</div>
            <div class="stat-label">دفعات متأخرة</div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <button 
          *ngFor="let tab of tabs" 
          class="tab-button" 
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id">
          <span class="tab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="tab.id === 'send'" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path *ngIf="tab.id === 'class-message'" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path *ngIf="tab.id === 'reminders'" d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              <path *ngIf="tab.id === 'history'" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
              <path *ngIf="tab.id === 'sessions'" d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab: Send Message -->
      <div class="tab-panel" *ngIf="activeTab === 'send'">
        <div class="panel-header">
          <h2>إرسال رسالة</h2>
          <p>إرسال رسائل فردية أو جماعية لأولياء الأمور</p>
        </div>

        <!-- Professional Student Search -->
        <div class="search-section">
          <h3>البحث عن الطلاب</h3>
          <div class="search-filters">
            <div class="filter-group">
              <input 
                type="text" 
                class="form-control" 
                placeholder="بحث بالاسم، رقم الطالب، أو رقم الهاتف..."
                [(ngModel)]="searchFilters.searchTerm"
                (ngModelChange)="onSearchChange()">
            </div>
            <div class="filter-group">
              <select class="form-control" [(ngModel)]="searchFilters.academicYear" (change)="performSearch()">
                <option value="all">جميع المستويات</option>
                <option value="1AS">1 ثانوي</option>
                <option value="2AS">2 ثانوي</option>
                <option value="3AS">3 ثانوي</option>
                <option value="1MS">1 متوسط</option>
                <option value="2MS">2 متوسط</option>
                <option value="3MS">3 متوسط</option>
                <option value="4MS">4 متوسط</option>
              </select>
            </div>
            <div class="filter-group">
              <select class="form-control" [(ngModel)]="searchFilters.status" (change)="performSearch()">
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="pending">قيد الانتظار</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <button class="btn-secondary" (click)="performSearch()">بحث</button>
            <button class="btn-text" (click)="clearSearch()">مسح</button>
          </div>
        </div>

        <!-- Student Selection -->
        <div class="selection-section">
          <div class="selection-header">
            <h3>اختر المستلمين</h3>
            <div class="selection-actions">
              <button class="btn-text" (click)="selectAll()">تحديد الكل</button>
              <button class="btn-text" (click)="deselectAll()">إلغاء الكل</button>
              <span class="selected-count">تم اختيار {{ selectedStudentIds.length }} طالب</span>
            </div>
          </div>

          <div class="students-grid">
            <div *ngFor="let student of filteredStudents" class="student-card" 
                 [class.selected]="isSelected(student._id)">
              <div class="student-checkbox">
                <input 
                  type="checkbox" 
                  [id]="'student-' + student._id"
                  [checked]="isSelected(student._id)"
                  (change)="toggleStudent(student._id)">
                <label [for]="'student-' + student._id"></label>
              </div>
              <div class="student-avatar" [style.background]="getAvatarColor(student.name)">
                {{ getInitials(student.name) }}
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-details">
                  <span class="student-id">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="3" y1="15" x2="21" y2="15"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    رقم: {{ student.studentId || 'غير محدد' }}
                  </span>
                  <span class="student-phone">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="5" y="2" width="14" height="20" rx="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    هاتف: {{ student.parentPhone }}
                  </span>
                  <span class="student-year">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                    المستوى: {{ student.academicYear }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="no-results" *ngIf="filteredStudents.length === 0">
            <p>لا توجد نتائج للبحث</p>
          </div>
        </div>

        <!-- Message Composition -->
        <div class="message-section">
          <h3>نص الرسالة</h3>
          <div class="message-composer">
            <textarea 
              class="message-textarea"
              rows="6"
              placeholder="اكتب رسالتك هنا..."
              [(ngModel)]="messageContent"
              (input)="updateCharacterCount()"></textarea>
            <div class="message-footer">
              <span class="char-counter">{{ messageContent.length }}/500</span>
              <div class="template-buttons">
                <button class="btn-outline" (click)="insertTemplate('absence')">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  قالب غياب
                </button>
                <button class="btn-outline" (click)="insertTemplate('payment')">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                  قالب دفع
                </button>
                <button class="btn-outline" (click)="insertTemplate('announcement')">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  قالب إعلان
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Options -->
        <div class="delivery-section">
          <h3>خيارات الإرسال</h3>
          <div class="delivery-options">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="sendWhatsApp">
              <span>
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21z"/>
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/>
                  <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/>
                </svg>
                إرسال عبر واتساب
              </span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="sendEmail">
              <span>
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-10 7L2 7"/>
                </svg>
                إرسال عبر البريد الإلكتروني
              </span>
            </label>
          </div>
        </div>

        <!-- Message Preview -->
        <div class="preview-section" *ngIf="messageContent">
          <h3>معاينة الرسالة</h3>
          <div class="message-preview">
            <div class="preview-header">
              <span>إلى: {{ selectedStudentIds.length }} ولي أمر</span>
            </div>
            <div class="preview-content">{{ messageContent }}</div>
            <div class="preview-footer">
              <span>مع تحيات إدارة المدرسة</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-primary" (click)="sendMessage()" [disabled]="!canSend()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            {{ sending ? 'جاري الإرسال...' : 'إرسال الرسالة' }}
          </button>
          <button class="btn-secondary" (click)="clearForm()">مسح</button>
        </div>
      </div>

      <!-- Tab: Send to Class -->
      <div class="tab-panel" *ngIf="activeTab === 'class-message'">
        <div class="panel-header">
          <h2>إرسال رسالة لحصة معينة</h2>
          <p>إرسال رسالة لجميع طلاب حصة محددة أو لطلاب مختارين</p>
        </div>

        <!-- Class Selection -->
        <div class="search-section">
          <h3>اختر الحصة</h3>
          <div class="search-filters">
            <div class="filter-group">
              <select class="form-control" [(ngModel)]="selectedClassId" (change)="onClassSelect()">
                <option value="">-- اختر حصة --</option>
                <option *ngFor="let classItem of availableClassesList" [value]="classItem._id">
                  {{ classItem.name }} - {{ classItem.subject }} ({{ classItem.academicYear }})
                </option>
              </select>
            </div>
            <div class="filter-group" *ngIf="selectedClassId">
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" name="recipientType" [value]="true" [(ngModel)]="includeAllStudentsInClass" (change)="onRecipientTypeChange()">
                  <span>جميع الطلاب ({{ selectedClassStudents.length }})</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="recipientType" [value]="false" [(ngModel)]="includeAllStudentsInClass" (change)="onRecipientTypeChange()">
                  <span>اختيار طلاب محددين</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Class Info -->
        <div class="class-info" *ngIf="selectedClassId && classDetails">
          <div class="info-card">
            <h4>معلومات الحصة</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">اسم الحصة:</span>
                <span class="info-value">{{ classDetails.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">المادة:</span>
                <span class="info-value">{{ classDetails.subject }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">الأستاذ:</span>
                <span class="info-value">{{ classDetails.teacher?.name || 'غير محدد' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">عدد الطلاب:</span>
                <span class="info-value">{{ classDetails.studentsCount || 0 }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">متاح واتساب:</span>
                <span class="info-value">{{ classDetails.studentsWithPhone || 0 }} طالب</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Selection (if specific students selected) -->
        <div class="selection-section" *ngIf="selectedClassId && !includeAllStudentsInClass && selectedClassStudents.length > 0">
          <div class="selection-header">
            <h3>اختر الطلاب المستلمين</h3>
            <div class="selection-actions">
              <button class="btn-text" (click)="selectAllClassStudents()">تحديد الكل</button>
              <button class="btn-text" (click)="deselectAllClassStudents()">إلغاء الكل</button>
              <span class="selected-count">تم اختيار {{ selectedClassStudentIds.length }} طالب</span>
            </div>
          </div>

          <div class="students-grid">
            <div *ngFor="let student of selectedClassStudents" class="student-card" 
                 [class.selected]="isClassStudentSelected(student._id)">
              <div class="student-checkbox">
                <input 
                  type="checkbox" 
                  [id]="'class-student-' + student._id"
                  [checked]="isClassStudentSelected(student._id)"
                  (change)="toggleClassStudent(student._id)">
                <label [for]="'class-student-' + student._id"></label>
              </div>
              <div class="student-avatar" [style.background]="getAvatarColor(student.name)">
                {{ getInitials(student.name) }}
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-details">
                  <span class="student-id">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="3" y1="15" x2="21" y2="15"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    رقم: {{ student.studentId || 'غير محدد' }}
                  </span>
                  <span class="student-phone">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="5" y="2" width="14" height="20" rx="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    هاتف: {{ student.parentPhone || 'غير متوفر' }}
                  </span>
                  <span class="student-email">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-10 7L2 7"/>
                    </svg>
                    بريد: {{ student.parentEmail || 'غير متوفر' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Student List Summary (if all students) -->
        <div class="students-summary" *ngIf="selectedClassId && includeAllStudentsInClass && selectedClassStudents.length > 0">
          <div class="summary-card">
            <h4>ملخص المستلمين</h4>
            <div class="summary-stats">
              <div class="stat-badge">
                <span class="stat-number">{{ selectedClassStudents.length }}</span>
                <span class="stat-label">إجمالي الطلاب</span>
              </div>
              <div class="stat-badge">
                <span class="stat-number">{{ getStudentsWithPhone() }}</span>
                <span class="stat-label">متاح عبر واتساب</span>
              </div>
              <div class="stat-badge">
                <span class="stat-number">{{ getStudentsWithEmail() }}</span>
                <span class="stat-label">متاح عبر البريد</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Composition -->
        <div class="message-section">
          <h3>نص الرسالة</h3>
          <div class="message-composer">
            <textarea 
              class="message-textarea"
              rows="6"
              placeholder="اكتب رسالتك هنا..."
              [(ngModel)]="classMessageContent"
              (input)="updateClassMessageCount()"></textarea>
            <div class="message-footer">
              <span class="char-counter">{{ classMessageContent.length }}/500</span>
              <div class="template-buttons">
                <button class="btn-outline" (click)="insertClassTemplate('absence')">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  قالب غياب
                </button>
                <button class="btn-outline" (click)="insertClassTemplate('payment')">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                  قالب دفع
                </button>
                <button class="btn-outline" (click)="insertClassTemplate('announcement')">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  قالب إعلان
                </button>
                <button class="btn-outline" (click)="insertClassTemplate('class')">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  قالب حصة
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Preview -->
        <div class="preview-section" *ngIf="classMessageContent">
          <h3>معاينة الرسالة</h3>
          <div class="message-preview">
            <div class="preview-header">
              <span>إلى: {{ getRecipientsCount() }} ولي أمر</span>
              <span *ngIf="selectedClassId && classDetails">حصة: {{ classDetails.name }}</span>
            </div>
            <div class="preview-content">{{ classMessageContent }}</div>
            <div class="preview-footer">
              <span>مع تحيات إدارة المدرسة</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-primary" (click)="sendToClass()" [disabled]="!canSendToClass()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            {{ sending ? 'جاري الإرسال...' : 'إرسال الرسالة للحصة' }}
          </button>
          <button class="btn-secondary" (click)="clearClassForm()">مسح</button>
        </div>
      </div>

      <!-- Tab: Payment Reminders -->
      <div class="tab-panel" *ngIf="activeTab === 'reminders'">
        <div class="panel-header">
          <h2>تذكيرات الدفع</h2>
          <p>إرسال تذكيرات للطلاب المتأخرين في الدفع</p>
        </div>

        <div class="late-students-list">
          <div class="list-header">
            <span>الطالب</span>
            <span>رقم الطالب</span>
            <span>المستوى</span>
            <span>المبلغ المتأخر</span>
            <span>الأشهر المتأخرة</span>
            <span>الإجراء</span>
          </div>

          <div *ngFor="let student of lateStudents" class="list-item">
            <div class="student-name">
              <div class="student-avatar-sm" [style.background]="getAvatarColor(student.name)">
                {{ getInitials(student.name) }}
              </div>
              {{ student.name }}
            </div>
            <div class="student-id">{{ student.studentId }}</div>
            <div class="student-year">{{ student.academicYear }}</div>
            <div class="amount">{{ student.totalAmountDue?.toLocaleString() || 0 }} د.ج</div>
            <div class="months">{{ student.monthsLateCount || 0 }} شهر</div>
            <div class="actions">
              <button class="btn-warning" (click)="sendPaymentReminder(student)" [disabled]="sending">
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                إرسال تذكير
              </button>
            </div>
          </div>

          <div class="no-results" *ngIf="lateStudents.length === 0">
            <p>لا توجد دفعات متأخرة</p>
          </div>
        </div>
      </div>

      <!-- Tab: Message History -->
      <div class="tab-panel" *ngIf="activeTab === 'history'">
        <div class="panel-header">
          <h2>سجل الرسائل</h2>
          <p>عرض تاريخ الرسائل المرسلة</p>
        </div>

        <div class="history-filters">
          <select class="form-control" [(ngModel)]="historyFilters.type" (change)="loadMessageHistory()">
            <option value="all">جميع الأنواع</option>
            <option value="individual">فردية</option>
            <option value="bulk">جماعية</option>
            <option value="class">حصة</option>
            <option value="payment">دفع</option>
            <option value="absence">غياب</option>
          </select>
          <input type="date" class="form-control" [(ngModel)]="historyFilters.startDate" (change)="loadMessageHistory()">
          <input type="date" class="form-control" [(ngModel)]="historyFilters.endDate" (change)="loadMessageHistory()">
          <button class="btn-primary" (click)="loadMessageHistory()">بحث</button>
        </div>

        <div class="messages-list">
          <div *ngFor="let message of messageHistory" class="message-item">
            <div class="message-header">
              <span class="message-type" [class]="getMessageTypeClass(message.type)">
                {{ getMessageTypeName(message.type) }}
              </span>
              <span class="message-date">{{ message.sentAt | date:'yyyy/MM/dd HH:mm' }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
            <div class="message-footer">
              <span class="recipients-count">
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                المستلمين: {{ message.recipientsCount || 1 }}
              </span>
              <span class="status-badge" [class.success]="message.success" [class.failed]="!message.success">
                {{ message.success ? 'تم الإرسال' : 'فشل الإرسال' }}
              </span>
            </div>
          </div>
        </div>

        <div class="no-results" *ngIf="messageHistory.length === 0">
          <p>لا توجد رسائل في السجل</p>
        </div>
      </div>

      <!-- Tab: Session Payments -->
      <div class="tab-panel" *ngIf="activeTab === 'sessions'">
        <div class="panel-header">
          <h2>دفع حصة محددة</h2>
          <p>دفع قيمة جلسة محددة بدلاً من الدفع الشهري</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>اختر الطالب</label>
            <select class="form-control" [(ngModel)]="sessionPayment.studentId">
              <option value="">-- اختر طالباً --</option>
              <option *ngFor="let student of students" [value]="student._id">
                {{ student.name }} - {{ student.academicYear }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>اختر الحصة</label>
            <select class="form-control" [(ngModel)]="sessionPayment.classId" (change)="loadSessionOptions()">
              <option value="">-- اختر حصة --</option>
              <option *ngFor="let classItem of availableClasses" [value]="classItem._id">
                {{ classItem.name }} - {{ classItem.subject }}
              </option>
            </select>
          </div>

          <div class="form-group" *ngIf="sessionOptions.length > 0">
            <label>اختر الجلسة</label>
            <select class="form-control" [(ngModel)]="sessionPayment.sessionNumber">
              <option value="">-- اختر الجلسة --</option>
              <option *ngFor="let option of sessionOptions" [value]="option.sessionNumber">
                الجلسة {{ option.sessionNumber }} - {{ option.sessionDate | date:'yyyy/MM/dd' }} - {{ option.price }} د.ج
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>المبلغ (اختياري)</label>
            <input type="number" class="form-control" [(ngModel)]="sessionPayment.amount" placeholder="اتركه فارغاً للحساب التلقائي">
          </div>

          <div class="form-group">
            <label>طريقة الدفع</label>
            <select class="form-control" [(ngModel)]="sessionPayment.paymentMethod">
              <option value="cash">نقدي</option>
              <option value="bank">تحويل بنكي</option>
              <option value="online">دفع إلكتروني</option>
            </select>
          </div>

          <div class="form-actions">
            <button class="btn-primary" (click)="paySession()" [disabled]="!canPaySession()">
              {{ paying ? 'جاري الدفع...' : 'دفع الجلسة' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messages-dashboard {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-overlay .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #2c7da0;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    }

    .header-left h1 {
      margin: 0;
      font-size: 28px;
      color: #1a2c3e;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      width: 32px;
      height: 32px;
      color: #2c7da0;
    }

    .subtitle {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 14px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .whatsapp-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #f1f5f9;
      border-radius: 24px;
      font-size: 13px;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ef4444;
      transition: all 0.3s;
    }

    .whatsapp-status.connected .status-indicator {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .refresh-icon {
      width: 18px;
      height: 18px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      background: #2c7da0;
    }

    .stat-icon.messages { background: #8b5cf6; }
    .stat-icon.success { background: #22c55e; }
    .stat-icon.warning { background: #f59e0b; }

    .stat-icon svg {
      width: 28px;
      height: 28px;
      stroke: white;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 13px;
      color: #64748b;
    }

    .tabs-container {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0;
      flex-wrap: wrap;
      background: white;
      border-radius: 12px 12px 0 0;
      padding: 8px 12px 0;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      border-radius: 8px 8px 0 0;
    }

    .tab-button:hover {
      color: #2c7da0;
      background: #f8fafc;
    }

    .tab-button.active {
      color: #2c7da0;
      border-bottom-color: #2c7da0;
      background: #f0f7ff;
    }

    .tab-icon svg {
      width: 20px;
      height: 20px;
    }

    .tab-panel {
      background: white;
      border-radius: 0 0 16px 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .panel-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 20px;
      color: #1e293b;
    }

    .panel-header p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 14px;
    }

    .search-section {
      margin-bottom: 24px;
    }

    .search-section h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: #334155;
    }

    .search-filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 180px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #2c7da0;
      box-shadow: 0 0 0 3px rgba(44, 125, 160, 0.1);
    }

    .radio-group {
      display: flex;
      gap: 20px;
      padding: 8px 0;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .radio-label input[type="radio"] {
      width: 18px;
      height: 18px;
      accent-color: #2c7da0;
    }

    .btn-primary, .btn-secondary, .btn-text, .btn-outline, .btn-warning {
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }

    .btn-primary {
      background: #2c7da0;
      color: white;
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1f5e7a;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(44, 125, 160, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-text {
      background: transparent;
      border: none;
      color: #2c7da0;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    .btn-outline:hover {
      background: #f8fafc;
      border-color: #2c7da0;
    }

    .btn-warning {
      background: #f97316;
      border: none;
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: #ea580c;
    }

    .btn-warning:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon {
      width: 18px;
      height: 18px;
    }

    .selection-section {
      margin-bottom: 24px;
    }

    .selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .selection-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #334155;
    }

    .selection-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .selected-count {
      font-size: 13px;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 14px;
      border-radius: 16px;
    }

    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 12px;
      max-height: 420px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
    }

    .student-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .student-card:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .student-card.selected {
      background: #f0f7ff;
      border-color: #2c7da0;
      box-shadow: 0 0 0 2px rgba(44, 125, 160, 0.15);
    }

    .student-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #2c7da0;
    }

    .student-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .student-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .student-info {
      flex: 1;
      min-width: 0;
    }

    .student-name {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .student-details {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #64748b;
    }

    .student-details span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .icon-xs {
      width: 14px;
      height: 14px;
      stroke-width: 2;
      stroke: currentColor;
      fill: none;
      flex-shrink: 0;
    }

    .class-info, .students-summary {
      margin-bottom: 24px;
    }

    .info-card, .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }

    .info-card h4, .summary-card h4 {
      margin: 0 0 12px;
      font-size: 16px;
      color: #1e293b;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .info-item {
      display: flex;
      gap: 8px;
    }

    .info-label {
      font-weight: 600;
      color: #334155;
    }

    .info-value {
      color: #64748b;
    }

    .summary-stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .stat-badge {
      background: white;
      padding: 8px 16px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #2c7da0;
    }

    .stat-label {
      font-size: 12px;
      color: #64748b;
    }

    .message-section {
      margin-bottom: 24px;
    }

    .message-section h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: #334155;
    }

    .message-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s;
    }

    .message-textarea:focus {
      outline: none;
      border-color: #2c7da0;
      box-shadow: 0 0 0 3px rgba(44, 125, 160, 0.1);
    }

    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .char-counter {
      font-size: 12px;
      color: #64748b;
    }

    .template-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .delivery-section {
      margin-bottom: 24px;
    }

    .delivery-section h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: #334155;
    }

    .delivery-options {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #2c7da0;
    }

    .preview-section {
      margin-bottom: 24px;
    }

    .preview-section h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: #334155;
    }

    .message-preview {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .preview-header {
      padding: 12px 16px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }

    .preview-content {
      padding: 16px;
      white-space: pre-line;
      line-height: 1.8;
      font-size: 14px;
    }

    .preview-footer {
      padding: 12px 16px;
      background: #f1f5f9;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .late-students-list {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr;
      background: #f8fafc;
      padding: 14px 16px;
      font-weight: 600;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
    }

    .list-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      align-items: center;
      font-size: 14px;
      transition: background 0.2s;
    }

    .list-item:hover {
      background: #fafbfc;
    }

    .list-item:last-child {
      border-bottom: none;
    }

    .list-item .student-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .amount {
      font-weight: 600;
      color: #dc2626;
    }

    .months {
      color: #f97316;
    }

    .history-filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .history-filters .form-control {
      min-width: 150px;
      flex: 1;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message-item {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s;
    }

    .message-item:hover {
      border-color: #cbd5e1;
      background: #fafbfc;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      align-items: center;
    }

    .message-type {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .message-type.individual { background: #dbeafe; color: #1e40af; }
    .message-type.bulk { background: #fae8ff; color: #7e22ce; }
    .message-type.class { background: #cffafe; color: #0e7490; }
    .message-type.payment { background: #fed7aa; color: #9a3412; }
    .message-type.absence { background: #fee2e2; color: #b91c1c; }

    .message-date {
      font-size: 12px;
      color: #64748b;
    }

    .message-content {
      margin-bottom: 12px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;
      white-space: pre-line;
      font-size: 14px;
      line-height: 1.6;
    }

    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .recipients-count {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #64748b;
    }

    .status-badge {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.success {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .form-grid {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-weight: 500;
      font-size: 14px;
      color: #334155;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .no-results {
      text-align: center;
      padding: 48px;
      color: #64748b;
    }

    .no-results p {
      margin: 0;
      font-size: 16px;
    }

    @media (max-width: 992px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .messages-dashboard {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .header-right {
        width: 100%;
        justify-content: flex-start;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .list-header, .list-item {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      .list-item .student-name {
        font-weight: 600;
      }

      .search-filters {
        flex-direction: column;
      }

      .students-grid {
        grid-template-columns: 1fr;
        max-height: 300px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .tabs-container {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .tab-button {
        flex: 0 0 auto;
        padding: 10px 14px;
        font-size: 13px;
        white-space: nowrap;
      }

      .tab-button .tab-label {
        display: none;
      }

      .tab-button .tab-icon svg {
        width: 24px;
        height: 24px;
      }

      .tab-panel {
        padding: 16px;
      }

      .message-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .template-buttons {
        justify-content: center;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
        justify-content: center;
      }

      .history-filters {
        flex-direction: column;
      }

      .delivery-options {
        flex-direction: column;
        gap: 12px;
      }

      .selection-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .selection-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 14px;
      }

      .stat-value {
        font-size: 22px;
      }

      .radio-group {
        flex-direction: column;
        gap: 8px;
      }

      .message-textarea {
        font-size: 13px;
      }
    }
  `]
})
export class MessagesDashboardEnhancedComponent implements OnInit, OnDestroy {
  // Tab state
  activeTab = 'send';
  tabs = [
    { id: 'send', label: 'إرسال رسالة', icon: 'send' },
    { id: 'class-message', label: 'رسالة لحصة', icon: 'class' },
    { id: 'reminders', label: 'تذكيرات الدفع', icon: 'reminders' },
    { id: 'history', label: 'سجل الرسائل', icon: 'history' },
    { id: 'sessions', label: 'دفع حصة محددة', icon: 'sessions' }
  ];

  // Data
  students: Student[] = [];
  filteredStudents: Student[] = [];
  allClasses: any[] = [];
  availableClasses: any[] = [];
  availableClassesList: ClassInfo[] = [];
  selectedClassStudents: any[] = [];
  classDetails: ClassInfo | null = null;
  sessionOptions: any[] = [];
  lateStudents: any[] = [];
  messageHistory: any[] = [];
  templates: MessageTemplate[] = [];

  // Search filters
  searchFilters: SearchFilters = {
    searchTerm: '',
    academicYear: 'all',
    status: 'all',
    active: 'all',
    classId: 'all'
  };

  // Selection
  selectedStudentIds: string[] = [];

  // Class message
  selectedClassId: string = '';
  classMessageContent: string = '';
  includeAllStudentsInClass: boolean = true;
  selectedClassStudentIds: string[] = [];

  // Message data
  messageContent = '';

  // Delivery options
  sendWhatsApp = true;
  sendEmail = false;

  // Session payment
  sessionPayment = {
    studentId: '',
    classId: '',
    sessionNumber: '',
    amount: null as number | null,
    paymentMethod: 'cash'
  };

  // Filters
  historyFilters = {
    type: 'all',
    startDate: '',
    endDate: ''
  };

  // Stats
  totalStudents = 0;
  totalMessages = 0;
  successRate = 0;
  latePaymentsCount = 0;

  // WhatsApp status
  whatsappConnected = false;
  whatsappNumber = '';

  // UI state
  loading = false;
  sending = false;
  paying = false;

  private searchSubject = new Subject<string>();
  private avatarColors: string[] = [
    '#2563eb', '#7c3aed', '#0891b2', '#059669',
    '#dc2626', '#d97706', '#9333ea', '#0d9488',
    '#e11d48', '#4f46e5', '#0284c7', '#16a34a',
    '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b'
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.checkWhatsAppStatus();
    this.loadClassesForMessaging();

    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.performSearch();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  getAvatarColor(name: string): string {
    const index = name.length % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  loadInitialData(): void {
    this.loading = true;
    this.loadStudents();
    this.loadClasses();
    this.loadLatePayments();
    this.loadMessageHistory();
    this.loadTemplates();
    this.loadStats();
  }

  loadStudents(): void {
    this.http.get(`${environment.apiUrl}/students`).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.students = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          this.students = res.data;
        } else {
          this.students = [];
        }
        this.totalStudents = this.students.length;
        this.filteredStudents = [...this.students];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.loading = false;
      }
    });
  }

  loadClasses(): void {
    this.http.get(`${environment.apiUrl}/classes`).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.allClasses = res.data;
        } else if (Array.isArray(res)) {
          this.allClasses = res;
        } else {
          this.allClasses = [];
        }
        this.availableClasses = this.allClasses.filter(c => c.teacher);
      },
      error: (err) => {
        console.error('Error loading classes:', err);
      }
    });
  }

  loadClassesForMessaging(): void {
    this.http.get(`${environment.apiUrl}/classes`).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.availableClassesList = res.data;
        } else if (Array.isArray(res)) {
          this.availableClassesList = res;
        } else {
          this.availableClassesList = [];
        }
      },
      error: (err) => {
        console.error('Error loading classes for messaging:', err);
        this.availableClassesList = [];
      }
    });
  }

  loadLatePayments(): void {
    this.http.get(`${environment.apiUrl}/notifications/late-payments`).subscribe({
      next: (res: any) => {
        if (res && res.students && Array.isArray(res.students)) {
          this.lateStudents = res.students;
          this.latePaymentsCount = this.lateStudents.length;
        } else if (Array.isArray(res)) {
          this.lateStudents = res;
          this.latePaymentsCount = res.length;
        } else {
          this.lateStudents = [];
        }
      },
      error: (err) => {
        console.error('Error loading late payments:', err);
        this.lateStudents = [];
      }
    });
  }

  loadMessageHistory(): void {
    let params = new HttpParams();
    if (this.historyFilters.type && this.historyFilters.type !== 'all') {
      params = params.set('type', this.historyFilters.type);
    }
    if (this.historyFilters.startDate) {
      params = params.set('startDate', this.historyFilters.startDate);
    }
    if (this.historyFilters.endDate) {
      params = params.set('endDate', this.historyFilters.endDate);
    }

    this.http.get(`${environment.apiUrl}/messages/history`, { params }).subscribe({
      next: (res: any) => {
        if (res && res.messages && Array.isArray(res.messages)) {
          this.messageHistory = res.messages;
          this.totalMessages = res.messages.length;
          this.successRate = res.stats?.successRate || 0;
        } else if (Array.isArray(res)) {
          this.messageHistory = res;
          this.totalMessages = res.length;
        } else {
          this.messageHistory = [];
        }
      },
      error: (err) => {
        console.error('Error loading message history:', err);
        this.messageHistory = [];
      }
    });
  }

  loadTemplates(): void {
    this.http.get(`${environment.apiUrl}/messages/templates`).subscribe({
      next: (res: any) => {
        if (res && res.templates && Array.isArray(res.templates)) {
          this.templates = res.templates;
        }
      },
      error: (err) => {
        console.error('Error loading templates:', err);
      }
    });
  }

  loadStats(): void {
    this.http.get(`${environment.apiUrl}/notifications/count`).subscribe({
      next: (res: any) => {
        if (res && res.count !== undefined) {
          this.latePaymentsCount = res.count;
        }
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  checkWhatsAppStatus(): void {
    this.http.get(`${environment.apiUrl}/whatsapp/status`).subscribe({
      next: (res: any) => {
        this.whatsappConnected = res.connected || false;
        this.whatsappNumber = res.number || '';
      },
      error: (err) => {
        console.error('Error checking WhatsApp status:', err);
        this.whatsappConnected = false;
      }
    });
  }

  refreshData(): void {
    this.loadInitialData();
    this.checkWhatsAppStatus();
    this.loadClassesForMessaging();
  }

  // Search methods
  onSearchChange(): void {
    this.searchSubject.next(this.searchFilters.searchTerm);
  }

  performSearch(): void {
    if (!this.searchFilters.searchTerm && this.searchFilters.academicYear === 'all' && 
        this.searchFilters.status === 'all') {
      this.filteredStudents = [...this.students];
      return;
    }

    this.filteredStudents = this.students.filter(student => {
      const matchesSearch = !this.searchFilters.searchTerm || 
        student.name.toLowerCase().includes(this.searchFilters.searchTerm.toLowerCase()) ||
        (student.studentId && student.studentId.toLowerCase().includes(this.searchFilters.searchTerm.toLowerCase())) ||
        (student.parentPhone && student.parentPhone.includes(this.searchFilters.searchTerm));

      const matchesYear = this.searchFilters.academicYear === 'all' || 
        student.academicYear === this.searchFilters.academicYear;

      const matchesStatus = this.searchFilters.status === 'all' || 
        student.status === this.searchFilters.status;

      return matchesSearch && matchesYear && matchesStatus;
    });
  }

  clearSearch(): void {
    this.searchFilters = {
      searchTerm: '',
      academicYear: 'all',
      status: 'all',
      active: 'all',
      classId: 'all'
    };
    this.filteredStudents = [...this.students];
  }

  // Student selection methods
  isSelected(studentId: string): boolean {
    return this.selectedStudentIds.includes(studentId);
  }

  toggleStudent(studentId: string): void {
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index === -1) {
      this.selectedStudentIds.push(studentId);
    } else {
      this.selectedStudentIds.splice(index, 1);
    }
  }

  selectAll(): void {
    this.selectedStudentIds = this.filteredStudents.map(s => s._id);
  }

  deselectAll(): void {
    this.selectedStudentIds = [];
  }

  canSend(): boolean {
    return this.selectedStudentIds.length > 0 && 
           this.messageContent.trim().length >= 3 && 
           !this.sending;
  }

  updateCharacterCount(): void {}

  insertTemplate(type: string): void {
    const templates: { [key: string]: string } = {
      'absence': `تحية طيبة،\n\nنود إعلامكم بأن الطالب/ة قد تغيب عن الحصة اليوم.\n\nيرجى التواصل مع إدارة المدرسة للاطلاع على تفاصيل الغياب.\n\nمع الشكر،\nإدارة المدرسة`,

      'payment': `تحية طيبة،\n\nنود تذكيركم بأن هناك دفعات متأخرة مستحقة على الطالب/ة.\n\nيرجى التوجه للإدارة لسداد المستحقات في أقرب وقت.\n\nمع الشكر،\nإدارة المدرسة`,

      'announcement': `تحية طيبة،\n\nهذا إعلان هام من إدارة المدرسة.\n\nيرجى الاطلاع على التفاصيل والتواصل مع الإدارة للاستفسار.\n\nمع الشكر،\nإدارة المدرسة`
    };

    if (templates[type]) {
      this.messageContent = templates[type];
    }
  }

  clearForm(): void {
    this.messageContent = '';
    this.selectedStudentIds = [];
    this.sendWhatsApp = true;
    this.sendEmail = false;
  }

  sendMessage(): void {
    if (!this.canSend()) return;

    this.sending = true;

    const payload = {
      studentIds: this.selectedStudentIds,
      message: this.messageContent,
      sendWhatsApp: this.sendWhatsApp,
      sendEmail: this.sendEmail
    };

    this.http.post(`${environment.apiUrl}/messages/bulk-enhanced`, payload).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert(`✅ ${res.message}`);
          this.clearForm();
          this.loadMessageHistory();
          this.loadStats();
        } else {
          alert('❌ فشل إرسال الرسالة: ' + (res?.error || 'خطأ غير معروف'));
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending message:', err);
        alert('❌ خطأ في إرسال الرسالة: ' + (err.error?.error || err.message));
      }
    });
  }

  // Class message methods
  onClassSelect(): void {
    if (!this.selectedClassId) {
      this.selectedClassStudents = [];
      this.classDetails = null;
      return;
    }
    
    this.http.get(`${environment.apiUrl}/classes/${this.selectedClassId}/message-details`).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.selectedClassStudents = res.students || [];
          this.classDetails = res.class;
        }
      },
      error: (err) => {
        console.error('Error loading class students:', err);
        this.selectedClassStudents = [];
      }
    });
  }

  onRecipientTypeChange(): void {
    if (this.includeAllStudentsInClass) {
      this.selectedClassStudentIds = [];
    }
  }

  isClassStudentSelected(studentId: string): boolean {
    return this.selectedClassStudentIds.includes(studentId);
  }

  toggleClassStudent(studentId: string): void {
    const index = this.selectedClassStudentIds.indexOf(studentId);
    if (index === -1) {
      this.selectedClassStudentIds.push(studentId);
    } else {
      this.selectedClassStudentIds.splice(index, 1);
    }
  }

  selectAllClassStudents(): void {
    this.selectedClassStudentIds = this.selectedClassStudents.map(s => s._id);
  }

  deselectAllClassStudents(): void {
    this.selectedClassStudentIds = [];
  }

  getStudentsWithPhone(): number {
    return this.selectedClassStudents.filter(s => s.parentPhone).length;
  }

  getStudentsWithEmail(): number {
    return this.selectedClassStudents.filter(s => s.parentEmail).length;
  }

  getRecipientsCount(): number {
    if (this.includeAllStudentsInClass) {
      return this.selectedClassStudents.filter(s => s.parentPhone || s.parentEmail).length;
    } else {
      return this.selectedClassStudentIds.length;
    }
  }

  updateClassMessageCount(): void {}

  insertClassTemplate(type: string): void {
    const templates: { [key: string]: string } = {
      'absence': `تحية طيبة،\n\nنود إعلامكم بأن الطالب/ة قد تغيب عن حصة ${this.classDetails?.name || ''} اليوم.\n\nيرجى التواصل مع إدارة المدرسة للاطلاع على تفاصيل الغياب.\n\nمع الشكر،\nإدارة المدرسة`,

      'payment': `تحية طيبة،\n\nنود تذكيركم بأن هناك دفعات متأخرة مستحقة على الطالب/ة في حصة ${this.classDetails?.name || ''}.\n\nيرجى التوجه للإدارة لسداد المستحقات في أقرب وقت.\n\nمع الشكر،\nإدارة المدرسة`,

      'announcement': `تحية طيبة،\n\nهذا إعلان هام بخصوص حصة ${this.classDetails?.name || ''}.\n\nيرجى الاطلاع على التفاصيل والتواصل مع الإدارة للاستفسار.\n\nمع الشكر،\nإدارة المدرسة`,

      'class': `تحية طيبة،\n\nبخصوص حصة ${this.classDetails?.name || ''} (${this.classDetails?.subject || ''})\n\nنود إعلامكم بما يلي:\n\nمع الشكر،\nإدارة المدرسة`
    };

    if (templates[type]) {
      this.classMessageContent = templates[type];
    }
  }

  clearClassForm(): void {
    this.selectedClassId = '';
    this.classMessageContent = '';
    this.includeAllStudentsInClass = true;
    this.selectedClassStudentIds = [];
    this.selectedClassStudents = [];
    this.classDetails = null;
  }

  canSendToClass(): boolean {
    if (!this.selectedClassId) return false;
    
    let hasRecipients = false;
    if (this.includeAllStudentsInClass) {
      hasRecipients = this.selectedClassStudents.some(s => s.parentPhone || s.parentEmail);
    } else {
      hasRecipients = this.selectedClassStudentIds.length > 0;
    }
    
    return hasRecipients && 
           this.classMessageContent.trim().length >= 3 && 
           !this.sending;
  }

  sendToClass(): void {
    if (!this.canSendToClass()) return;
    
    this.sending = true;
    
    const payload: any = {
      classId: this.selectedClassId,
      message: this.classMessageContent,
      sendWhatsApp: this.sendWhatsApp,
      sendEmail: this.sendEmail,
      includeAllStudents: this.includeAllStudentsInClass
    };
    
    if (!this.includeAllStudentsInClass) {
      payload.specificStudentIds = this.selectedClassStudentIds;
    }
    
    this.http.post(`${environment.apiUrl}/messages/send-to-class`, payload).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert(`✅ ${res.message}`);
          this.clearClassForm();
          this.loadMessageHistory();
          this.loadStats();
        } else {
          alert('❌ فشل إرسال الرسالة: ' + (res?.error || 'خطأ غير معروف'));
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending to class:', err);
        alert('❌ خطأ في إرسال الرسالة: ' + (err.error?.error || err.message));
      }
    });
  }

  // Payment reminder methods
  sendPaymentReminder(student: any): void {
    this.sending = true;

    const payload = {
      studentId: student._id,
      sendWhatsApp: true,
      sendEmail: false
    };

    this.http.post(`${environment.apiUrl}/messages/payment-reminder`, payload).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert(`✅ ${res.message}`);
          this.loadMessageHistory();
        } else {
          alert('❌ فشل إرسال التذكير: ' + (res?.error || 'خطأ غير معروف'));
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending reminder:', err);
        alert('❌ خطأ في إرسال التذكير: ' + (err.error?.error || err.message));
      }
    });
  }

  // Session payment methods
  loadSessionOptions(): void {
    if (!this.sessionPayment.studentId || !this.sessionPayment.classId) {
      this.sessionOptions = [];
      return;
    }

    this.http.get(`${environment.apiUrl}/payment-systems/session-history/${this.sessionPayment.studentId}?classId=${this.sessionPayment.classId}`).subscribe({
      next: (res: any) => {
        if (res && res.sessions && Array.isArray(res.sessions)) {
          this.sessionOptions = res.sessions.filter((s: any) => s.status === 'pending');
        } else {
          this.sessionOptions = [];
        }
      },
      error: (err) => {
        console.error('Error loading session options:', err);
        this.sessionOptions = [];
      }
    });
  }

  canPaySession(): boolean {
    return !!this.sessionPayment.studentId &&
           !!this.sessionPayment.classId &&
           !!this.sessionPayment.sessionNumber &&
           !this.paying;
  }

  paySession(): void {
    if (!this.canPaySession()) return;

    this.paying = true;

    const payload = {
      studentId: this.sessionPayment.studentId,
      classId: this.sessionPayment.classId,
      sessionNumber: this.sessionPayment.sessionNumber,
      amount: this.sessionPayment.amount,
      paymentMethod: this.sessionPayment.paymentMethod
    };

    this.http.post(`${environment.apiUrl}/payment-systems/specific-session`, payload).subscribe({
      next: (res: any) => {
        this.paying = false;
        if (res && res.success) {
          alert(`✅ ${res.message}`);
          this.sessionPayment = {
            studentId: '',
            classId: '',
            sessionNumber: '',
            amount: null,
            paymentMethod: 'cash'
          };
          this.sessionOptions = [];
          this.loadStats();
        } else {
          alert('❌ فشل الدفع: ' + (res?.error || 'خطأ غير معروف'));
        }
      },
      error: (err) => {
        this.paying = false;
        console.error('Error paying session:', err);
        alert('❌ خطأ في الدفع: ' + (err.error?.error || err.message));
      }
    });
  }

  // Helper methods
  getMessageTypeName(type: string): string {
    const types: any = {
      'individual': 'رسالة فردية',
      'bulk': 'رسالة جماعية',
      'class': 'رسالة حصة',
      'payment': 'تذكير دفع',
      'absence': 'إشعار غياب',
      'template': 'قالب'
    };
    return types[type] || type;
  }

  getMessageTypeClass(type: string): string {
    const classes: any = {
      'individual': 'individual',
      'bulk': 'bulk',
      'class': 'class',
      'payment': 'payment',
      'absence': 'absence',
      'template': 'bulk'
    };
    return classes[type] || 'individual';
  }
}