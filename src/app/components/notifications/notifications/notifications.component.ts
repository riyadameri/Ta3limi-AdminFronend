import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';
interface NotificationData {
  success: boolean;
  timestamp: Date;
  unreadCount: number;
  categories: {
    latePayments: {
      title: string;
      count: number;
      data: any[];
      icon: string;
      color: string;
    };
    frequentAbsentees: {
      title: string;
      count: number;
      data: any[];
      icon: string;
      color: string;
    };
    todayClasses: {
      title: string;
      count: number;
      data: any[];
      summary: any;
      icon: string;
      color: string;
    };
    todayPayments: {
      title: string;
      count: number;
      data: any[];
      summary: any;
      icon: string;
      color: string;
    };
  };
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- خلفية معتمة - تظهر فقط عندما تكون النافذة مفتوحة -->
    <div class="notifications-overlay" *ngIf="isOpen" (click)="close()"></div>
    
    <!-- نافذة الإشعارات - تظهر فقط عندما تكون مفتوحة -->
    <div class="notifications-panel" dir="rtl" [class.open]="isOpen" *ngIf="isOpen">
      <div class="notifications-header">
        <div class="header-title">
          <i class="fas fa-bell"></i>
          <h3>الإشعارات</h3>
          <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" (click)="refreshNotifications($event)" [class.spinning]="isRefreshing" title="تحديث">
            <i class="fas fa-sync-alt"></i>
          </button>
          <button class="btn-close" (click)="close()" title="إغلاق">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="notifications-body" *ngIf="!loading; else loadingTemplate">
        <!-- الطلبة المتأخرين في الدفع -->
        <div class="notification-category" *ngIf="categories.latePayments.count > 0">
          <div class="category-header" [style.background]="categories.latePayments.color + '10'">
            <i class="fas fa-exclamation-triangle" [style.color]="categories.latePayments.color"></i>
            <span>{{ categories.latePayments.title }}</span>
            <span class="category-count" [style.background]="categories.latePayments.color">{{ categories.latePayments.count }}</span>
          </div>
          <div class="category-items">
            <div class="notification-item" *ngFor="let student of categories.latePayments.data.slice(0, 5)" 
                 (click)="navigateTo(['/home/students-management', student._id])">
              <div class="item-icon" [style.background]="categories.latePayments.color + '20'">
                <i class="fas fa-user-graduate" [style.color]="categories.latePayments.color"></i>
              </div>
              <div class="item-content">
                <div class="item-title">{{ student.name }}</div>
                <div class="item-details">
                  <span>المبلغ: {{ student.totalAmountDue | number }} د.ج</span>
                  <span>· {{ student.monthsLateCount || student.monthsLate?.length || 0 }} أشهر</span>
                </div>
                <div class="item-time" *ngIf="student.parentPhone">📞 {{ student.parentPhone }}</div>
              </div>
              <button class="item-action" (click)="$event.stopPropagation(); navigateTo(['/home/payments-management'], {student: student._id})">
                <i class="fas fa-credit-card"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- الطلبة الغائبين أكثر من 3 حصص -->
        <div class="notification-category" *ngIf="categories.frequentAbsentees.count > 0">
          <div class="category-header" [style.background]="categories.frequentAbsentees.color + '10'">
            <i class="fas fa-user-graduate" [style.color]="categories.frequentAbsentees.color"></i>
            <span>{{ categories.frequentAbsentees.title }}</span>
            <span class="category-count" [style.background]="categories.frequentAbsentees.color">{{ categories.frequentAbsentees.count }}</span>
          </div>
          <div class="category-items">
            <div class="notification-item" *ngFor="let student of categories.frequentAbsentees.data.slice(0, 5)" 
                 (click)="navigateTo(['/home/students-management', student._id])">
              <div class="item-icon" [style.background]="categories.frequentAbsentees.color + '20'">
                <i class="fas fa-calendar-times" [style.color]="categories.frequentAbsentees.color"></i>
              </div>
              <div class="item-content">
                <div class="item-title">{{ student.name }}</div>
                <div class="item-details">
                  <span>غائب: {{ student.absentCount || student.stats?.absent || 0 }} مرة</span>
                  <span *ngIf="student.stats?.attendanceRate">· {{ student.stats.attendanceRate }}%</span>
                </div>
                <div class="item-time" *ngIf="student.parentPhone">📞 {{ student.parentPhone }}</div>
              </div>
              <button class="item-action" (click)="$event.stopPropagation(); navigateTo(['/home/attendance'], {student: student._id})">
                <i class="fas fa-calendar-check"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- حصص اليوم -->
        <div class="notification-category" *ngIf="categories.todayClasses.count > 0">
          <div class="category-header" [style.background]="categories.todayClasses.color + '10'">
            <i class="fas fa-chalkboard-teacher" [style.color]="categories.todayClasses.color"></i>
            <span>{{ categories.todayClasses.title }}</span>
            <span class="category-count" [style.background]="categories.todayClasses.color">{{ categories.todayClasses.count }}</span>
          </div>
          <div class="category-items">
            <div class="notification-item" *ngFor="let class of categories.todayClasses.data.slice(0, 5)" 
                 (click)="navigateTo(['/home/lesson-detail', class._id])">
              <div class="item-icon" [style.background]="categories.todayClasses.color + '20'">
                <i class="fas fa-book-open" [style.color]="categories.todayClasses.color"></i>
              </div>
              <div class="item-content">
                <div class="item-title">{{ class.name || 'حصة' }}</div>
                <div class="item-details">
                  <span>{{ class.teacher }}</span>
                  <span>· {{ class.time }}</span>
                </div>
                <div class="item-time">
                  {{ class.classroom }}
                  <span *ngIf="class.studentsCount">· {{ class.studentsCount }} طالب</span>
                </div>
              </div>
              <button class="item-action" (click)="$event.stopPropagation(); navigateTo(['/home/live-class'], {class: class._id})">
                <i class="fas fa-play"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- مدفوعات اليوم -->
        <div class="notification-category" *ngIf="categories.todayPayments.count > 0">
          <div class="category-header" [style.background]="categories.todayPayments.color + '10'">
            <i class="fas fa-credit-card" [style.color]="categories.todayPayments.color"></i>
            <span>{{ categories.todayPayments.title }}</span>
            <span class="category-count" [style.background]="categories.todayPayments.color">{{ categories.todayPayments.count }}</span>
          </div>
          <div class="category-items">
            <div class="notification-item" *ngFor="let payment of categories.todayPayments.data.slice(0, 5)" 
                 (click)="navigateTo(['/home/payments-management'], {id: payment._id})">
              <div class="item-icon" [style.background]="categories.todayPayments.color + '20'">
                <i class="fas fa-money-bill-wave" [style.color]="categories.todayPayments.color"></i>
              </div>
              <div class="item-content">
                <div class="item-title">{{ payment.student || payment.student?.name || 'طالب' }}</div>
                <div class="item-details">
                  <span>{{ payment.amount | number }} د.ج</span>
                  <span>· {{ payment.month }}</span>
                </div>
                <div class="item-time">{{ payment.className || payment.class?.name || 'بدون حصة' }}</div>
              </div>
              <button class="item-action" (click)="$event.stopPropagation(); navigateTo(['/home/payments-management'], {pay: payment._id})">
                <i class="fas fa-check-circle"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- لا توجد إشعارات -->
        <div class="no-notifications" *ngIf="unreadCount === 0 && !loading">
          <i class="fas fa-bell-slash"></i>
          <p>لا توجد إشعارات جديدة</p>
        </div>
      </div>

      <div class="notifications-footer">
        <button class="btn-mark-all-read" (click)="markAllAsRead($event)" [disabled]="unreadCount === 0">
          <i class="fas fa-check-double"></i>
          تحديد الكل كمقروء
        </button>
      </div>
    </div>

    <ng-template #loadingTemplate>
      <div class="notifications-loading">
        <div class="spinner"></div>
        <p>جاري تحميل الإشعارات...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .notifications-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(2px);
      z-index: 999;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .notifications-panel {
      position: fixed;
      top: 80px;
      left: 20px;
      width: 420px;
      max-width: calc(100vw - 40px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 100px);
      transform: translateX(150%);
      transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      border: 1px solid #f0f2f5;
    }

    .notifications-panel.open {
      transform: translateX(0);
    }

    .notifications-header {
      padding: 20px;
      border-bottom: 1px solid #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title i {
      font-size: 1.3rem;
      color: #4361ee;
    }

    .header-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #2b2d42;
    }

    .badge {
      background: #f72585;
      color: white;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 20px;
      min-width: 20px;
      text-align: center;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn-refresh, .btn-close {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: #f8f9fa;
      color: #8d99ae;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-refresh:hover {
      background: #e9ecef;
      color: #4361ee;
    }

    .btn-close:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .notifications-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      scrollbar-width: thin;
    }

    .notifications-body::-webkit-scrollbar {
      width: 4px;
    }

    .notifications-body::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .notifications-body::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 4px;
    }

    .notification-category {
      margin-bottom: 24px;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .category-count {
      margin-right: auto;
      padding: 2px 8px;
      border-radius: 20px;
      color: white;
      font-size: 0.75rem;
    }

    .category-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .notification-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      background: #f8f9fa;
      transition: all 0.3s;
      cursor: pointer;
    }

    .notification-item:hover {
      background: #f1f3f5;
      transform: translateX(-4px);
    }

    .item-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-content {
      flex: 1;
      min-width: 0;
    }

    .item-title {
      font-weight: 600;
      color: #2b2d42;
      font-size: 0.95rem;
      margin-bottom: 4px;
    }

    .item-details {
      font-size: 0.8rem;
      color: #8d99ae;
      margin-bottom: 4px;
      display: flex;
      gap: 8px;
    }

    .item-time {
      font-size: 0.7rem;
      color: #adb5bd;
    }

    .item-action {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: white;
      color: #8d99ae;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-action:hover {
      background: #4361ee;
      color: white;
    }

    .no-notifications {
      text-align: center;
      padding: 40px 20px;
      color: #8d99ae;
    }

    .no-notifications i {
      font-size: 3rem;
      margin-bottom: 12px;
    }

    .no-notifications p {
      margin: 0;
      font-size: 0.95rem;
    }

    .notifications-footer {
      padding: 16px 20px;
      border-top: 1px solid #f0f2f5;
    }

    .btn-mark-all-read {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: none;
      background: #f8f9fa;
      color: #2b2d42;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-mark-all-read:hover:not(:disabled) {
      background: #e9ecef;
      color: #4361ee;
    }

    .btn-mark-all-read:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .notifications-loading {
      padding: 40px 20px;
      text-align: center;
      color: #8d99ae;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f2f5;
      border-top-color: #4361ee;
      border-radius: 50%;
      margin: 0 auto 12px;
      animation: spin 1s linear infinite;
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Output() onClose = new EventEmitter<void>();
  
  private apiUrl = environment.apiUrl;
  
  isOpen = false; // القيمة الافتراضية false (النافذة مغلقة)
  loading = false;
  isRefreshing = false;
  unreadCount = 0;
  categories: NotificationData['categories'] = {
    latePayments: { title: '', count: 0, data: [], icon: '', color: '' },
    frequentAbsentees: { title: '', count: 0, data: [], icon: '', color: '' },
    todayClasses: { title: '', count: 0, data: [], summary: null, icon: '', color: '' },
    todayPayments: { title: '', count: 0, data: [], summary: null, icon: '', color: '' }
  };
  
  private refreshSubscription?: Subscription;
  private clickOutsideListener?: any;
  private escapeListener?: any;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // تحديث تلقائي كل 5 دقائق عندما تكون النافذة مفتوحة
    this.refreshSubscription = interval(5 * 60 * 1000)
      .pipe(switchMap(() => {
        if (this.isOpen) {
          return this.http.get<NotificationData>(`${this.apiUrl}/notifications/all`);
        }
        return [];
      }))
      .subscribe({
        next: (data) => {
          if (data) {
            this.updateNotifications(data);
          }
        },
        error: (err) => console.error('Auto-refresh error:', err)
      });

    // إغلاق بالضغط على ESC
    this.escapeListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeListener);

    // إغلاق عند تغيير المسار
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isOpen) {
          this.close();
        }
      });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.removeClickListener();
    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
    }
  }

  open(): void {
    console.log('Opening notifications'); // للتصحيح
    this.isOpen = true;
    this.loadNotifications();
    this.addClickListener();
  }

  close(): void {
    console.log('Closing notifications'); // للتصحيح
    this.isOpen = false;
    this.onClose.emit();
    this.removeClickListener();
  }

  private addClickListener(): void {
    // تأخير بسيط لتجنب التعارض مع حدث النقر الذي فتح النافذة
    setTimeout(() => {
      this.clickOutsideListener = (event: MouseEvent) => {
        const panel = document.querySelector('.notifications-panel');
        const overlay = document.querySelector('.notifications-overlay');
        const bell = document.querySelector('.notification-wrapper');
        
        // التحقق إذا كان النقر خارج النافذة
        if (panel && !panel.contains(event.target as Node) && 
            overlay && !overlay.contains(event.target as Node) &&
            bell && !bell.contains(event.target as Node)) {
          console.log('Click outside detected, closing'); // للتصحيح
          this.close();
        }
      };
      
      document.addEventListener('click', this.clickOutsideListener);
    }, 100);
  }

  private removeClickListener(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener);
    }
  }

  loadNotifications(): void {
    this.loading = true;
    this.http.get<NotificationData>(`${this.apiUrl}/notifications/all`).subscribe({
      next: (data) => {
        this.updateNotifications(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.loading = false;
        this.unreadCount = 0;
      }
    });
  }

  refreshNotifications(event: Event): void {
    event.stopPropagation();
    this.isRefreshing = true;
    this.http.get<NotificationData>(`${this.apiUrl}/notifications/all`).subscribe({
      next: (data) => {
        this.updateNotifications(data);
        this.isRefreshing = false;
      },
      error: (err) => {
        console.error('Error refreshing notifications:', err);
        this.isRefreshing = false;
      }
    });
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.http.post(`${this.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        this.unreadCount = 0;
      },
      error: (err) => console.error('Error marking all as read:', err)
    });
  }

  navigateTo(commands: any[], queryParams?: any): void {
    this.close();
    setTimeout(() => {
      this.router.navigate(commands, { queryParams });
    }, 300);
  }

  private updateNotifications(data: NotificationData): void {
    this.unreadCount = data.unreadCount;
    this.categories = data.categories;
  }
}