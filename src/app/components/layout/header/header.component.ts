import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NotificationsComponent } from '../../notifications/notifications/notifications.component';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment.development';

// واجهات البيانات للبحث
interface SearchResult {
  type: 'student' | 'teacher' | 'class' | 'payment' | 'card';
  typeAr: string;
  icon: string;
  iconClass: string;
  data: any;
  relevanceScore: number;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationsComponent, RouterModule],
  template: `
    <nav class="main-header" dir="rtl">
      <div class="header-right">
        <div class="brand-zone">
          <div class="logo-circle">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <div class="brand-text">
            <span class="app-name">نظام المنارة</span>
            <span class="app-status">لوحة التحكم التعليمية</span>
          </div>
        </div>

        <!-- Search Wrapper with Dropdown -->
        <div class="search-wrapper" (clickOutside)="closeSearchDropdown()">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange()"
            (focus)="openSearchDropdown()"
            placeholder="بحث عن طالب، أستاذ، حصة، دفعة، أو بطاقة..." 
            class="search-input"
            [class.loading]="isSearching">
          <div class="search-loading" *ngIf="isSearching">
            <i class="fas fa-circle-notch fa-spin"></i>
          </div>
          
          <!-- Search Results Dropdown -->
          <div class="search-dropdown" *ngIf="showSearchDropdown && (searchResults.length > 0 || searchTerm)">
            <div class="dropdown-header">
              <span>نتائج البحث</span>
              <button class="close-dropdown" (click)="closeSearchDropdown()"><i class="fas fa-times"></i></button>
            </div>
            
            <!-- Filter Tabs -->
            <div class="dropdown-filters">
              <button 
                *ngFor="let filter of searchFilters"
                class="filter-tab"
                [class.active]="activeSearchFilter === filter.value"
                (click)="setSearchFilter(filter.value)">
                <i [class]="filter.icon"></i>
                {{ filter.label }}
                <span class="filter-count" *ngIf="getFilterCount(filter.value) > 0">
                  {{ getFilterCount(filter.value) }}
                </span>
              </button>
            </div>
            
            <!-- Results List -->
            <div class="dropdown-results">
              <div 
                *ngFor="let result of filteredSearchResults.slice(0, 8)"
                class="search-result-item"
                (click)="onSearchResultClick(result)">
                <div class="result-icon" [class]="result.iconClass">
                  <i [class]="result.icon"></i>
                </div>
                <div class="result-info">
                  <div class="result-title">{{ getResultTitle(result) }}</div>
                  <div class="result-subtitle">{{ result.typeAr }} • {{ getResultSubtitle(result) }}</div>
                </div>
                <div class="result-badge" *ngIf="result.type === 'payment'">
                  <span [class]="result.data.status">{{ result.data.status === 'paid' ? 'مدفوع' : result.data.status === 'pending' ? 'معلق' : 'متأخر' }}</span>
                </div>
                <div class="result-badge" *ngIf="result.type === 'student'">
                  <span [class]="result.data.status">{{ result.data.status === 'active' ? 'نشط' : result.data.status === 'pending' ? 'قيد الانتظار' : 'غير نشط' }}</span>
                </div>
              </div>
              
              <div class="dropdown-footer" *ngIf="searchResults.length > 0">
                <button class="view-all-btn" (click)="viewAllResults()">
                  <i class="fas fa-arrow-left"></i> عرض جميع النتائج ({{ searchResults.length }})
                </button>
              </div>
              
              <div class="no-results" *ngIf="searchResults.length === 0 && searchTerm && !isSearching">
                <i class="fas fa-search"></i>
                <p>لا توجد نتائج لـ "{{ searchTerm }}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="header-stats">
        <div class="stat-item" title="إجمالي الطلاب">
          <div class="stat-icon-mini blue"><i class="fas fa-user-graduate"></i></div>
          <div class="stat-values">
            <span class="stat-num">{{ studentCount }}</span>
            <span class="stat-label">طالب</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" title="إجمالي الأساتذة">
          <div class="stat-icon-mini purple"><i class="fas fa-chalkboard-teacher"></i></div>
          <div class="stat-values">
            <span class="stat-num">{{ teacherCount }}</span>
            <span class="stat-label">أستاذ</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" title="إجمالي الحصص">
          <div class="stat-icon-mini orange"><i class="fas fa-book-open"></i></div>
          <div class="stat-values">
            <span class="stat-num">{{ lessonCount }}</span>
            <span class="stat-label">حصة</span>
          </div>
        </div>
      </div>

      <div class="header-left">
        <div class="notification-wrapper" (click)="toggleNotifications()">
          <div class="notification-bell" [class.has-notifications]="notificationCount > 0" [class.ringing]="isRinging">
            <i class="fas fa-bell"></i>
            <div class="bell-clapper" [class.ringing]="isRinging"></div>
          </div>
          
          <span class="notification-badge" *ngIf="notificationCount > 0" [class.pulse]="notificationCount > 0">
            {{ notificationCount > 9 ? '9+' : notificationCount }}
          </span>
          
          <div class="notification-effects" *ngIf="notificationCount > 0">
            <div class="ripple"></div>
            <div class="ripple delay-1"></div>
            <div class="ripple delay-2"></div>
          </div>
          
          <div class="notification-tooltip" *ngIf="notificationCount > 0">
            لديك {{ notificationCount }} إشعار جديد
          </div>
        </div>

        <button class="btn-close-notifications" *ngIf="notificationsComponent?.isOpen" (click)="closeNotifications()" title="إغلاق الإشعارات">
          <i class="fas fa-times"></i>
        </button>

        <div class="user-profile">
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
          <div class="avatar-wrapper">
            <img [src]="userAvatar" [alt]="userName" class="user-avatar">
            <div class="status-indicator online"></div>
          </div>
        </div>
      </div>
    </nav>

    <app-notifications #notificationsComponent (onClose)="onNotificationsClose()"></app-notifications>

    <div class="notification-loading-overlay" *ngIf="isLoadingNotifications">
      <div class="loading-spinner"></div>
    </div>

    <!-- Full Search Modal -->
    <div class="search-modal-overlay" *ngIf="showFullSearchModal" (click)="closeFullSearchModal()">
      <div class="search-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-search"></i> نتائج البحث</h3>
          <button class="modal-close" (click)="closeFullSearchModal()"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="modal-filters">
          <button 
            *ngFor="let filter of searchFilters"
            class="filter-tab large"
            [class.active]="activeSearchFilter === filter.value"
            (click)="setSearchFilter(filter.value)">
            <i [class]="filter.icon"></i>
            {{ filter.label }}
            <span class="filter-count">{{ getFilterCount(filter.value) }}</span>
          </button>
        </div>
        
        <div class="modal-results">
          <div 
            *ngFor="let result of filteredSearchResults"
            class="search-result-card"
            (click)="onSearchResultClick(result)">
            <div class="result-icon-large" [class]="result.iconClass">
              <i [class]="result.icon"></i>
            </div>
            <div class="result-content">
              <h4>{{ getResultTitle(result) }}</h4>
              <div class="result-meta">
                <span class="result-type">{{ result.typeAr }}</span>
                <span class="result-detail">{{ getResultSubtitle(result) }}</span>
              </div>
              <div class="result-details-preview">
                <span *ngFor="let detail of getResultPreviewDetails(result)" class="preview-detail">
                  <i [class]="detail.icon"></i> {{ detail.value }}
                </span>
              </div>
            </div>
            <div class="result-status" *ngIf="result.type === 'payment' || result.type === 'student'">
              <span [class]="result.type === 'payment' ? result.data.status : result.data.status">
                {{ result.type === 'payment' ? (result.data.status === 'paid' ? 'مدفوع' : result.data.status === 'pending' ? 'معلق' : 'متأخر') : (result.data.status === 'active' ? 'نشط' : result.data.status === 'pending' ? 'قيد الانتظار' : 'غير نشط') }}
              </span>
            </div>
            <div class="result-action">
              <i class="fas fa-chevron-left"></i>
            </div>
          </div>
        </div>
        
        <div class="modal-footer" *ngIf="filteredSearchResults.length === 0">
          <p>لا توجد نتائج لـ "{{ searchTerm }}"</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --header-bg: #ffffff;
      --primary-color: #4361ee;
      --secondary-color: #7209b7;
      --accent-color: #f72585;
      --text-dark: #2b2d42;
      --text-light: #8d99ae;
      --border-color: #f0f2f5;
      --shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
    }

    .main-header {
      height: 80px;
      background: var(--header-bg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 999;
      transition: all 0.3s ease;
    }

    .main-header:hover {
      box-shadow: 0 4px 20px rgba(67, 97, 238, 0.1);
    }

    /* Brand Section */
    .header-right {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    
    .brand-zone {
      display: flex;
      align-items: center;
      gap: 12px;
      transition: transform 0.3s ease;
    }
    
    .brand-zone:hover {
      transform: scale(1.02);
    }
    
    .logo-circle {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
      transition: all 0.3s ease;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    
    .brand-text { 
      display: flex; 
      flex-direction: column; 
    }
    
    .app-name { 
      font-weight: 800; 
      color: var(--text-dark); 
      font-size: 1.1rem;
      letter-spacing: 0.5px;
    }
    
    .app-status { 
      font-size: 0.75rem; 
      color: var(--text-light);
    }

    /* Search Wrapper */
    .search-wrapper {
      position: relative;
      width: 380px;
    }
    
    .search-input {
      width: 100%;
      padding: 12px 45px 12px 20px;
      background: #f8f9fa;
      border: 1.5px solid transparent;
      border-radius: 14px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }
    
    .search-input:focus {
      background: white;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.1);
      outline: none;
    }
    
    .search-input.loading {
      padding-right: 70px;
    }
    
    .search-input:hover {
      background: #ffffff;
      border-color: #e0e0e0;
    }
    
    .search-icon {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-light);
      transition: color 0.3s ease;
      pointer-events: none;
    }
    
    .search-loading {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--primary-color);
    }
    
    .search-wrapper:hover .search-icon {
      color: var(--primary-color);
    }

    /* Search Dropdown */
    .search-dropdown {
      position: absolute;
      top: 55px;
      left: 0;
      right: 0;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
      animation: dropdownSlide 0.2s ease;
    }

    @keyframes dropdownSlide {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #eef2f6;
      font-weight: 600;
      color: var(--text-dark);
    }

    .close-dropdown {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      padding: 4px 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .close-dropdown:hover {
      background: #eef2f6;
      color: var(--danger-color);
    }

    .dropdown-filters {
      display: flex;
      gap: 5px;
      padding: 10px 12px;
      background: white;
      border-bottom: 1px solid #eef2f6;
      flex-wrap: wrap;
    }

    .filter-tab {
      padding: 6px 14px;
      border: none;
      border-radius: 25px;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-tab.active {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
    }

    .filter-tab:hover:not(.active) {
      background: #e2e8f0;
    }

    .filter-count {
      background: rgba(0,0,0,0.1);
      border-radius: 20px;
      padding: 1px 6px;
      font-size: 0.7rem;
    }

    .filter-tab.active .filter-count {
      background: rgba(255,255,255,0.2);
    }

    .dropdown-results {
      max-height: 400px;
      overflow-y: auto;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid #f1f5f9;
    }

    .search-result-item:hover {
      background: #f8fafc;
    }

    .result-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .result-icon.student { background: #dbeafe; color: #2563eb; }
    .result-icon.teacher { background: #dcfce7; color: #16a34a; }
    .result-icon.class { background: #fef3c7; color: #d97706; }
    .result-icon.payment { background: #fce7f3; color: #db2777; }
    .result-icon.card { background: #e0e7ff; color: #4f46e5; }

    .result-info {
      flex: 1;
    }

    .result-title {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-dark);
    }

    .result-subtitle {
      font-size: 0.7rem;
      color: var(--text-light);
    }

    .result-badge span {
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 600;
    }

    .result-badge span.paid, .result-badge span.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .result-badge span.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .result-badge span.late, .result-badge span.inactive {
      background: #fee2e2;
      color: #dc2626;
    }

    .dropdown-footer {
      padding: 12px 16px;
      border-top: 1px solid #eef2f6;
      background: #f8fafc;
    }

    .view-all-btn {
      width: 100%;
      padding: 10px;
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .view-all-btn:hover {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .no-results {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-light);
    }

    .no-results i {
      font-size: 2rem;
      margin-bottom: 10px;
    }

    /* Full Search Modal */
    .search-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .search-modal {
      background: white;
      border-radius: 24px;
      width: 90%;
      max-width: 800px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalIn 0.3s ease;
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.95);
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
      padding: 20px 24px;
      border-bottom: 1px solid #eef2f6;
      background: linear-gradient(135deg, #f8f9ff, white);
    }

    .modal-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #94a3b8;
      transition: all 0.3s ease;
      padding: 8px;
      border-radius: 8px;
    }

    .modal-close:hover {
      background: #f1f5f9;
      color: var(--danger-color);
    }

    .modal-filters {
      display: flex;
      gap: 10px;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #eef2f6;
      flex-wrap: wrap;
    }

    .filter-tab.large {
      padding: 8px 18px;
      font-size: 0.85rem;
    }

    .modal-results {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }

    .search-result-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      margin-bottom: 12px;
      background: #f8fafc;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .search-result-card:hover {
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateX(-5px);
    }

    .result-icon-large {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .result-icon-large.student { background: #dbeafe; color: #2563eb; }
    .result-icon-large.teacher { background: #dcfce7; color: #16a34a; }
    .result-icon-large.class { background: #fef3c7; color: #d97706; }
    .result-icon-large.payment { background: #fce7f3; color: #db2777; }
    .result-icon-large.card { background: #e0e7ff; color: #4f46e5; }

    .result-content {
      flex: 1;
    }

    .result-content h4 {
      margin: 0 0 4px 0;
      font-size: 1rem;
    }

    .result-meta {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
    }

    .result-type {
      font-size: 0.7rem;
      padding: 2px 8px;
      background: #eef2f6;
      border-radius: 20px;
      color: #64748b;
    }

    .result-detail {
      font-size: 0.75rem;
      color: var(--text-light);
    }

    .result-details-preview {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .preview-detail {
      font-size: 0.7rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .preview-detail i {
      font-size: 0.65rem;
    }

    .result-status span {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .result-status span.paid, .result-status span.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .result-status span.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .result-status span.late, .result-status span.inactive {
      background: #fee2e2;
      color: #dc2626;
    }

    .result-action {
      color: var(--text-light);
      transition: all 0.3s ease;
    }

    .search-result-card:hover .result-action {
      color: var(--primary-color);
      transform: translateX(-5px);
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #eef2f6;
      text-align: center;
      color: var(--text-light);
    }

    /* باقي الـ Styles من الهيدر الأصلي */
    .header-stats, .stat-item, .stat-icon-mini, .stat-values, .stat-divider,
    .header-left, .notification-wrapper, .notification-bell, .bell-clapper,
    .notification-badge, .notification-effects, .ripple, .notification-tooltip,
    .btn-close-notifications, .user-profile, .user-info, .avatar-wrapper,
    .user-avatar, .status-indicator, .notification-loading-overlay, .loading-spinner {
      /* الاحتفاظ بالـ styles الأصلية */
    }

    /* إضافة styles مفقودة */
    .header-stats {
      display: flex;
      align-items: center;
      background: #fcfcfd;
      padding: 8px 20px;
      border-radius: 50px;
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
    }
    
    .header-stats:hover {
      background: #ffffff;
      border-color: var(--primary-color);
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 10px;
      transition: transform 0.3s ease;
      cursor: pointer;
    }
    
    .stat-item:hover {
      transform: translateY(-2px);
    }
    
    .stat-icon-mini {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }
    
    .stat-icon-mini.blue { background: #e0e7ff; color: #4361ee; }
    .stat-icon-mini.purple { background: #f3e8ff; color: #9333ea; }
    .stat-icon-mini.orange { background: #ffedd5; color: #ea580c; }
    
    .stat-values { display: flex; flex-direction: column; line-height: 1; }
    .stat-num { font-weight: 700; color: var(--text-dark); font-size: 1rem; }
    .stat-label { font-size: 0.7rem; color: var(--text-light); }
    .stat-divider { width: 1px; height: 25px; background: #e5e7eb; margin: 0 10px; }

    .header-left { display: flex; align-items: center; gap: 1rem; }
    .notification-wrapper { position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .notification-bell { position: relative; color: var(--text-light); font-size: 1.3rem; transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); padding: 8px; border-radius: 50%; background: #f8f9fa; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .notification-bell.ringing { animation: bellShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
    @keyframes bellShake { 0% { transform: rotate(0); } 15% { transform: rotate(15deg); } 30% { transform: rotate(-15deg); } 45% { transform: rotate(10deg); } 60% { transform: rotate(-10deg); } 75% { transform: rotate(5deg); } 85% { transform: rotate(-5deg); } 92% { transform: rotate(2deg); } 100% { transform: rotate(0); } }
    .bell-clapper { position: absolute; width: 4px; height: 8px; background: currentColor; bottom: 14px; left: 50%; transform: translateX(-50%); border-radius: 2px; transition: transform 0.3s ease; opacity: 0.5; }
    .notification-bell.has-notifications { background: linear-gradient(135deg, rgba(247, 37, 133, 0.1), rgba(67, 97, 238, 0.1)); color: var(--accent-color); }
    .notification-badge { position: absolute; top: -5px; left: -5px; background: linear-gradient(135deg, var(--accent-color), #b5179e); color: white; font-size: 0.7rem; font-weight: 700; min-width: 22px; height: 22px; border-radius: 22px; display: flex; align-items: center; justify-content: center; border: 2px solid white; z-index: 10; box-shadow: 0 3px 8px rgba(247, 37, 133, 0.4); padding: 0 4px; line-height: 1; animation: badgePop 0.3s ease-out; }
    @keyframes badgePop { 0% { transform: scale(0); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }
    .notification-effects { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; pointer-events: none; }
    .ripple { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 45px; height: 45px; border-radius: 50%; background: radial-gradient(circle, rgba(247, 37, 133, 0.3) 0%, transparent 70%); animation: ripple 2s ease-out infinite; }
    .ripple.delay-1 { animation-delay: 0.5s; opacity: 0.5; }
    .ripple.delay-2 { animation-delay: 1s; opacity: 0.3; }
    @keyframes ripple { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
    .notification-tooltip { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: var(--text-dark); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; white-space: nowrap; opacity: 0; visibility: hidden; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); pointer-events: none; z-index: 20; }
    .notification-wrapper:hover .notification-tooltip { opacity: 1; visibility: visible; top: -45px; }
    .btn-close-notifications { width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--accent-color); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(247, 37, 133, 0.3); animation: slideIn 0.3s ease; }
    .btn-close-notifications:hover { transform: scale(1.1) rotate(90deg); background: #dc2626; box-shadow: 0 6px 15px rgba(220, 38, 38, 0.4); }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px) scale(0.8); } to { opacity: 1; transform: translateX(0) scale(1); } }
    .user-profile { display: flex; align-items: center; gap: 12px; padding-right: 1.5rem; border-right: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s ease; }
    .user-profile:hover { background: #f8f9fa; border-radius: 12px; padding: 5px 15px 5px 10px; }
    .user-info { text-align: left; display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-weight: 700; color: var(--text-dark); font-size: 0.9rem; line-height: 1.2; }
    .user-role { font-size: 0.75rem; color: var(--text-light); }
    .avatar-wrapper { position: relative; transition: transform 0.3s ease; }
    .user-avatar { width: 45px; height: 45px; border-radius: 12px; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .status-indicator { position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background: #10b981; border-radius: 50%; border: 2px solid white; animation: blink 2s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .notification-loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s ease; }
    .loading-spinner { width: 50px; height: 50px; border: 4px solid #f0f2f5; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .header-stats { display: none; }
      .search-wrapper { width: 250px; }
    }

    @media (max-width: 768px) {
      .main-header { padding: 0 1rem; }
      .search-wrapper { display: none; }
      .user-info { display: none; }
      .notification-badge { top: -8px; left: -8px; min-width: 20px; height: 20px; font-size: 0.65rem; }
      .btn-close-notifications { width: 32px; height: 32px; }
    }
  `]
})
export class HeaderComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  private searchSubject = new Subject<string>();
  
  @ViewChild('notificationsComponent') notificationsComponent!: NotificationsComponent;

  // Statistics
  studentCount: number = 0;
  teacherCount: number = 0;
  lessonCount: number = 0;
  
  // User Data
  userName: string = 'جاري التحميل...';
  userRole: string = '';
  userAvatar: string = 'https://ui-avatars.com/api/?name=User&background=random';
  
  // Notifications
  notificationCount: number = 0;
  isRinging: boolean = false;
  isLoadingNotifications: boolean = false;
  
  // Search
  searchTerm: string = '';
  isSearching: boolean = false;
  showSearchDropdown: boolean = false;
  showFullSearchModal: boolean = false;
  activeSearchFilter: string = 'all';
  
  searchFilters = [
    { value: 'all', label: 'الكل', icon: 'fas fa-globe' },
    { value: 'student', label: 'الطلاب', icon: 'fas fa-user-graduate' },
    { value: 'teacher', label: 'الأساتذة', icon: 'fas fa-chalkboard-user' },
    { value: 'class', label: 'الحصص', icon: 'fas fa-book-open' },
    { value: 'payment', label: 'المدفوعات', icon: 'fas fa-coins' },
    { value: 'card', label: 'البطاقات', icon: 'fas fa-id-card' }
  ];
  
  // Search Data
  allStudents: any[] = [];
  allTeachers: any[] = [];
  allClasses: any[] = [];
  allPayments: any[] = [];
  allCards: any[] = [];
  searchResults: SearchResult[] = [];
  filteredSearchResults: SearchResult[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadUserData();
    this.loadNotificationCount();
    this.loadSearchData();
    this.setupSearchDebounce();
    
    setInterval(() => this.checkForNewNotifications(), 60000);
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.performSearch();
    });
  }

  loadStats(): void {
    forkJoin({
      students: this.http.get<{ count: number }>(`${this.apiUrl}/count/students`),
      teachers: this.http.get<{ count: number }>(`${this.apiUrl}/count/teachers`),
      classes: this.http.get<{ count: number }>(`${this.apiUrl}/count/classes`)
    }).subscribe({
      next: (res) => {
        this.studentCount = res.students.count;
        this.teacherCount = res.teachers.count;
        this.lessonCount = res.classes.count;
      },
      error: (err) => console.error('Error fetching stats:', err)
    });
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.fullName || user.username || 'ياسر خيشه';
        this.userRole = user.role === 'admin' ? 'مدير النظام' : user.role === 'teacher' ? 'أستاذ' : user.role === 'accountant' ? 'محاسب' : 'سكرتير';
        this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=4361ee&color=fff`;
      } catch {
        this.setDefaultUser();
      }
    } else {
      this.setDefaultUser();
    }
  }

  private setDefaultUser(): void {
    this.userName = 'ياسر خيشه';
    this.userRole = 'مدير النظام';
    this.userAvatar = 'https://ui-avatars.com/api/?name=ياسر+خيشه&background=4361ee&color=fff';
  }

  loadNotificationCount(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/notifications/count`).subscribe({
      next: (data) => {
        const oldCount = this.notificationCount;
        this.notificationCount = data.count || 0;
        if (this.notificationCount > oldCount) {
          this.ringBell();
        }
      },
      error: (err) => {
        console.error('Error loading notification count:', err);
        this.notificationCount = 0;
      }
    });
  }

  checkForNewNotifications(): void {
    this.http.get<boolean>(`${this.apiUrl}/notifications/check-new`).subscribe({
      next: (hasNew) => {
        if (hasNew) {
          this.ringBell();
          this.loadNotificationCount();
        }
      },
      error: (err) => console.error('Error checking new notifications:', err)
    });
  }

  ringBell(): void {
    this.isRinging = true;
    setTimeout(() => {
      this.isRinging = false;
    }, 1000);
  }

  toggleNotifications(): void {
    if (this.notificationsComponent) {
      if (this.notificationsComponent.isOpen) {
        this.notificationsComponent.close();
      } else {
        this.isLoadingNotifications = true;
        setTimeout(() => {
          this.isLoadingNotifications = false;
          this.notificationsComponent.open();
        }, 500);
      }
    }
  }

  closeNotifications(): void {
    if (this.notificationsComponent) {
      this.notificationsComponent.close();
    }
  }

  onNotificationsClose(): void {
    this.loadNotificationCount();
  }

  // ==================== Search Methods ====================
  
  loadSearchData(): void {
    // Load all data in parallel for search
    Promise.all([
      this.http.get<any[]>(`${this.apiUrl}/students`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/teachers`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/classes`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/payments`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/cards`).toPromise()
    ]).then(([students, teachers, classes, payments, cards]) => {
      this.allStudents = students || [];
      this.allTeachers = teachers || [];
      this.allClasses = classes || [];
      this.allPayments = payments || [];
      this.allCards = cards || [];
    }).catch(err => console.error('Error loading search data:', err));
  }

  onSearchChange(): void {
    if (this.searchTerm.trim().length >= 2) {
      this.searchSubject.next(this.searchTerm);
    } else if (this.searchTerm.trim().length === 0) {
      this.searchResults = [];
      this.filteredSearchResults = [];
      this.showSearchDropdown = false;
    }
  }

  openSearchDropdown(): void {
    if (this.searchTerm.trim().length >= 2 && this.searchResults.length > 0) {
      this.showSearchDropdown = true;
    }
  }

  closeSearchDropdown(): void {
    setTimeout(() => {
      this.showSearchDropdown = false;
    }, 200);
  }

  setSearchFilter(filter: string): void {
    this.activeSearchFilter = filter;
    this.filterResults();
  }

  private filterResults(): void {
    if (this.activeSearchFilter === 'all') {
      this.filteredSearchResults = [...this.searchResults];
    } else {
      this.filteredSearchResults = this.searchResults.filter(r => r.type === this.activeSearchFilter);
    }
  }

  getFilterCount(filterValue: string): number {
    if (filterValue === 'all') return this.searchResults.length;
    return this.searchResults.filter(r => r.type === filterValue).length;
  }

  private performSearch(): void {
    const searchLower = this.searchTerm.toLowerCase().trim();
    if (searchLower.length < 2) {
      this.searchResults = [];
      this.filteredSearchResults = [];
      return;
    }
    
    this.isSearching = true;
    const results: SearchResult[] = [];

    // Search Students
    this.allStudents.forEach(student => {
      if (this.matchesSearch(student, searchLower, ['name', 'studentId', 'parentPhone', 'parentEmail'])) {
        results.push({
          type: 'student',
          typeAr: 'طالب',
          icon: 'fas fa-user-graduate',
          iconClass: 'student',
          data: student,
          relevanceScore: this.calculateRelevance(student.name, searchLower)
        });
      }
    });

    // Search Teachers
    this.allTeachers.forEach(teacher => {
      if (this.matchesSearch(teacher, searchLower, ['name', 'phone', 'email'])) {
        results.push({
          type: 'teacher',
          typeAr: 'أستاذ',
          icon: 'fas fa-chalkboard-user',
          iconClass: 'teacher',
          data: teacher,
          relevanceScore: this.calculateRelevance(teacher.name, searchLower)
        });
      }
    });

    // Search Classes
    this.allClasses.forEach(classItem => {
      if (this.matchesSearch(classItem, searchLower, ['name', 'subject', 'teacher?.name'])) {
        results.push({
          type: 'class',
          typeAr: 'حصة',
          icon: 'fas fa-book-open',
          iconClass: 'class',
          data: classItem,
          relevanceScore: this.calculateRelevance(classItem.name, searchLower)
        });
      }
    });

    // Search Payments
    this.allPayments.forEach(payment => {
      if (this.matchesSearch(payment, searchLower, ['student?.name', 'student?.studentId', 'month', 'invoiceNumber'])) {
        results.push({
          type: 'payment',
          typeAr: 'دفعة',
          icon: 'fas fa-coins',
          iconClass: 'payment',
          data: payment,
          relevanceScore: this.calculateRelevance(payment.student?.name || '', searchLower)
        });
      }
    });

    // Search Cards
    this.allCards.forEach(card => {
      if (this.matchesSearch(card, searchLower, ['uid', 'student?.name', 'student?.studentId'])) {
        results.push({
          type: 'card',
          typeAr: 'بطاقة',
          icon: 'fas fa-id-card',
          iconClass: 'card',
          data: card,
          relevanceScore: this.calculateRelevance(card.uid, searchLower)
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    this.searchResults = results;
    this.filterResults();
    this.isSearching = false;
    this.showSearchDropdown = true;
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

  getResultSubtitle(result: SearchResult): string {
    switch (result.type) {
      case 'student': return result.data.studentId;
      case 'teacher': return result.data.subjects?.join('، ') || 'لا توجد مواد';
      case 'class': return `${result.data.subject} • ${result.data.academicYear}`;
      case 'payment': return `${result.data.amount} د.ج`;
      case 'card': return result.data.student?.name || 'غير مرتبط';
      default: return '';
    }
  }

  getResultPreviewDetails(result: SearchResult): { icon: string; value: string }[] {
    switch (result.type) {
      case 'student':
        return [
          { icon: 'fas fa-id-card', value: result.data.studentId },
          { icon: 'fas fa-phone', value: result.data.parentPhone },
          { icon: 'fas fa-graduation-cap', value: result.data.academicYear }
        ];
      case 'teacher':
        return [
          { icon: 'fas fa-phone', value: result.data.phone || 'غير متوفر' },
          { icon: 'fas fa-envelope', value: result.data.email || 'غير متوفر' }
        ];
      case 'class':
        return [
          { icon: 'fas fa-dollar-sign', value: `${result.data.price} د.ج` },
          { icon: 'fas fa-users', value: `${result.data.students?.length || 0} طالب` }
        ];
      case 'payment':
        return [
          { icon: 'fas fa-dollar-sign', value: `${result.data.amount} د.ج` },
          { icon: 'fas fa-calendar', value: result.data.month }
        ];
      case 'card':
        return [
          { icon: 'fas fa-id-card', value: result.data.uid },
          { icon: 'fas fa-calendar', value: new Date(result.data.issueDate).toLocaleDateString('ar-EG') }
        ];
      default:
        return [];
    }
  }

  viewAllResults(): void {
    this.showSearchDropdown = false;
    this.showFullSearchModal = true;
  }

  closeFullSearchModal(): void {
    this.showFullSearchModal = false;
  }

  onSearchResultClick(result: SearchResult): void {
    this.showSearchDropdown = false;
    this.showFullSearchModal = false;
    
    // Navigate based on result type
    switch (result.type) {
      case 'student':
        window.location.href = `/student/${result.data._id}`;
        break;
      case 'teacher':
        window.location.href = `/teacher/${result.data._id}`;
        break;
      case 'class':
        window.location.href = `/class/${result.data._id}`;
        break;
      case 'payment':
        window.location.href = `/payment/${result.data._id}`;
        break;
      case 'card':
        window.location.href = `/cards-management`;
        break;
    }
  }
}