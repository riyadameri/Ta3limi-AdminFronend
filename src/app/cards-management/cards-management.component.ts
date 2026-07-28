// ==================== cards-management.component.ts ====================
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment.development';

interface Student {
  _id: string;
  name: string;
  studentId: string;
  parentPhone?: string;
  birthDate?: string;
  parentName?: string;
  academicYear?: string;
  schoolId?: string;
  status?: string;
  active?: boolean;
}

interface Card {
  _id: string;
  uid: string;
  student: Student | string;
  issueDate: string;
  isDetected?: boolean;
}

@Component({
  selector: 'app-cards-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ==================== CUSTOMIZABLE HEADER ==================== -->
    <div class="cards-header" [style.background]="headerBackground" [style.color]="headerTextColor">
      <div class="header-content">
        <h1>{{ headerTitle }}</h1>
        <p *ngIf="headerSubtitle" class="header-subtitle">{{ headerSubtitle }}</p>
        <div class="header-actions" *ngIf="showHeaderActions">
          <ng-content select="[header-actions]"></ng-content>
        </div>
      </div>
    </div>

    <!-- ==================== MAIN CONTAINER ==================== -->
    <div class="cards-container">
      <!-- ==================== STATISTICS SECTION ==================== -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📇</div>
          <div class="stat-info">
            <span class="stat-value">{{ cards.length }}</span>
            <span class="stat-label">إجمالي البطاقات</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-info">
            <span class="stat-value">{{ assignedCardsCount }}</span>
            <span class="stat-label">بطاقات مفعلة</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <span class="stat-value">{{ unassignedCardsCount }}</span>
            <span class="stat-label">بطاقات غير مفعلة</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-info">
            <span class="stat-value">{{ students.length }}</span>
            <span class="stat-label">إجمالي الطلاب</span>
          </div>
        </div>
      </div>

      <!-- ==================== SEARCH AND ACTIONS ==================== -->
      <div class="actions-bar">
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="search-input"
            placeholder="بحث عن بطاقة برقم UID..."
            [(ngModel)]="searchUid"
            (keyup.enter)="checkCard()"
          />
          <button class="btn btn-primary btn-sm" (click)="checkCard()">بحث</button>
        </div>
        
        <div class="action-buttons">
          <button class="btn btn-success" (click)="openAssignModal()">
            ➕ تعيين بطاقة
          </button>
          <button class="btn btn-info" (click)="startCardDetection()" [disabled]="detectionActive">
            📡 كشف بطاقة
          </button>
          <button class="btn btn-warning" *ngIf="detectionActive" (click)="stopCardDetection()">
            ⏹ إيقاف الكشف
          </button>
        </div>
      </div>

      <!-- ==================== DETECTION STATUS ==================== -->
      <div class="detection-status" *ngIf="detectionActive || detectionStatus">
        <div class="status-indicator" [class.active]="detectionActive">
          <span class="pulse-dot" *ngIf="detectionActive"></span>
          <span class="status-text">{{ detectionStatus || 'جاهز للكشف' }}</span>
        </div>
        <div class="detected-card" *ngIf="isCardDetected">
          <span class="detected-label">البطاقة المكتشفة:</span>
          <span class="detected-uid">{{ detectedCardUid }}</span>
          <button class="btn btn-sm btn-primary" (click)="resetDetection()">إعادة تعيين</button>
        </div>
      </div>

      <!-- ==================== CARDS GRID ==================== -->
      <div class="cards-grid">
        <div *ngIf="loading" class="loading-container">
          <div class="spinner"></div>
          <p>جاري تحميل البطاقات...</p>
        </div>

        <div *ngIf="!loading && cards.length === 0" class="empty-state">
          <div class="empty-icon">🃏</div>
          <h3>لا توجد بطاقات</h3>
          <p>قم بإضافة بطاقات جديدة أو تعيين بطاقات للطلاب</p>
        </div>

        <div
          *ngFor="let card of cards"
          class="card-item"
          [class.detected]="card.isDetected"
          [class.assigned]="isCardAssigned(card)"
        >
          <div class="card-header">
            <div class="card-uid">
              <span class="uid-label">UID:</span>
              <span class="uid-value">{{ card.uid }}</span>
            </div>
            <div class="card-status-badge">
              <span class="badge" [class.badge-success]="isCardAssigned(card)" [class.badge-warning]="!isCardAssigned(card)">
                {{ isCardAssigned(card) ? 'مفعلة' : 'غير مفعلة' }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="student-info" *ngIf="isCardAssigned(card)">
              <div class="student-avatar">👤</div>
              <div class="student-details">
                <div class="student-name">{{ getStudentName(card) }}</div>
                <div class="student-id" *ngIf="getStudentObject(card)">
                  <span>رقم الطالب: {{ getStudentObject(card)?.studentId }}</span>
                </div>
                <div class="student-phone" *ngIf="getStudentObject(card)?.parentPhone">
                  <span>📱 {{ getStudentObject(card)?.parentPhone }}</span>
                </div>
              </div>
            </div>
            <div class="unassigned-info" *ngIf="!isCardAssigned(card)">
              <span class="unassigned-icon">📌</span>
              <span class="unassigned-text">غير معين</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-date">📅 {{ formatDate(card.issueDate) }}</span>
            <div class="card-actions">
              <button class="btn btn-sm btn-info" (click)="viewCardDetails(card)">👁 عرض</button>
              <button class="btn btn-sm btn-primary" (click)="openAssignModal(card)" *ngIf="!isCardAssigned(card)">
                تعيين
              </button>
              <button class="btn btn-sm btn-danger" (click)="deleteCard(card._id)">🗑 حذف</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== CUSTOMIZABLE FOOTER ==================== -->
      <div class="cards-footer" [style.background]="footerBackground" [style.color]="footerTextColor">
        <div class="footer-content">
          <p *ngIf="footerText">{{ footerText }}</p>
          <div class="footer-actions" *ngIf="showFooterActions">
            <ng-content select="[footer-actions]"></ng-content>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== ASSIGN CARD MODAL ==================== -->
    <div class="modal-overlay" *ngIf="showAssignCardModal" (click)="closeModal($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ selectedCard ? 'تعيين بطاقة للطالب' : 'إنشاء بطاقة جديدة' }}</h2>
          <button class="modal-close" (click)="closeAssignModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>رقم البطاقة (UID)</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="newCardUid"
              placeholder="أدخل رقم البطاقة"
              [disabled]="!!selectedCard"
            />
            <small *ngIf="selectedCard" class="form-hint">البطاقة محددة: {{ selectedCard.uid }}</small>
          </div>

          <div class="form-group">
            <label>اختر الطالب</label>
            <input
              type="text"
              class="form-control"
              placeholder="بحث عن طالب..."
              [(ngModel)]="searchStudentTerm"
              (input)="filterStudents()"
            />
            <div class="student-list">
              <div
                *ngFor="let student of filteredStudents"
                class="student-option"
                [class.selected]="selectedStudentId === student._id"
                (click)="selectedStudentId = student._id"
              >
                <span class="student-option-name">{{ student.name }}</span>
                <span class="student-option-id">{{ student.studentId }}</span>
              </div>
              <div *ngIf="filteredStudents.length === 0" class="no-students">
                لا يوجد طلاب مطابقين
              </div>
            </div>
          </div>

          <div class="selected-student" *ngIf="selectedStudentId">
            <div class="selected-label">الطالب المختار:</div>
            <div class="selected-value">{{ getSelectedStudentName() }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeAssignModal()">إلغاء</button>
          <button class="btn btn-primary" (click)="selectedCard ? assignCardToStudent() : createCard()">
            {{ selectedCard ? 'تعيين البطاقة' : 'إنشاء البطاقة' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== CARD DETAILS MODAL ==================== -->
    <div class="modal-overlay" *ngIf="showCardDetailsModal" (click)="closeModal($event)">
      <div class="modal-container modal-details" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>تفاصيل البطاقة</h2>
          <button class="modal-close" (click)="closeDetailsModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedCard">
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">UID</span>
              <span class="detail-value highlight">{{ selectedCard.uid }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الحالة</span>
              <span class="detail-value">
                <span class="badge" [class.badge-success]="isCardAssigned(selectedCard)" [class.badge-warning]="!isCardAssigned(selectedCard)">
                  {{ isCardAssigned(selectedCard) ? 'مفعلة' : 'غير مفعلة' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">تاريخ الإصدار</span>
              <span class="detail-value">{{ formatDate(selectedCard.issueDate) }}</span>
            </div>
            <div class="detail-item full-width" *ngIf="isCardAssigned(selectedCard)">
              <span class="detail-label">الطالب</span>
              <span class="detail-value">{{ getStudentName(selectedCard) }}</span>
            </div>
            <div class="detail-item full-width" *ngIf="getStudentObject(selectedCard)">
              <span class="detail-label">رقم الطالب</span>
              <span class="detail-value">{{ getStudentObject(selectedCard)?.studentId }}</span>
            </div>
            <div class="detail-item full-width" *ngIf="getStudentObject(selectedCard)?.parentPhone">
              <span class="detail-label">رقم ولي الأمر</span>
              <span class="detail-value">{{ getStudentObject(selectedCard)?.parentPhone }}</span>
            </div>
            <div class="detail-item full-width" *ngIf="getStudentObject(selectedCard)?.academicYear">
              <span class="detail-label">السنة الدراسية</span>
              <span class="detail-value">{{ getStudentObject(selectedCard)?.academicYear }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeDetailsModal()">إغلاق</button>
          <button class="btn btn-danger" *ngIf="selectedCard && isCardAssigned(selectedCard)" (click)="unassignCard(selectedCard._id); closeDetailsModal()">
            إلغاء التعيين
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==================== CSS VARIABLES ==================== */
    :host {
      --primary-color: #667eea;
      --primary-dark: #5a67d8;
      --secondary-color: #764ba2;
      --success-color: #48bb78;
      --warning-color: #ed8936;
      --danger-color: #fc8181;
      --info-color: #4299e1;
      
      --bg-gradient-start: #667eea;
      --bg-gradient-end: #764ba2;
      
      --text-primary: #2d3748;
      --text-secondary: #4a5568;
      --text-light: #a0aec0;
      
      --bg-white: #ffffff;
      --bg-light: #f7fafc;
      --bg-hover: #edf2f7;
      
      --border-color: #e2e8f0;
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.08);
      --shadow-md: 0 4px 16px rgba(0,0,0,0.12);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.16);
      
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ==================== GLOBAL RESET ==================== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* ==================== HEADER ==================== */
    .cards-header {
      background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
      color: white;
      padding: 24px 32px;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      box-shadow: var(--shadow-md);
    }

    .header-content h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 6px;
    }

    .header-actions {
      margin-top: 12px;
    }

    /* ==================== CONTAINER ==================== */
    .cards-container {
      background: var(--bg-light);
      padding: 24px 32px 32px;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      min-height: 600px;
      box-shadow: var(--shadow-md);
      position: relative;
    }

    /* ==================== STATISTICS ==================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--bg-white);
      padding: 20px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
      border: 1px solid var(--border-color);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      font-size: 32px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-light);
      border-radius: var(--radius-sm);
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-light);
      font-weight: 500;
    }

    /* ==================== ACTIONS BAR ==================== */
    .actions-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
    }

    .search-container {
      flex: 1;
      display: flex;
      align-items: center;
      background: var(--bg-white);
      border-radius: var(--radius-md);
      padding: 4px 4px 4px 12px;
      border: 2px solid var(--border-color);
      transition: var(--transition);
      min-width: 200px;
    }

    .search-container:focus-within {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .search-icon {
      color: var(--text-light);
      margin-right: 8px;
    }

    .search-input {
      flex: 1;
      border: none;
      padding: 10px 0;
      font-size: 14px;
      background: transparent;
      outline: none;
      color: var(--text-primary);
    }

    .search-input::placeholder {
      color: var(--text-light);
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* ==================== BUTTONS ==================== */
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .btn:active {
      transform: translateY(0);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-success {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
    }

    .btn-danger {
      background: linear-gradient(135deg, #fc8181, #e53e3e);
      color: white;
    }

    .btn-warning {
      background: linear-gradient(135deg, #ed8936, #dd6b20);
      color: white;
    }

    .btn-info {
      background: linear-gradient(135deg, #4299e1, #3182ce);
      color: white;
    }

    .btn-sm {
      padding: 6px 14px;
      font-size: 12px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    /* ==================== DETECTION STATUS ==================== */
    .detection-status {
      background: var(--bg-white);
      padding: 16px 20px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      border: 2px solid var(--border-color);
      transition: var(--transition);
    }

    .detection-status.active {
      border-color: var(--success-color);
      background: #f0fff4;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--success-color);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .status-text {
      font-weight: 500;
      color: var(--text-primary);
    }

    .detected-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ebf8ff;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
    }

    .detected-label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .detected-uid {
      font-family: monospace;
      font-weight: 700;
      color: var(--primary-color);
      font-size: 16px;
    }

    /* ==================== CARDS GRID ==================== */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .loading-container {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 24px;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .empty-state p {
      color: var(--text-light);
      font-size: 14px;
    }

    /* ==================== CARD ITEM ==================== */
    .card-item {
      background: var(--bg-white);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: var(--transition);
      border: 2px solid var(--border-color);
      position: relative;
    }

    .card-item:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--primary-color);
    }

    .card-item.detected {
      border-color: var(--success-color);
      box-shadow: 0 0 0 4px rgba(72, 187, 120, 0.2);
    }

    .card-item.assigned {
      border-color: var(--success-color);
    }

    .card-header {
      padding: 16px 20px;
      background: var(--bg-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }

    .card-uid {
      font-size: 14px;
    }

    .uid-label {
      color: var(--text-light);
      font-weight: 500;
    }

    .uid-value {
      font-family: monospace;
      font-weight: 600;
      color: var(--text-primary);
      margin-left: 4px;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-success {
      background: #c6f6d5;
      color: #276749;
    }

    .badge-warning {
      background: #fefcbf;
      color: #975a16;
    }

    .card-body {
      padding: 16px 20px;
      min-height: 80px;
      display: flex;
      align-items: center;
    }

    .student-info {
      display: flex;
      gap: 14px;
      align-items: center;
      width: 100%;
    }

    .student-avatar {
      font-size: 36px;
      width: 48px;
      height: 48px;
      background: var(--bg-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .student-details {
      flex: 1;
    }

    .student-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 15px;
    }

    .student-id, .student-phone {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .unassigned-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-light);
      font-weight: 500;
    }

    .unassigned-icon {
      font-size: 24px;
    }

    .unassigned-text {
      font-size: 14px;
    }

    .card-footer {
      padding: 12px 20px;
      background: var(--bg-light);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .card-date {
      font-size: 12px;
      color: var(--text-light);
    }

    .card-actions {
      display: flex;
      gap: 6px;
    }

    /* ==================== FOOTER ==================== */
    .cards-footer {
      background: linear-gradient(135deg, var(--bg-gradient-end), var(--bg-gradient-start));
      color: white;
      padding: 16px 24px;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      margin-top: 24px;
    }

    .footer-content {
      text-align: center;
      font-size: 13px;
      opacity: 0.9;
    }

    .footer-actions {
      margin-top: 8px;
    }

    /* ==================== MODALS ==================== */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-container {
      background: var(--bg-white);
      border-radius: var(--radius-lg);
      max-width: 560px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .modal-container.modal-details {
      max-width: 480px;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-light);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .modal-header h2 {
      font-size: 20px;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-light);
      transition: var(--transition);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      line-height: 1;
    }

    .modal-close:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--bg-light);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }

    /* ==================== FORM ==================== */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 14px;
      transition: var(--transition);
      background: var(--bg-white);
      color: var(--text-primary);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control:disabled {
      background: var(--bg-light);
      cursor: not-allowed;
    }

    .form-hint {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: var(--text-light);
    }

    .student-list {
      max-height: 200px;
      overflow-y: auto;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-sm);
      margin-top: 8px;
    }

    .student-option {
      padding: 10px 14px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
    }

    .student-option:last-child {
      border-bottom: none;
    }

    .student-option:hover {
      background: var(--bg-hover);
    }

    .student-option.selected {
      background: #ebf8ff;
      border-right: 4px solid var(--primary-color);
    }

    .student-option-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .student-option-id {
      font-size: 12px;
      color: var(--text-light);
    }

    .no-students {
      padding: 16px;
      text-align: center;
      color: var(--text-light);
    }

    .selected-student {
      margin-top: 12px;
      padding: 12px 16px;
      background: #ebf8ff;
      border-radius: var(--radius-sm);
      border-right: 4px solid var(--primary-color);
    }

    .selected-label {
      font-size: 12px;
      color: var(--text-light);
    }

    .selected-value {
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 2px;
    }

    /* ==================== DETAILS ==================== */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-label {
      font-size: 12px;
      color: var(--text-light);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 15px;
      color: var(--text-primary);
      font-weight: 500;
    }

    .detail-value.highlight {
      font-family: monospace;
      color: var(--primary-color);
      font-size: 16px;
    }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 768px) {
      .cards-header {
        padding: 18px 20px;
      }
      .header-content h1 {
        font-size: 22px;
      }
      .cards-container {
        padding: 16px;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .actions-bar {
        flex-direction: column;
      }
      .search-container {
        width: 100%;
      }
      .action-buttons {
        width: 100%;
      }
      .action-buttons .btn {
        flex: 1;
        justify-content: center;
      }
      .cards-grid {
        grid-template-columns: 1fr;
      }
      .detection-status {
        flex-direction: column;
        align-items: stretch;
      }
      .detected-card {
        flex-wrap: wrap;
      }
      .modal-container {
        margin: 10px;
        max-height: 95vh;
      }
      .details-grid {
        grid-template-columns: 1fr;
      }
      .card-footer {
        flex-direction: column;
        align-items: stretch;
      }
      .card-actions {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .stat-card {
        padding: 14px;
      }
      .stat-value {
        font-size: 18px;
      }
      .modal-header h2 {
        font-size: 17px;
      }
      .card-item {
        border-radius: var(--radius-sm);
      }
    }

    /* ==================== SCROLLBAR STYLING ==================== */
    .student-list::-webkit-scrollbar,
    .modal-container::-webkit-scrollbar {
      width: 6px;
    }

    .student-list::-webkit-scrollbar-track,
    .modal-container::-webkit-scrollbar-track {
      background: var(--bg-light);
      border-radius: 3px;
    }

    .student-list::-webkit-scrollbar-thumb,
    .modal-container::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;
    }

    .student-list::-webkit-scrollbar-thumb:hover,
    .modal-container::-webkit-scrollbar-thumb:hover {
      background: var(--text-light);
    }
  `]
})
export class CardsManagementComponent implements OnInit, OnDestroy {
  // ==================== CUSTOMIZABLE INPUTS ====================
  @Input() headerTitle: string = 'إدارة البطاقات';
  @Input() headerSubtitle: string = 'إدارة بطاقات الطلاب الإلكترونية';
  @Input() headerBackground: string = 'linear-gradient(135deg, #667eea, #764ba2)';
  @Input() headerTextColor: string = '#ffffff';
  @Input() showHeaderActions: boolean = true;
  
  @Input() footerText: string = 'جميع الحقوق محفوظة © 2024 - نظام إدارة البطاقات';
  @Input() footerBackground: string = 'linear-gradient(135deg, #764ba2, #667eea)';
  @Input() footerTextColor: string = '#ffffff';
  @Input() showFooterActions: boolean = false;

  // ==================== DATA PROPERTIES ====================
  cards: Card[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];
  loading = false;
  detectionActive = false;
  detectionInterval: any;
  
  // Modal states
  showAssignCardModal = false;
  showCardDetailsModal = false;
  
  // Form data
  selectedCard: Card | null = null;
  selectedStudentId = '';
  newCardUid = '';
  searchUid = '';
  searchStudentTerm = '';
  
  // Card detection
  detectedCardUid = '';
  isCardDetected = false;
  detectionStatus = '';

  // School ID
  private schoolId: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    console.log('CardsManagementComponent initialized');
    
    // Get schoolId from localStorage
    this.schoolId = localStorage.getItem('schoolId') || null;
    console.log('🏫 School ID from localStorage:', this.schoolId);
    
    this.loadCards();
    this.loadStudents();
  }

  ngOnDestroy() {
    this.stopCardDetection();
  }

  // ==================== COMPUTED PROPERTIES ====================
  get assignedCardsCount(): number {
    return this.cards.filter(card => this.isCardAssigned(card)).length;
  }

  get unassignedCardsCount(): number {
    return this.cards.filter(card => !this.isCardAssigned(card)).length;
  }

  // ==================== HEADER HELPERS ====================
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== CARD OPERATIONS ====================
  isCardAssigned(card: Card): boolean {
    return card.student !== null && typeof card.student === 'object';
  }

  getStudentName(card: Card): string {
    if (typeof card.student === 'object' && card.student !== null) {
      return card.student.name;
    }
    return 'غير معين';
  }

  getStudentObject(card: Card): Student | null {
    if (typeof card.student === 'object' && card.student !== null) {
      return card.student;
    }
    return null;
  }

  getSelectedStudentName(): string {
    const student = this.students.find(s => s._id === this.selectedStudentId);
    return student ? student.name : '';
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  // ==================== API CALLS (محدثة مع schoolId) ====================
  
  loadCards() {
    this.loading = true;
    console.log('Loading cards...');
    
    // إضافة schoolId إلى الطلب
    let url = `${environment.apiUrl}/cards`;
    const params = new HttpParams();
    
    if (this.schoolId) {
      url += `?schoolId=${this.schoolId}`;
    }
    
    console.log('🔍 Loading cards from:', url);
    
    this.http.get<Card[]>(url, { headers: this.getHeaders() })
      .pipe(catchError(error => {
        console.error('Error loading cards:', error);
        this.showError('حدث خطأ أثناء تحميل البطاقات');
        return of([]);
      }))
      .subscribe({
        next: (cards) => {
          this.cards = cards || [];
          this.loading = false;
          console.log(`Loaded ${this.cards.length} cards`);
        },
        error: () => {
          this.cards = [];
          this.loading = false;
        }
      });
  }

  loadStudents() {
    console.log('Loading students...');
    
    // إضافة schoolId إلى الطلب
    let url = `${environment.apiUrl}/students`;
    if (this.schoolId) {
      url += `?schoolId=${this.schoolId}`;
    }
    
    console.log('🔍 Loading students from:', url);
    
    this.http.get<Student[]>(url, { headers: this.getHeaders() })
      .pipe(catchError(error => {
        console.error('Error loading students:', error);
        this.showError('حدث خطأ أثناء تحميل الطلاب');
        return of([]);
      }))
      .subscribe({
        next: (students) => {
          this.students = students || [];
          this.filteredStudents = this.students;
          console.log(`Loaded ${this.students.length} students`);
        },
        error: () => {
          this.students = [];
          this.filteredStudents = [];
        }
      });
  }

  createCard() {
    if (!this.newCardUid.trim()) {
      this.showError('يرجى إدخال رقم البطاقة');
      return;
    }

    // إضافة schoolId إلى البيانات
    const cardData: any = { 
      uid: this.newCardUid,
      student: this.selectedStudentId || null
    };
    
    if (this.schoolId) {
      cardData.schoolId = this.schoolId;
    }

    console.log('Creating card:', cardData);
    
    this.http.post<Card>(`${environment.apiUrl}/cards`, cardData, { headers: this.getHeaders() })
      .pipe(catchError(error => {
        console.error('Error creating card:', error);
        this.showError(error.error?.error || 'حدث خطأ أثناء إنشاء البطاقة');
        return throwError(() => new Error('Creation failed'));
      }))
      .subscribe({
        next: () => {
          this.showSuccess('تم إنشاء البطاقة بنجاح');
          this.resetCardForm();
          this.loadCards();
          this.closeAssignModal();
        },
        error: () => {}
      });
  }

  assignCardToStudent() {
    if (!this.selectedCard || !this.selectedStudentId) {
      this.showError('يرجى اختيار بطاقة وطالب');
      return;
    }

    // إضافة schoolId إلى البيانات
    const updateData: any = { 
      student: this.selectedStudentId 
    };
    
    if (this.schoolId) {
      updateData.schoolId = this.schoolId;
    }

    console.log(`Assigning card ${this.selectedCard._id} to student ${this.selectedStudentId}`);
    
    this.http.put<Card>(`${environment.apiUrl}/cards/${this.selectedCard._id}`, updateData, { headers: this.getHeaders() })
      .pipe(catchError(error => {
        console.error('Error assigning card:', error);
        this.showError(error.error?.error || 'حدث خطأ أثناء تعيين البطاقة');
        return throwError(() => new Error('Assignment failed'));
      }))
      .subscribe({
        next: () => {
          this.showSuccess('تم تعيين البطاقة للطالب بنجاح');
          this.resetCardForm();
          this.loadCards();
          this.closeAssignModal();
        },
        error: () => {}
      });
  }

  unassignCard(cardId: string) {
    if (!confirm('هل تريد إلغاء تعيين البطاقة من الطالب؟')) {
      return;
    }

    console.log(`Unassigning card ${cardId}`);
    
    // إضافة schoolId إلى البيانات
    const updateData: any = { student: null };
    if (this.schoolId) {
      updateData.schoolId = this.schoolId;
    }
    
    this.http.put(`${environment.apiUrl}/cards/${cardId}`, updateData, { headers: this.getHeaders() })
      .pipe(catchError(error => {
        console.error('Error unassigning card:', error);
        this.showError(error.error?.error || 'حدث خطأ أثناء إلغاء تعيين البطاقة');
        return throwError(() => new Error('Unassignment failed'));
      }))
      .subscribe({
        next: () => {
          this.showSuccess('تم إلغاء تعيين البطاقة بنجاح');
          this.loadCards();
        },
        error: () => {}
      });
  }

  deleteCard(cardId: string) {
    if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
      return;
    }

    console.log(`Deleting card ${cardId}`);
    
    let url = `${environment.apiUrl}/cards/${cardId}`;
    if (this.schoolId) {
      url += `?schoolId=${this.schoolId}`;
    }
    
    this.http.delete(url, { headers: this.getHeaders() })
      .pipe(catchError(error => {
        console.error('Error deleting card:', error);
        this.showError(error.error?.error || 'حدث خطأ أثناء حذف البطاقة');
        return throwError(() => new Error('Deletion failed'));
      }))
      .subscribe({
        next: () => {
          this.showSuccess('تم حذف البطاقة بنجاح');
          this.loadCards();
        },
        error: () => {}
      });
  }

  checkCard() {
    if (!this.searchUid.trim()) {
      this.showError('يرجى إدخال رقم البطاقة');
      return;
    }

    console.log(`Checking card UID: ${this.searchUid}`);
    
    let url = `${environment.apiUrl}/cards/uid/${this.searchUid}`;
    if (this.schoolId) {
      url += `?schoolId=${this.schoolId}`;
    }
    
    this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(catchError(error => {
        console.error('Error checking card:', error);
        this.showError('البطاقة غير مسجلة');
        return throwError(() => new Error('Card not found'));
      }))
      .subscribe({
        next: (result) => {
          if (result.student) {
            this.showSuccess(`البطاقة مسجلة باسم: ${result.student.name} (${result.student.studentId})`);
          } else {
            this.showInfo('البطاقة موجودة ولكنها غير مسجلة لطالب');
          }
        },
        error: () => {}
      });
  }

  // ==================== CARD DETECTION ====================
  startCardDetection() {
    this.detectionActive = true;
    this.detectionStatus = 'جاري البحث عن بطاقة...';
    
    this.detectionInterval = setInterval(() => {
      if (this.detectionActive && !this.isCardDetected) {
        this.detectedCardUid = 'CARD-' + Math.random().toString(36).substr(2, 8).toUpperCase();
        this.isCardDetected = true;
        this.detectionStatus = `تم اكتشاف البطاقة: ${this.detectedCardUid}`;
        this.newCardUid = this.detectedCardUid;
        
        const existingCard = this.cards.find(card => card.uid === this.detectedCardUid);
        if (existingCard) {
          existingCard.isDetected = true;
          setTimeout(() => {
            if (existingCard) existingCard.isDetected = false;
          }, 2000);
        }
      }
    }, 3000);
  }

  stopCardDetection() {
    this.detectionActive = false;
    this.isCardDetected = false;
    this.detectedCardUid = '';
    this.detectionStatus = '';
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  resetDetection() {
    this.isCardDetected = false;
    this.detectedCardUid = '';
    this.detectionStatus = 'جاهز للكشف عن بطاقة جديدة';
  }

  // ==================== MODAL OPERATIONS ====================
  openAssignModal(card?: Card) {
    this.selectedCard = card || null;
    this.selectedStudentId = '';
    this.searchStudentTerm = '';
    this.filteredStudents = this.students;
    
    if (!card) {
      this.newCardUid = '';
    } else {
      this.newCardUid = card.uid;
    }
    
    this.showAssignCardModal = true;
  }

  closeAssignModal() {
    this.showAssignCardModal = false;
    this.resetCardForm();
  }

  viewCardDetails(card: Card) {
    this.selectedCard = card;
    this.showCardDetailsModal = true;
  }

  closeDetailsModal() {
    this.showCardDetailsModal = false;
    this.selectedCard = null;
  }

  closeModal(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeAssignModal();
      this.closeDetailsModal();
    }
  }

  // ==================== FILTERS ====================
  filterStudents() {
    if (!this.searchStudentTerm.trim()) {
      this.filteredStudents = this.students;
      return;
    }
    
    const term = this.searchStudentTerm.toLowerCase();
    this.filteredStudents = this.students.filter(student => 
      student.name.toLowerCase().includes(term) ||
      student.studentId.toLowerCase().includes(term) ||
      (student.parentPhone && student.parentPhone.toLowerCase().includes(term))
    );
  }

  // ==================== HELPERS ====================
  resetCardForm() {
    this.selectedCard = null;
    this.selectedStudentId = '';
    this.newCardUid = '';
    this.searchStudentTerm = '';
    this.filteredStudents = this.students;
  }

  private showSuccess(message: string) {
    alert('✅ ' + message);
  }

  private showError(message: string) {
    alert('❌ ' + message);
  }

  private showInfo(message: string) {
    alert('ℹ️ ' + message);
  }
}