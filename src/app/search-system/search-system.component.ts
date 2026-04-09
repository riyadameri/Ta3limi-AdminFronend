import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subject, takeUntil } from 'rxjs';

import { environment } from '../../environments/environment.development';
// واجهات البيانات
interface Student {
  _id: string;
  name: string;
  studentId: string;
  academicYear: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  status: string;
  active: boolean;
  registrationDate: string;
  classes?: any[];
}

interface Teacher {
  _id: string;
  name: string;
  subjects: string[];
  phone: string;
  email: string;
  active: boolean;
  hireDate: string;
}

interface Class {
  _id: string;
  name: string;
  subject: string;
  academicYear: string;
  teacher: Teacher;
  price: number;
  students: Student[];
  schedule: any[];
}

interface Payment {
  _id: string;
  student: Student;
  class: Class;
  amount: number;
  month: string;
  monthCode: string;
  status: 'paid' | 'pending' | 'late';
  paymentDate: string | null;
  paymentMethod: string;
  invoiceNumber: string;
  createdAt: string;
}

interface Card {
  _id: string;
  uid: string;
  student: Student;
  issueDate: string;
}

interface SearchResult {
  type: 'student' | 'teacher' | 'class' | 'payment' | 'card';
  typeAr: string;
  icon: string;
  iconClass: string;
  data: any;
  relevanceScore: number;
}

@Component({
  selector: 'app-search-system',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="search-system-container">
      <!-- Header -->
      <div class="search-header">
        <div class="header-content">
          <div class="logo-area">
            <i class="fas fa-search"></i>
            <h1>نظام البحث المتكامل</h1>
          </div>
          <p class="subtitle">ابحث عن الطلاب، الأساتذة، الحصص، المدفوعات، والبطاقات في مكان واحد</p>
        </div>
      </div>

      <!-- Search Card -->
      <div class="search-card">
        <!-- Search Input Area -->
        <div class="search-input-area">
          <div class="search-wrapper">
            <div class="search-input-group">
              <i class="fas fa-search"></i>
              <input 
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                placeholder="ابحث بالاسم، رقم الهاتف، المعرف، البريد الإلكتروني، أو UID البطاقة..."
                class="search-input"
                [class.loading]="isLoading"
                autofocus>
              <div class="loading-indicator" *ngIf="isLoading">
                <i class="fas fa-circle-notch fa-spin"></i>
              </div>
            </div>
            
            <!-- Filter Chips -->
            <div class="filter-chips">
              <button 
                *ngFor="let filter of filters"
                class="filter-chip"
                [class.active]="activeFilter === filter.value"
                (click)="setFilter(filter.value)">
                <i [class]="filter.icon"></i>
                {{ filter.label }}
                <span class="filter-count" *ngIf="getFilterCount(filter.value) > 0">
                  {{ getFilterCount(filter.value) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Advanced Filters Toggle -->
          <div class="advanced-toggle" (click)="toggleAdvancedFilters()">
            <i class="fas" [class.fa-chevron-up]="showAdvancedFilters" [class.fa-chevron-down]="!showAdvancedFilters"></i>
            <span>فلاتر متقدمة</span>
          </div>

          <!-- Advanced Filters Panel -->
          <div class="advanced-filters" [class.show]="showAdvancedFilters">
            <div class="filters-grid">
              <div class="filter-group">
                <label><i class="fas fa-graduation-cap"></i> السنة الدراسية</label>
                <select [(ngModel)]="filtersData.academicYear" (change)="performSearch()" class="filter-select">
                  <option value="">الكل</option>
                  <option value="1AS">1AS</option>
                  <option value="2AS">2AS</option>
                  <option value="3AS">3AS</option>
                  <option value="1MS">1MS</option>
                  <option value="2MS">2MS</option>
                  <option value="3MS">3MS</option>
                  <option value="4MS">4MS</option>
                  <option value="5MS">5MS</option>
                  <option value="1AP">1AP</option>
                  <option value="2AP">2AP</option>
                  <option value="3AP">3AP</option>
                  <option value="4AP">4AP</option>
                  <option value="5AP">5AP</option>
                </select>
              </div>
              <div class="filter-group">
                <label><i class="fas fa-book"></i> المادة</label>
                <select [(ngModel)]="filtersData.subject" (change)="performSearch()" class="filter-select">
                  <option value="">الكل</option>
                  <option value="رياضيات">رياضيات</option>
                  <option value="فيزياء">فيزياء</option>
                  <option value="علوم">علوم</option>
                  <option value="لغة عربية">لغة عربية</option>
                  <option value="لغة فرنسية">لغة فرنسية</option>
                  <option value="لغة انجليزية">لغة انجليزية</option>
                  <option value="تاريخ">تاريخ</option>
                  <option value="جغرافيا">جغرافيا</option>
                  <option value="فلسفة">فلسفة</option>
                  <option value="إعلام آلي">إعلام آلي</option>
                </select>
              </div>
              <div class="filter-group">
                <label><i class="fas fa-chart-line"></i> حالة الدفع</label>
                <select [(ngModel)]="filtersData.paymentStatus" (change)="performSearch()" class="filter-select">
                  <option value="">الكل</option>
                  <option value="paid">مدفوع</option>
                  <option value="pending">معلق</option>
                  <option value="late">متأخر</option>
                </select>
              </div>
              <div class="filter-group">
                <label><i class="fas fa-user-check"></i> حالة الطالب</label>
                <select [(ngModel)]="filtersData.studentStatus" (change)="performSearch()" class="filter-select">
                  <option value="">الكل</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="pending">قيد الانتظار</option>
                </select>
              </div>
              <div class="filter-group">
                <label><i class="fas fa-chalkboard-user"></i> حالة الأستاذ</label>
                <select [(ngModel)]="filtersData.teacherStatus" (change)="performSearch()" class="filter-select">
                  <option value="">الكل</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Stats -->
        <div class="results-stats" *ngIf="totalResults > 0 || searchTerm">
          <div class="stats-info">
            <div class="stat-badge">
              <i class="fas fa-list"></i>
              <span>النتائج: </span>
              <strong>{{ totalResults }}</strong>
            </div>
            <div class="stat-badge" *ngIf="resultsCount.students > 0">
              <i class="fas fa-user-graduate"></i>
              <span>الطلاب: </span>
              <strong>{{ resultsCount.students }}</strong>
            </div>
            <div class="stat-badge" *ngIf="resultsCount.teachers > 0">
              <i class="fas fa-chalkboard-user"></i>
              <span>الأساتذة: </span>
              <strong>{{ resultsCount.teachers }}</strong>
            </div>
            <div class="stat-badge" *ngIf="resultsCount.classes > 0">
              <i class="fas fa-book-open"></i>
              <span>الحصص: </span>
              <strong>{{ resultsCount.classes }}</strong>
            </div>
            <div class="stat-badge" *ngIf="resultsCount.payments > 0">
              <i class="fas fa-coins"></i>
              <span>المدفوعات: </span>
              <strong>{{ resultsCount.payments }}</strong>
            </div>
            <div class="stat-badge" *ngIf="resultsCount.cards > 0">
              <i class="fas fa-id-card"></i>
              <span>البطاقات: </span>
              <strong>{{ resultsCount.cards }}</strong>
            </div>
          </div>
          <button class="clear-search" (click)="clearSearch()" *ngIf="searchTerm">
            <i class="fas fa-times-circle"></i> مسح البحث
          </button>
        </div>

        <!-- Results Grid -->
        <div class="results-grid">
          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoading">
            <div class="spinner"></div>
            <p>جاري البحث...</p>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="!isLoading && totalResults === 0 && searchTerm">
            <i class="fas fa-search"></i>
            <h3>لا توجد نتائج</h3>
            <p>لم يتم العثور على نتائج مطابقة لـ "{{ searchTerm }}"</p>
            <button class="suggest-btn" (click)="clearSearch()">
              <i class="fas fa-eraser"></i> مسح البحث
            </button>
          </div>

          <!-- Initial State -->
          <div class="empty-state" *ngIf="!isLoading && totalResults === 0 && !searchTerm">
            <i class="fas fa-search"></i>
            <h3>ابحث عن أي شيء</h3>
            <p>اكتب كلمة البحث في الأعلى للبدء</p>
            <div class="search-suggestions">
              <span>مثال: </span>
              <button class="suggestion-chip" (click)="searchTerm = 'محمد'; performSearch()">محمد</button>
              <button class="suggestion-chip" (click)="searchTerm = 'رياضيات'; performSearch()">رياضيات</button>
              <button class="suggestion-chip" (click)="searchTerm = '0555'; performSearch()">رقم هاتف</button>
            </div>
          </div>

          <!-- Results List -->
          <div class="results-list" *ngIf="!isLoading && filteredResults.length > 0">
            <div 
              *ngFor="let result of filteredResults"
              class="result-card"
              (click)="onResultClick(result)"
              [class]="result.type">
              
              <div class="card-header">
                <div class="card-title">
                  <div class="card-icon" [class]="result.iconClass">
                    <i [class]="result.icon"></i>
                  </div>
                  <div>
                    <h3 class="card-name">{{ getResultTitle(result) }}</h3>
                    <span class="card-type" [class]="result.type">{{ result.typeAr }}</span>
                  </div>
                </div>
                <div class="quick-actions">
                  <button class="quick-action-btn" (click)="$event.stopPropagation(); viewDetails(result)">
                    <i class="fas fa-eye"></i>
                    <span>تفاصيل</span>
                  </button>
                </div>
              </div>

              <div class="card-details">
                <div *ngFor="let detail of getResultDetails(result)" class="detail-item">
                  <i [class]="detail.icon"></i>
                  <span class="label">{{ detail.label }}:</span>
                  <span class="value" [innerHTML]="detail.value | highlight: searchTerm"></span>
                </div>
              </div>

              <!-- Extra Info based on type -->
              <div class="card-footer" *ngIf="result.type === 'payment'">
                <div class="status-badge" [class]="result.data.status">
                  <i class="fas" [class.fa-check-circle]="result.data.status === 'paid'" [class.fa-clock]="result.data.status === 'pending'" [class.fa-exclamation-triangle]="result.data.status === 'late'"></i>
                  {{ result.data.status === 'paid' ? 'مدفوع' : result.data.status === 'pending' ? 'معلق' : 'متأخر' }}
                </div>
              </div>

              <div class="card-footer" *ngIf="result.type === 'student'">
                <div class="status-badge" [class]="result.data.status">
                  <i class="fas" [class.fa-check-circle]="result.data.status === 'active'" [class.fa-clock]="result.data.status === 'pending'" [class.fa-ban]="result.data.status === 'inactive'"></i>
                  {{ result.data.status === 'active' ? 'نشط' : result.data.status === 'pending' ? 'قيد الانتظار' : 'غير نشط' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" *ngIf="selectedResult" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ getResultTitle(selectedResult) }}</h2>
          <button class="modal-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="detail-section" *ngFor="let detail of getResultDetails(selectedResult)">
            <div class="detail-row">
              <div class="detail-label"><i [class]="detail.icon"></i> {{ detail.label }}</div>
              <div class="detail-value">{{ detail.value }}</div>
            </div>
          </div>
          
          <!-- Student specific extra info -->
          <div class="detail-section" *ngIf="selectedResult.type === 'student' && selectedResult.data.classes?.length">
            <h3><i class="fas fa-book"></i> الحصص المسجل فيها</h3>
            <div class="classes-list">
              <span *ngFor="let classItem of selectedResult.data.classes" class="class-tag">
                {{ classItem.name }}
              </span>
            </div>
          </div>

          <!-- Teacher specific extra info -->
          <div class="detail-section" *ngIf="selectedResult.type === 'teacher'">
            <h3><i class="fas fa-chalkboard"></i> المواد التي يدرسها</h3>
            <div class="subjects-list">
              <span *ngFor="let subject of selectedResult.data.subjects" class="subject-tag">
                {{ subject }}
              </span>
            </div>
          </div>

          <!-- Class specific extra info -->
          <div class="detail-section" *ngIf="selectedResult.type === 'class'">
            <h3><i class="fas fa-users"></i> الطلاب المسجلين ({{ selectedResult.data.students?.length || 0 }})</h3>
            <div class="students-list">
              <div *ngFor="let student of selectedResult.data.students" class="student-mini">
                <i class="fas fa-user-graduate"></i>
                <span>{{ student.name }}</span>
                <span class="student-id">{{ student.studentId }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeModal()">إغلاق</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-system-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .search-header {
      text-align: center;
      margin-bottom: 30px;
      color: white;
    }

    .header-content {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 30px;
      padding: 25px;
    }

    .logo-area {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 10px;
    }

    .logo-area i {
      font-size: 2.5rem;
    }

    .logo-area h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }

    .subtitle {
      font-size: 1rem;
      opacity: 0.9;
    }

    /* Search Card */
    .search-card {
      background: white;
      border-radius: 28px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
    }

    /* Search Input Area */
    .search-input-area {
      padding: 25px 30px;
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      border-bottom: 1px solid #eef2f6;
    }

    .search-wrapper {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 20px;
    }

    .search-input-group {
      flex: 1;
      position: relative;
      min-width: 250px;
    }

    .search-input-group i {
      position: absolute;
      right: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: #a0aec0;
      font-size: 1.2rem;
    }

    .search-input {
      width: 100%;
      padding: 16px 50px 16px 20px;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
    }

    .search-input.loading {
      padding-right: 70px;
    }

    .loading-indicator {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: #667eea;
    }

    /* Filter Chips */
    .filter-chips {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-chip {
      padding: 8px 18px;
      border: none;
      border-radius: 40px;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f1f5f9;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-chip i {
      font-size: 0.85rem;
    }

    .filter-chip.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102,126,234,0.3);
    }

    .filter-chip:hover:not(.active) {
      background: #e2e8f0;
      transform: translateY(-1px);
    }

    .filter-count {
      background: rgba(255,255,255,0.3);
      border-radius: 20px;
      padding: 2px 8px;
      font-size: 0.7rem;
    }

    /* Advanced Filters */
    .advanced-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #667eea;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 8px 0;
    }

    .advanced-toggle:hover {
      color: #5a67d8;
    }

    .advanced-filters {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .advanced-filters.show {
      max-height: 300px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .filter-select {
      padding: 10px 12px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-family: inherit;
      font-size: 0.85rem;
      background: #f8fafc;
      transition: all 0.3s ease;
    }

    .filter-select:focus {
      outline: none;
      border-color: #667eea;
    }

    /* Results Stats */
    .results-stats {
      padding: 15px 30px;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      border-bottom: 1px solid #eef2f6;
    }

    .stats-info {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      background: white;
      border-radius: 30px;
      font-size: 0.8rem;
      color: #475569;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .stat-badge i {
      color: #667eea;
    }

    .stat-badge strong {
      color: #1e293b;
    }

    .clear-search {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      transition: all 0.3s ease;
    }

    .clear-search:hover {
      background: #fee2e2;
    }

    /* Results Grid */
    .results-grid {
      padding: 25px 30px;
      max-height: 600px;
      overflow-y: auto;
      min-height: 300px;
    }

    .results-grid::-webkit-scrollbar {
      width: 6px;
    }

    .results-grid::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }

    .results-grid::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-state i {
      font-size: 4rem;
      color: #cbd5e1;
      margin-bottom: 15px;
    }

    .empty-state h3 {
      color: #475569;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #94a3b8;
    }

    .search-suggestions {
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .suggestion-chip, .suggest-btn {
      background: #f1f5f9;
      border: none;
      padding: 8px 16px;
      border-radius: 30px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .suggestion-chip:hover, .suggest-btn:hover {
      background: #e2e8f0;
    }

    /* Result Cards */
    .result-card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 15px;
      border: 1px solid #eef2f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .result-card:hover {
      transform: translateX(-5px);
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      border-color: #cbd5e1;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 15px;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .card-icon.student { background: #dbeafe; color: #2563eb; }
    .card-icon.teacher { background: #dcfce7; color: #16a34a; }
    .card-icon.class { background: #fef3c7; color: #d97706; }
    .card-icon.payment { background: #fce7f3; color: #db2777; }
    .card-icon.card { background: #e0e7ff; color: #4f46e5; }

    .card-name {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .card-type {
      font-size: 0.7rem;
      padding: 3px 10px;
      border-radius: 20px;
      background: #f1f5f9;
      color: #64748b;
    }

    .card-type.student { background: #dbeafe; color: #2563eb; }
    .card-type.teacher { background: #dcfce7; color: #16a34a; }
    .card-type.class { background: #fef3c7; color: #d97706; }

    .card-details {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 12px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #475569;
    }

    .detail-item i {
      width: 18px;
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .detail-item .label {
      font-weight: 500;
    }

    .card-footer {
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .status-badge.active, .status-badge.paid {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.late, .status-badge.inactive {
      background: #fee2e2;
      color: #dc2626;
    }

    .quick-actions {
      display: flex;
      gap: 8px;
    }

    .quick-action-btn {
      background: none;
      border: none;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 5px;
      color: #64748b;
    }

    .quick-action-btn:hover {
      background: #f1f5f9;
      color: #667eea;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 24px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      animation: modalIn 0.3s ease;
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 25px;
      border-bottom: 1px solid #eef2f6;
      background: linear-gradient(135deg, #f8f9ff, white);
    }

    .modal-header h2 {
      font-size: 1.3rem;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #94a3b8;
      transition: all 0.3s ease;
    }

    .modal-close:hover {
      color: #ef4444;
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 20px 25px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .detail-section {
      margin-bottom: 20px;
    }

    .detail-section h3 {
      font-size: 1rem;
      margin-bottom: 12px;
      color: #1e293b;
    }

    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .detail-label {
      width: 130px;
      font-weight: 600;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-value {
      flex: 1;
      color: #1e293b;
    }

    .classes-list, .subjects-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .class-tag, .subject-tag {
      background: #f1f5f9;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #475569;
    }

    .students-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .student-mini {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 12px;
      font-size: 0.85rem;
    }

    .student-mini i {
      color: #667eea;
    }

    .student-mini .student-id {
      color: #94a3b8;
      font-size: 0.7rem;
      margin-right: auto;
    }

    .modal-footer {
      padding: 15px 25px;
      border-top: 1px solid #eef2f6;
      display: flex;
      justify-content: flex-end;
    }

    .btn-secondary {
      padding: 8px 20px;
      background: #f1f5f9;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.3s ease;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    /* Highlight */
    mark {
      background: #fef3c7;
      color: #d97706;
      padding: 0 2px;
      border-radius: 4px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .search-system-container {
        padding: 10px;
      }

      .search-input-area {
        padding: 20px;
      }

      .search-wrapper {
        flex-direction: column;
      }

      .filter-chips {
        width: 100%;
        justify-content: center;
      }

      .stats-info {
        justify-content: center;
      }

      .results-stats {
        flex-direction: column;
      }

      .card-header {
        flex-direction: column;
      }

      .detail-row {
        flex-direction: column;
        gap: 5px;
      }

      .detail-label {
        width: 100%;
      }
    }
  `]
})
export class SearchSystemComponent implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl || 'http://localhost:4200/api';
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Search state
  searchTerm: string = '';
  activeFilter: string = 'all';
  isLoading: boolean = false;
  showAdvancedFilters: boolean = false;
  
  // Data
  allStudents: Student[] = [];
  allTeachers: Teacher[] = [];
  allClasses: Class[] = [];
  allPayments: Payment[] = [];
  allCards: Card[] = [];
  
  // Results
  allResults: SearchResult[] = [];
  filteredResults: SearchResult[] = [];
  totalResults: number = 0;
  resultsCount = {
    students: 0,
    teachers: 0,
    classes: 0,
    payments: 0,
    cards: 0
  };
  
  selectedResult: SearchResult | null = null;

  // Filters
  filters = [
    { value: 'all', label: 'الكل', icon: 'fas fa-globe' },
    { value: 'student', label: 'الطلاب', icon: 'fas fa-user-graduate' },
    { value: 'teacher', label: 'الأساتذة', icon: 'fas fa-chalkboard-user' },
    { value: 'class', label: 'الحصص', icon: 'fas fa-book-open' },
    { value: 'payment', label: 'المدفوعات', icon: 'fas fa-coins' },
    { value: 'card', label: 'البطاقات', icon: 'fas fa-id-card' }
  ];

  filtersData = {
    academicYear: '',
    subject: '',
    paymentStatus: '',
    studentStatus: '',
    teacherStatus: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAllData();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performSearch();
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  loadAllData(): void {
    this.isLoading = true;
    
    // Load all data in parallel
    Promise.all([
      this.loadStudents(),
      this.loadTeachers(),
      this.loadClasses(),
      this.loadPayments(),
      this.loadCards()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private async loadStudents(): Promise<void> {
    try {
      const response = await this.http.get<Student[]>(`${this.apiUrl}/students`).toPromise();
      this.allStudents = response || [];
    } catch (error) {
      console.error('Error loading students:', error);
      this.allStudents = [];
    }
  }

  private async loadTeachers(): Promise<void> {
    try {
      const response = await this.http.get<Teacher[]>(`${this.apiUrl}/teachers`).toPromise();
      this.allTeachers = response || [];
    } catch (error) {
      console.error('Error loading teachers:', error);
      this.allTeachers = [];
    }
  }

  private async loadClasses(): Promise<void> {
    try {
      const response = await this.http.get<{data: Class[]}>(`${this.apiUrl}/classes`).toPromise();
      this.allClasses = response?.data || [];
    } catch (error) {
      console.error('Error loading classes:', error);
      this.allClasses = [];
    }
  }

  private async loadPayments(): Promise<void> {
    try {
      const response = await this.http.get<Payment[]>(`${this.apiUrl}/payments`).toPromise();
      this.allPayments = response || [];
    } catch (error) {
      console.error('Error loading payments:', error);
      this.allPayments = [];
    }
  }

  private async loadCards(): Promise<void> {
    try {
      const response = await this.http.get<Card[]>(`${this.apiUrl}/cards`).toPromise();
      this.allCards = response || [];
    } catch (error) {
      console.error('Error loading cards:', error);
      this.allCards = [];
    }
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.performSearch();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  performSearch(): void {
    if (!this.searchTerm || this.searchTerm.trim().length < 2) {
      this.allResults = [];
      this.filteredResults = [];
      this.totalResults = 0;
      this.resetCounts();
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search Students
    if (this.activeFilter === 'all' || this.activeFilter === 'student') {
      const filteredStudents = this.allStudents.filter(student => {
        if (this.filtersData.academicYear && student.academicYear !== this.filtersData.academicYear) return false;
        if (this.filtersData.studentStatus && student.status !== this.filtersData.studentStatus) return false;
        
        return this.matchesSearch(student, searchLower, ['name', 'studentId', 'parentPhone', 'parentEmail']);
      });
      
      filteredStudents.forEach(student => {
        results.push({
          type: 'student',
          typeAr: 'طالب',
          icon: 'fas fa-user-graduate',
          iconClass: 'student',
          data: student,
          relevanceScore: this.calculateRelevance(student.name, searchLower)
        });
      });
    }

    // Search Teachers
    if (this.activeFilter === 'all' || this.activeFilter === 'teacher') {
      const filteredTeachers = this.allTeachers.filter(teacher => {
        if (this.filtersData.teacherStatus && ((this.filtersData.teacherStatus === 'active' && !teacher.active) || (this.filtersData.teacherStatus === 'inactive' && teacher.active))) return false;
        
        return this.matchesSearch(teacher, searchLower, ['name', 'phone', 'email', 'subjects']);
      });
      
      filteredTeachers.forEach(teacher => {
        results.push({
          type: 'teacher',
          typeAr: 'أستاذ',
          icon: 'fas fa-chalkboard-user',
          iconClass: 'teacher',
          data: teacher,
          relevanceScore: this.calculateRelevance(teacher.name, searchLower)
        });
      });
    }

    // Search Classes
    if (this.activeFilter === 'all' || this.activeFilter === 'class') {
      const filteredClasses = this.allClasses.filter(classItem => {
        if (this.filtersData.academicYear && classItem.academicYear !== this.filtersData.academicYear) return false;
        if (this.filtersData.subject && classItem.subject !== this.filtersData.subject) return false;
        
        return this.matchesSearch(classItem, searchLower, ['name', 'subject', 'teacher?.name']);
      });
      
      filteredClasses.forEach(classItem => {
        results.push({
          type: 'class',
          typeAr: 'حصة',
          icon: 'fas fa-book-open',
          iconClass: 'class',
          data: classItem,
          relevanceScore: this.calculateRelevance(classItem.name, searchLower)
        });
      });
    }

    // Search Payments
    if (this.activeFilter === 'all' || this.activeFilter === 'payment') {
      const filteredPayments = this.allPayments.filter(payment => {
        if (this.filtersData.paymentStatus && payment.status !== this.filtersData.paymentStatus) return false;
        
        return this.matchesSearch(payment, searchLower, ['student?.name', 'student?.studentId', 'month', 'invoiceNumber']);
      });
      
      filteredPayments.forEach(payment => {
        results.push({
          type: 'payment',
          typeAr: 'دفعة',
          icon: 'fas fa-coins',
          iconClass: 'payment',
          data: payment,
          relevanceScore: this.calculateRelevance(payment.student?.name || '', searchLower)
        });
      });
    }

    // Search Cards
    if (this.activeFilter === 'all' || this.activeFilter === 'card') {
      const filteredCards = this.allCards.filter(card => {
        return this.matchesSearch(card, searchLower, ['uid', 'student?.name', 'student?.studentId']);
      });
      
      filteredCards.forEach(card => {
        results.push({
          type: 'card',
          typeAr: 'بطاقة',
          icon: 'fas fa-id-card',
          iconClass: 'card',
          data: card,
          relevanceScore: this.calculateRelevance(card.uid, searchLower)
        });
      });
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    this.allResults = results;
    this.filteredResults = results;
    this.totalResults = results.length;
    this.updateCounts();
  }

  private matchesSearch(obj: any, searchLower: string, fields: string[]): boolean {
    for (const field of fields) {
      let value = this.getNestedValue(obj, field);
      if (value && String(value).toLowerCase().includes(searchLower)) {
        return true;
      }
    }
    return false;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('?.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  private calculateRelevance(name: string, searchLower: string): number {
    if (!name) return 0;
    const nameLower = name.toLowerCase();
    if (nameLower === searchLower) return 100;
    if (nameLower.startsWith(searchLower)) return 80;
    if (nameLower.includes(searchLower)) return 60;
    return 10;
  }

  private updateCounts(): void {
    this.resultsCount = {
      students: this.allResults.filter(r => r.type === 'student').length,
      teachers: this.allResults.filter(r => r.type === 'teacher').length,
      classes: this.allResults.filter(r => r.type === 'class').length,
      payments: this.allResults.filter(r => r.type === 'payment').length,
      cards: this.allResults.filter(r => r.type === 'card').length
    };
  }

  private resetCounts(): void {
    this.resultsCount = {
      students: 0,
      teachers: 0,
      classes: 0,
      payments: 0,
      cards: 0
    };
  }

  getFilterCount(filterValue: string): number {
    if (filterValue === 'all') return this.totalResults;
    return this.allResults.filter(r => r.type === filterValue).length;
  }

  getResultTitle(result: SearchResult): string {
    switch (result.type) {
      case 'student': return result.data.name;
      case 'teacher': return result.data.name;
      case 'class': return result.data.name;
      case 'payment': return `${result.data.student?.name || 'طالب'} - ${result.data.month}`;
      case 'card': return `بطاقة ${result.data.uid}`;
      default: return '';
    }
  }

  getResultDetails(result: SearchResult): { icon: string; label: string; value: string }[] {
    switch (result.type) {
      case 'student':
        return [
          { icon: 'fas fa-id-card', label: 'الرقم', value: result.data.studentId },
          { icon: 'fas fa-graduation-cap', label: 'السنة', value: result.data.academicYear },
          { icon: 'fas fa-user-friends', label: 'ولي الأمر', value: result.data.parentName },
          { icon: 'fas fa-phone', label: 'الهاتف', value: result.data.parentPhone },
          { icon: 'fas fa-envelope', label: 'البريد', value: result.data.parentEmail || 'غير متوفر' },
          { icon: 'fas fa-calendar', label: 'تاريخ التسجيل', value: new Date(result.data.registrationDate).toLocaleDateString('ar-EG') }
        ];
      case 'teacher':
        return [
          { icon: 'fas fa-phone', label: 'الهاتف', value: result.data.phone || 'غير متوفر' },
          { icon: 'fas fa-envelope', label: 'البريد', value: result.data.email || 'غير متوفر' },
          { icon: 'fas fa-calendar', label: 'تاريخ التعيين', value: new Date(result.data.hireDate).toLocaleDateString('ar-EG') },
          { icon: 'fas fa-chart-line', label: 'المواد', value: result.data.subjects?.join('، ') || 'غير محدد' }
        ];
      case 'class':
        return [
          { icon: 'fas fa-chalkboard-user', label: 'الأستاذ', value: result.data.teacher?.name || 'غير محدد' },
          { icon: 'fas fa-graduation-cap', label: 'السنة', value: result.data.academicYear },
          { icon: 'fas fa-dollar-sign', label: 'السعر', value: `${result.data.price} د.ج` },
          { icon: 'fas fa-users', label: 'الطلاب', value: `${result.data.students?.length || 0} طالب` },
          { icon: 'fas fa-clock', label: 'المواعيد', value: result.data.schedule?.map((s: any) => `${s.day} ${s.time}`).join('، ') || 'غير محدد' }
        ];
      case 'payment':
        return [
          { icon: 'fas fa-user', label: 'الطالب', value: result.data.student?.name || 'غير محدد' },
          { icon: 'fas fa-dollar-sign', label: 'المبلغ', value: `${result.data.amount} د.ج` },
          { icon: 'fas fa-calendar', label: 'الشهر', value: result.data.month },
          { icon: 'fas fa-file-invoice', label: 'رقم الفاتورة', value: result.data.invoiceNumber || 'غير متوفر' },
          { icon: 'fas fa-calendar-check', label: 'تاريخ الدفع', value: result.data.paymentDate ? new Date(result.data.paymentDate).toLocaleDateString('ar-EG') : 'لم يدفع بعد' }
        ];
      case 'card':
        return [
          { icon: 'fas fa-id-card', label: 'UID', value: result.data.uid },
          { icon: 'fas fa-user', label: 'الطالب', value: result.data.student?.name || 'غير مرتبط' },
          { icon: 'fas fa-id-card', label: 'رقم الطالب', value: result.data.student?.studentId || 'غير متوفر' },
          { icon: 'fas fa-calendar', label: 'تاريخ الإصدار', value: new Date(result.data.issueDate).toLocaleDateString('ar-EG') }
        ];
      default:
        return [];
    }
  }

  onResultClick(result: SearchResult): void {
    this.selectedResult = result;
  }

  viewDetails(result: SearchResult): void {
    this.selectedResult = result;
  }

  closeModal(): void {
    this.selectedResult = null;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.allResults = [];
    this.filteredResults = [];
    this.totalResults = 0;
    this.resetCounts();
  }
}

// Highlight Pipe
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  transform(text: string, search: string): string {
    if (!search || !text) return text;
    const regex = new RegExp(`(${this.escapeRegex(search)})`, 'gi');
    return text.replace(regex, `<mark>$1</mark>`);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}