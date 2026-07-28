import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NotificationsComponent } from '../../notifications/notifications/notifications.component';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment.development';

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
            <span class="app-name">{{ schoolName }}</span>
            <span class="app-status">لوحة التحكم التعليمية</span>
          </div>
        </div>

        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="بحث عن طالب، أستاذ، أو حصة..." 
            class="search-input">
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
        <!-- زر الإشعارات المحسن -->
        <div class="notification-wrapper" (click)="toggleNotifications()">
          <div class="notification-bell" [class.has-notifications]="notificationCount > 0" [class.ringing]="isRinging">
            <i class="fas fa-bell"></i>
            <div class="bell-clapper" [class.ringing]="isRinging"></div>
          </div>
          
          <!-- رقم الإشعارات -->
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

        <!-- زر إغلاق الإشعارات (يظهر فقط عندما تكون الإشعارات مفتوحة) -->
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

    /* Search Bar */
    .search-wrapper {
      position: relative;
      width: 300px;
    }
    
    .search-input {
      width: 100%;
      padding: 10px 40px 10px 15px;
      background: #f8f9fa;
      border: 1.5px solid transparent;
      border-radius: 12px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }
    
    .search-input:focus {
      background: white;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.1);
      outline: none;
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
    }
    
    .search-wrapper:hover .search-icon {
      color: var(--primary-color);
    }

    /* Stats Section */
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
    
    .stat-item:hover .stat-icon-mini {
      transform: scale(1.1) rotate(5deg);
    }
    
    .stat-icon-mini.blue { 
      background: #e0e7ff; 
      color: #4361ee; 
    }
    
    .stat-icon-mini.purple { 
      background: #f3e8ff; 
      color: #9333ea; 
    }
    
    .stat-icon-mini.orange { 
      background: #ffedd5; 
      color: #ea580c; 
    }
    
    .stat-values { 
      display: flex; 
      flex-direction: column; 
      line-height: 1; 
    }
    
    .stat-num { 
      font-weight: 700; 
      color: var(--text-dark); 
      font-size: 1rem;
      transition: color 0.3s ease;
    }
    
    .stat-item:hover .stat-num {
      color: var(--primary-color);
    }
    
    .stat-label { 
      font-size: 0.7rem; 
      color: var(--text-light); 
    }
    
    .stat-divider { 
      width: 1px; 
      height: 25px; 
      background: #e5e7eb; 
      margin: 0 10px; 
    }

    /* User Profile & Notifications */
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Notification Wrapper */
    .notification-wrapper {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification-bell {
      position: relative;
      color: var(--text-light);
      font-size: 1.3rem;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      padding: 8px;
      border-radius: 50%;
      background: #f8f9fa;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .notification-bell i {
      transition: all 0.3s ease;
      z-index: 1;
    }

    /* حركة الجرس */
    .notification-bell.ringing {
      animation: bellShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    @keyframes bellShake {
      0% { transform: rotate(0); }
      15% { transform: rotate(15deg); }
      30% { transform: rotate(-15deg); }
      45% { transform: rotate(10deg); }
      60% { transform: rotate(-10deg); }
      75% { transform: rotate(5deg); }
      85% { transform: rotate(-5deg); }
      92% { transform: rotate(2deg); }
      100% { transform: rotate(0); }
    }

    /* قطعة الجرس (اللسان) */
    .bell-clapper {
      position: absolute;
      width: 4px;
      height: 8px;
      background: currentColor;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 2px;
      transition: transform 0.3s ease;
      opacity: 0.5;
    }

    .bell-clapper.ringing {
      animation: clapperSwing 0.5s ease-in-out;
    }

    @keyframes clapperSwing {
      0%, 100% { transform: translateX(-50%) rotate(0); }
      25% { transform: translateX(-50%) rotate(10deg); }
      75% { transform: translateX(-50%) rotate(-10deg); }
    }

    /* خلفية متغيرة عند وجود إشعارات */
    .notification-bell.has-notifications {
      background: linear-gradient(135deg, rgba(247, 37, 133, 0.1), rgba(67, 97, 238, 0.1));
      color: var(--accent-color);
    }

    .notification-bell.has-notifications:hover {
      background: linear-gradient(135deg, rgba(247, 37, 133, 0.2), rgba(67, 97, 238, 0.2));
      transform: scale(1.1);
    }

    /* شارة الإشعارات */
    .notification-badge {
      position: absolute;
      top: -5px;
      left: -5px;
      background: linear-gradient(135deg, var(--accent-color), #b5179e);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      min-width: 22px;
      height: 22px;
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      z-index: 10;
      box-shadow: 0 3px 8px rgba(247, 37, 133, 0.4);
      padding: 0 4px;
      line-height: 1;
      animation: badgePop 0.3s ease-out;
    }

    @keyframes badgePop {
      0% { transform: scale(0); }
      80% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .notification-badge.pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }

    /* تأثيرات الموجات */
    .notification-effects {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(247, 37, 133, 0.3) 0%, transparent 70%);
      animation: ripple 2s ease-out infinite;
    }

    .ripple.delay-1 {
      animation-delay: 0.5s;
      opacity: 0.5;
    }

    .ripple.delay-2 {
      animation-delay: 1s;
      opacity: 0.3;
    }

    @keyframes ripple {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }

    /* تلميح الأداة */
    .notification-tooltip {
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--text-dark);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      z-index: 20;
    }

    .notification-tooltip::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid var(--text-dark);
    }

    .notification-wrapper:hover .notification-tooltip {
      opacity: 1;
      visibility: visible;
      top: -45px;
    }

    /* زر إغلاق الإشعارات */
    .btn-close-notifications {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--accent-color);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 10px rgba(247, 37, 133, 0.3);
      animation: slideIn 0.3s ease;
    }

    .btn-close-notifications:hover {
      transform: scale(1.1) rotate(90deg);
      background: #dc2626;
      box-shadow: 0 6px 15px rgba(220, 38, 38, 0.4);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px) scale(0.8);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    /* User Profile */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-right: 1.5rem;
      border-right: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .user-profile:hover {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 5px 15px 5px 10px;
    }
    
    .user-info { 
      text-align: left; 
      display: flex; 
      flex-direction: column; 
      align-items: flex-start; 
    }
    
    .user-name { 
      font-weight: 700; 
      color: var(--text-dark); 
      font-size: 0.9rem; 
      line-height: 1.2;
      transition: color 0.3s ease;
    }
    
    .user-profile:hover .user-name {
      color: var(--primary-color);
    }
    
    .user-role { 
      font-size: 0.75rem; 
      color: var(--text-light); 
    }
    
    .avatar-wrapper { 
      position: relative;
      transition: transform 0.3s ease;
    }
    
    .user-profile:hover .avatar-wrapper {
      transform: scale(1.1) rotate(5deg);
    }
    
    .user-avatar {
      width: 45px;
      height: 45px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      border: 2px solid white;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Loading Overlay */
    .notification-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f0f2f5;
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .header-stats { 
        display: none; 
      }
      
      .search-wrapper { 
        width: 200px; 
      }
    }

    @media (max-width: 768px) {
      .main-header {
        padding: 0 1rem;
      }
      
      .search-wrapper {
        display: none;
      }
      
      .user-info {
        display: none;
      }
      
      .notification-badge {
        top: -8px;
        left: -8px;
        min-width: 20px;
        height: 20px;
        font-size: 0.65rem;
      }
      
      .btn-close-notifications {
        width: 32px;
        height: 32px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  @ViewChild('notificationsComponent') notificationsComponent!: NotificationsComponent;

  // إحصائيات المدرسة
  studentCount: number = 0;
  teacherCount: number = 0;
  lessonCount: number = 0;
  
  // بيانات المستخدم
  userName: string = 'جاري التحميل...';
  userRole: string = '';
  userAvatar: string = 'https://ui-avatars.com/api/?name=User&background=random';
  
  // بيانات المدرسة
  schoolName: string = 'نظام المنارة';
  schoolId: string = '';
  schoolKey: string = '';
  
  // الإشعارات
  notificationCount: number = 0;
  searchTerm: any;
  
  isRinging: boolean = false;
  isLoadingNotifications: boolean = false;
  isLoading: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSchoolData();
    this.loadUserData();
    this.loadStats();
    this.loadNotificationCount();
    
    // تحديث الإحصائيات كل 5 دقائق
    setInterval(() => this.loadStats(), 300000);
    setInterval(() => this.checkForNewNotifications(), 60000);
  }

  /**
   * ✅ جلب بيانات المدرسة من localStorage
   */
  loadSchoolData(): void {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        const school = JSON.parse(schoolData);
        this.schoolName = school.name || 'نظام المنارة';
        this.schoolId = school._id || '';
        this.schoolKey = school.schoolKey || '';
        console.log('🏫 تم تحميل بيانات المدرسة:', { 
          name: this.schoolName, 
          id: this.schoolId,
          key: this.schoolKey 
        });
      } else {
        console.warn('⚠️ لم يتم العثور على بيانات المدرسة في localStorage');
        this.schoolName = 'نظام المنارة';
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات المدرسة:', error);
      this.schoolName = 'نظام المنارة';
    }
  }

  /**
   * ✅ جلب الإحصائيات الخاصة بالمدرسة فقط
   */
  loadStats(): void {
    this.isLoading = true;

    // التأكد من وجود schoolId
    if (!this.schoolId && !this.schoolKey) {
      console.warn('⚠️ لا يوجد schoolId أو schoolKey، سيتم استخدام الطريقة العامة');
      this.loadStatsLegacy();
      return;
    }

    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // ✅ استخدام نقطة النهاية الموحدة مع schoolId
    const params = new URLSearchParams();
    if (this.schoolId) {
      params.set('schoolId', this.schoolId);
    } else if (this.schoolKey) {
      params.set('schoolKey', this.schoolKey);
    }

    const url = `${this.apiUrl}/dashboard/stats?${params.toString()}`;
    
    this.http.get<{ success: boolean; data: { students: number; teachers: number; classes: number } }>(url, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.studentCount = response.data.students || 0;
            this.teacherCount = response.data.teachers || 0;
            this.lessonCount = response.data.classes || 0;
            console.log('📊 تم تحديث الإحصائيات:', {
              students: this.studentCount,
              teachers: this.teacherCount,
              classes: this.lessonCount
            });
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ خطأ في جلب إحصائيات المدرسة:', err);
          this.loadStatsLegacy();
        }
      });
  }

  /**
   * ✅ الطريقة القديمة (كحل احتياطي) - مع إضافة schoolId كـ query parameter
   */
  private loadStatsLegacy(): void {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // إضافة schoolId إلى جميع الطلبات
    const params = new URLSearchParams();
    if (this.schoolId) {
      params.set('schoolId', this.schoolId);
    }

    forkJoin({
      students: this.http.get<{ count: number }>(`${this.apiUrl}/count/students?${params.toString()}`, { headers }),
      teachers: this.http.get<{ count: number }>(`${this.apiUrl}/count/teachers?${params.toString()}`, { headers }),
      classes: this.http.get<{ count: number }>(`${this.apiUrl}/count/classes?${params.toString()}`, { headers })
    }).subscribe({
      next: (res) => {
        this.studentCount = res.students.count || 0;
        this.teacherCount = res.teachers.count || 0;
        this.lessonCount = res.classes.count || 0;
        this.isLoading = false;
        console.log('📊 تم تحديث الإحصائيات (طريقة احتياطية):', {
          students: this.studentCount,
          teachers: this.teacherCount,
          classes: this.lessonCount
        });
      },
      error: (err) => {
        console.error('❌ خطأ في جلب الإحصائيات:', err);
        this.isLoading = false;
        this.studentCount = 0;
        this.teacherCount = 0;
        this.lessonCount = 0;
      }
    });
  }

  /**
   * جلب بيانات المستخدم من localStorage
   */
  loadUserData(): void {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.userName = user.fullName || user.username || 'مستخدم';
        this.userRole = this.getRoleLabel(user.role || '');
        this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=4361ee&color=fff`;
      } else {
        this.userName = 'ياسر خيشه';
        this.userRole = 'مدير النظام';
        this.userAvatar = 'https://ui-avatars.com/api/?name=ياسر+خيشه&background=4361ee&color=fff';
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
      this.userName = 'ياسر خيشه';
      this.userRole = 'مدير النظام';
      this.userAvatar = 'https://ui-avatars.com/api/?name=ياسر+خيشه&background=4361ee&color=fff';
    }
  }

  /**
   * تحويل الدور إلى تسمية عربية
   */
  private getRoleLabel(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'مدير النظام',
      'super_admin': 'مدير عام',
      'manager': 'مدير',
      'secretary': 'سكرتير',
      'accountant': 'محاسب',
      'teacher': 'أستاذ',
      'student': 'طالب'
    };
    return roleMap[role] || role;
  }

  /**
   * جلب عدد الإشعارات
   */
  loadNotificationCount(): void {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.get<{ count: number }>(`${this.apiUrl}/notifications/count`, { headers }).subscribe({
      next: (data) => {
        const oldCount = this.notificationCount;
        this.notificationCount = data.count || 0;
        
        if (this.notificationCount > oldCount) {
          this.ringBell();
        }
      },
      error: (err) => {
        console.error('❌ خطأ في جلب عدد الإشعارات:', err);
        this.notificationCount = 0;
      }
    });
  }

  /**
   * التحقق من وجود إشعارات جديدة
   */
  checkForNewNotifications(): void {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.get<boolean>(`${this.apiUrl}/notifications/check-new`, { headers }).subscribe({
      next: (hasNew) => {
        if (hasNew) {
          this.ringBell();
          this.loadNotificationCount();
        }
      },
      error: (err) => console.error('❌ خطأ في التحقق من الإشعارات:', err)
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
}