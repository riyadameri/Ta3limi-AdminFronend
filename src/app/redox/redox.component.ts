import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// =============================================
// واجهات البيانات
// =============================================

export interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
  details: string[];
}

export interface Plan {
  name: string;
  icon: string;
  price: string;
  students: string;
  teachers: string;
  classes: string;
  features: string[];
  isPopular?: boolean;
  color: string;
  badge?: string;
}

export interface StudentData {
  name: string;
  id: string;
  year: string;
  classes: StudentClass[];
  payments: Payment[];
  absences: Absence[];
  schedule: Schedule[];
  notifications: Notification[];
}

export interface StudentClass {
  name: string;
  subject: string;
  teacher: string;
  price: number;
  days: string[];
  time: string;
}

export interface Payment {
  month: string;
  amount: number;
  status: 'paid' | 'pending' | 'late' | 'cancelled';
  date?: string;
  invoice?: string;
}

export interface Absence {
  date: string;
  class: string;
  status: 'present' | 'absent' | 'late';
  notified: boolean;
}

export interface Schedule {
  day: string;
  time: string;
  subject: string;
  classroom: string;
}

export interface Notification {
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  date: string;
  icon: string;
  read: boolean;
}

export interface OrderItem {
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  schoolName: string;
  phone: string;
  email: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  date: string;
  notes: string;
}

export interface NavItem {
  label: string;
  icon: string;
  link: string;
  dropdown?: NavItem[];
}

@Component({
  selector: 'app-redox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ============================================= -->
    <!-- الهيدر المتكامل مع أزرار متعددة -->
    <!-- ============================================= -->

    <header class="main-header" [class.scrolled]="isScrolled">
      <div class="container">
        <div class="header-content">
          
          <!-- الشعار -->
          <div class="logo">
            <a (click)="scrollToSection('home'); $event.preventDefault()">
              <i class="fas fa-graduation-cap"></i>
              <span>Redox</span>
            </a>
          </div>

          <!-- القائمة الرئيسية -->
          <nav class="main-nav" [class.open]="isMobileMenuOpen">
            <ul class="nav-list">
              <li *ngFor="let item of navItems" class="nav-item" [class.has-dropdown]="item.dropdown">
                <a (click)="scrollToSection(item.link); $event.preventDefault()" class="nav-link">
                  <i class="fas" [class]="item.icon"></i>
                  {{ item.label }}
                </a>
                <!-- القائمة المنسدلة -->
                <ul class="dropdown-menu" *ngIf="item.dropdown">
                  <li *ngFor="let subItem of item.dropdown">
                    <a (click)="scrollToSection(subItem.link); $event.preventDefault()">
                      <i class="fas" [class]="subItem.icon"></i>
                      {{ subItem.label }}
                    </a>
                  </li>
                </ul>
              </li>
            </ul>

            <!-- أزرار الإجراءات -->
            <div class="nav-actions">
              <button class="btn-nav-primary" (click)="scrollToSection('plans')">
                <i class="fas fa-rocket"></i>
                ابدأ الآن
              </button>
              <button class="btn-nav-secondary" (click)="scrollToSection('orders')">
                <i class="fas fa-shopping-cart"></i>
                المتجر
              </button>
            </div>
          </nav>

          <!-- زر القائمة للجوال -->
          <button class="mobile-menu-btn" (click)="toggleMobileMenu()" [class.active]="isMobileMenuOpen">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>

    <!-- ============================================= -->
    <!-- الهيرو سكشن -->
    <!-- ============================================= -->

    <section class="hero-section" id="home">
      <div class="hero-overlay"></div>
      <div class="particles">
        <span *ngFor="let p of [].constructor(30)"></span>
      </div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">
            <i class="fas fa-rocket"></i>
            النظام الذكي لإدارة المدارس
            <span class="badge-new">جديد</span>
          </div>
          <h1>
            منصة <span>Redox</span> المتكاملة
            <br>
            <span class="highlight">لإدارة المدارس والطلاب</span>
          </h1>
          <p class="hero-description">
            نظام متكامل لإدارة المدارس يشمل إدارة الطلاب والمعلمين والحصص والمدفوعات والحضور والغياب
            مع نظام اشتراكات مرن وتقارير شاملة ومتابعة يومية عبر الهاتف.
          </p>
          <div class="hero-buttons">
            <button class="btn-primary" (click)="scrollToSection('plans')">
              <i class="fas fa-crown"></i>
              ابدأ الآن
            </button>
            <button class="btn-secondary" (click)="scrollToSection('features')">
              <i class="fas fa-info-circle"></i>
              تعرف على المزيد
            </button>
            <button class="btn-secondary" (click)="scrollToSection('student-dashboard')">
              <i class="fas fa-user-graduate"></i>
              فضاء الطالب
            </button>
            <button class="btn-secondary" (click)="scrollToSection('teacher-dashboard')">
              <i class="fas fa-chalkboard-teacher"></i>
              فضاء المعلم
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم الإحصائيات -->
    <!-- ============================================= -->

    <section class="stats-section" id="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let stat of stats">
            <div class="stat-icon" [style.background]="stat.color + '22'">
              <i class="fas" [class]="stat.icon" [style.color]="stat.color"></i>
            </div>
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم الميزات الرئيسية -->
    <!-- ============================================= -->

    <section class="features-section" id="features">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">✨ الميزات</span>
          <h2>ماذا يقدم لك نظام <span>Redox</span>؟</h2>
          <p>نظام متكامل يوفر جميع الأدوات التي تحتاجها لإدارة مدرستك بكفاءة</p>
        </div>

        <div class="features-grid">
          <div class="feature-card" *ngFor="let feature of features">
            <div class="feature-icon" [style.background-color]="feature.color + '22'">
              <i class="fas" [class]="feature.icon" [style.color]="feature.color"></i>
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <div class="feature-details">
              <div class="feature-detail" *ngFor="let detail of feature.details">
                <i class="fas fa-check-circle" [style.color]="feature.color"></i>
                <span>{{ detail }}</span>
              </div>
            </div>
            <div class="feature-line" [style.background-color]="feature.color"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم فضاء الطالب -->
    <!-- ============================================= -->

    <section class="student-section" id="student-dashboard">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">👨‍🎓 فضاء الطالب</span>
          <h2>واجهة <span>الطالب</span> الشخصية</h2>
          <p>تابع دراستك ومدفوعاتك وغياباتك من خلال واجهة متكاملة</p>
        </div>

        <div class="student-dashboard">
          <!-- معلومات الطالب -->
          <div class="student-header">
            <div class="student-avatar">
              <span>{{ studentData.name.charAt(0) }}</span>
            </div>
            <div class="student-info">
              <h3>{{ studentData.name }}</h3>
              <div class="student-meta">
                <span><i class="fas fa-id-card"></i> {{ studentData.id }}</span>
                <span><i class="fas fa-graduation-cap"></i> {{ studentData.year }}</span>
                <span class="status-badge active"><i class="fas fa-circle"></i> نشط</span>
              </div>
            </div>
            <div class="student-notifications-badge">
              <i class="fas fa-bell"></i>
              <span class="badge">{{ unreadNotifications }}</span>
            </div>
          </div>

          <!-- تبويبات الطالب -->
          <div class="student-tabs">
            <button class="tab-btn" [class.active]="activeStudentTab === 'profile'" (click)="setActiveStudentTab('profile')">
              <i class="fas fa-user"></i> ملفي الشخصي
            </button>
            <button class="tab-btn" [class.active]="activeStudentTab === 'classes'" (click)="setActiveStudentTab('classes')">
              <i class="fas fa-book"></i> حصصي
            </button>
            <button class="tab-btn" [class.active]="activeStudentTab === 'payments'" (click)="setActiveStudentTab('payments')">
              <i class="fas fa-money-bill-wave"></i> مدفوعاتي
            </button>
            <button class="tab-btn" [class.active]="activeStudentTab === 'attendance'" (click)="setActiveStudentTab('attendance')">
              <i class="fas fa-clipboard-list"></i> غياباتي
            </button>
            <button class="tab-btn" [class.active]="activeStudentTab === 'schedule'" (click)="setActiveStudentTab('schedule')">
              <i class="fas fa-calendar-alt"></i> جدول الدراسة
            </button>
            <button class="tab-btn" [class.active]="activeStudentTab === 'notifications'" (click)="setActiveStudentTab('notifications')">
              <i class="fas fa-bell"></i> الإشعارات
            </button>
          </div>

          <!-- محتوى تبويبات الطالب -->
          <div class="student-content">
            <!-- الملف الشخصي -->
            <div *ngIf="activeStudentTab === 'profile'" class="tab-content">
              <div class="profile-grid">
                <div class="profile-card">
                  <h4><i class="fas fa-user"></i> المعلومات الشخصية</h4>
                  <div class="info-row"><span>الاسم الكامل</span><span>{{ studentData.name }}</span></div>
                  <div class="info-row"><span>رقم الطالب</span><span>{{ studentData.id }}</span></div>
                  <div class="info-row"><span>السنة الدراسية</span><span>{{ studentData.year }}</span></div>
                  <div class="info-row"><span>عدد الحصص</span><span>{{ studentData.classes.length }}</span></div>
                  <div class="info-row"><span>المدفوعات</span><span>{{ totalPaidPayments }} / {{ totalPayments }}</span></div>
                  <div class="info-row"><span>الغيابات</span><span>{{ totalAbsentAbsences }}</span></div>
                </div>
                <div class="profile-card">
                  <h4><i class="fas fa-chart-line"></i> ملخص الأداء</h4>
                  <div class="performance-stats">
                    <div class="perf-item">
                      <span>نسبة الحضور</span>
                      <div class="progress-bar">
                        <div class="progress" [style.width.%]="totalAbsences > 0 ? ((totalPresentAbsences / totalAbsences) * 100) : 100"></div>
                      </div>
                      <span class="perf-value">{{ totalAbsences > 0 ? ((totalPresentAbsences / totalAbsences) * 100) : 100 }}%</span>
                    </div>
                    <div class="perf-item">
                      <span>نسبة الدفع</span>
                      <div class="progress-bar">
                        <div class="progress" [style.width.%]="totalPayments > 0 ? ((totalPaidPayments / totalPayments) * 100) : 0"></div>
                      </div>
                      <span class="perf-value">{{ totalPayments > 0 ? ((totalPaidPayments / totalPayments) * 100) : 0 }}%</span>
                    </div>
                    <div class="perf-item">
                      <span>عدد الحصص</span>
                      <div class="progress-bar">
                        <div class="progress" style="width: 100%"></div>
                      </div>
                      <span class="perf-value">{{ studentData.classes.length }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- الحصص -->
            <div *ngIf="activeStudentTab === 'classes'" class="tab-content">
              <div class="classes-grid">
                <div class="class-item" *ngFor="let cls of studentData.classes">
                  <div class="class-icon" [style.background]="getClassColor(cls.subject)">
                    <i class="fas fa-book"></i>
                  </div>
                  <div class="class-info">
                    <h4>{{ cls.name }}</h4>
                    <span class="class-subject">{{ cls.subject }}</span>
                    <span class="class-teacher"><i class="fas fa-chalkboard-teacher"></i> {{ cls.teacher }}</span>
                    <span class="class-time"><i class="fas fa-clock"></i> {{ cls.time }}</span>
                    <span class="class-days"><i class="fas fa-calendar-day"></i> {{ cls.days.join(' - ') }}</span>
                  </div>
                  <div class="class-price">{{ cls.price }} د.ج</div>
                </div>
              </div>
            </div>

            <!-- المدفوعات -->
            <div *ngIf="activeStudentTab === 'payments'" class="tab-content">
              <div class="payment-stats">
                <div class="payment-stat">
                  <span class="stat-number">{{ totalPaidPayments }}</span>
                  <span class="stat-label">مدفوع</span>
                </div>
                <div class="payment-stat">
                  <span class="stat-number">{{ totalPendingPayments }}</span>
                  <span class="stat-label">معلق</span>
                </div>
                <div class="payment-stat">
                  <span class="stat-number">{{ totalLatePayments }}</span>
                  <span class="stat-label">متأخر</span>
                </div>
                <div class="payment-stat">
                  <span class="stat-number">{{ totalPaymentsAmount }} د.ج</span>
                  <span class="stat-label">الإجمالي</span>
                </div>
              </div>
              <div class="payment-item" *ngFor="let payment of studentData.payments">
                <div class="payment-info">
                  <span class="payment-month">{{ payment.month }}</span>
                  <span class="payment-amount" [class]="payment.status">{{ payment.amount }} د.ج</span>
                  <span class="payment-status" [class]="payment.status">{{ getPaymentStatusText(payment.status) }}</span>
                </div>
                <div class="payment-date">
                  <span *ngIf="payment.date">{{ payment.date }}</span>
                  <span *ngIf="!payment.date" class="pending-text">غير مدفوع</span>
                  <span *ngIf="payment.invoice" class="invoice-link"><i class="fas fa-file-invoice"></i> {{ payment.invoice }}</span>
                </div>
              </div>
            </div>

            <!-- الغيابات -->
            <div *ngIf="activeStudentTab === 'attendance'" class="tab-content">
              <div class="attendance-stats">
                <div class="attendance-stat present">
                  <span>{{ totalPresentAbsences }}</span>
                  <label>حاضر</label>
                </div>
                <div class="attendance-stat absent">
                  <span>{{ totalAbsentAbsences }}</span>
                  <label>غائب</label>
                </div>
                <div class="attendance-stat late">
                  <span>{{ totalLateAbsences }}</span>
                  <label>متأخر</label>
                </div>
              </div>
              <div class="absence-item" *ngFor="let absence of studentData.absences">
                <div class="absence-info">
                  <span class="absence-date">{{ absence.date }}</span>
                  <span class="absence-class">{{ absence.class }}</span>
                </div>
                <div class="absence-status" [class]="absence.status">
                  {{ getAbsenceStatusText(absence.status) }}
                  <span *ngIf="absence.notified" class="notified"><i class="fas fa-check-circle"></i> تم الإشعار</span>
                </div>
              </div>
            </div>

            <!-- جدول الدراسة -->
            <div *ngIf="activeStudentTab === 'schedule'" class="tab-content">
              <div class="schedule-table">
                <div class="schedule-header">
                  <span>اليوم</span>
                  <span>الوقت</span>
                  <span>المادة</span>
                  <span>القاعة</span>
                </div>
                <div class="schedule-row" *ngFor="let s of studentData.schedule">
                  <span class="schedule-day">{{ s.day }}</span>
                  <span class="schedule-time">{{ s.time }}</span>
                  <span class="schedule-subject">{{ s.subject }}</span>
                  <span class="schedule-classroom">{{ s.classroom }}</span>
                </div>
              </div>
            </div>

            <!-- الإشعارات -->
            <div *ngIf="activeStudentTab === 'notifications'" class="tab-content">
              <div class="notification-item" *ngFor="let notif of studentData.notifications" [class.unread]="!notif.read">
                <div class="notification-icon" [class]="notif.type">
                  <i class="fas" [class]="getNotificationIcon(notif.type)"></i>
                </div>
                <div class="notification-content">
                  <p>{{ notif.message }}</p>
                  <span class="notification-date">{{ notif.date }}</span>
                </div>
                <span class="notification-status" *ngIf="!notif.read">جديد</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم فضاء المعلم -->
    <!-- ============================================= -->

    <section class="teacher-section" id="teacher-dashboard">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">👨‍🏫 فضاء المعلم</span>
          <h2>واجهة <span>المعلم</span> الشخصية</h2>
          <p>تابع عمولاتك وطلابك وحصصك من خلال واجهة متكاملة</p>
        </div>

        <div class="teacher-dashboard">
          <!-- معلومات المعلم -->
          <div class="teacher-header">
            <div class="teacher-avatar">
              <span>{{ teacherData.name.charAt(0) }}</span>
            </div>
            <div class="teacher-info">
              <h3>{{ teacherData.name }}</h3>
              <div class="teacher-meta">
                <span><i class="fas fa-id-card"></i> {{ teacherData.id }}</span>
                <span><i class="fas fa-book-open"></i> {{ teacherData.subjects.join(' - ') }}</span>
                <span class="status-badge active"><i class="fas fa-circle"></i> نشط</span>
              </div>
            </div>
          </div>

          <!-- إحصائيات المعلم -->
          <div class="teacher-stats">
            <div class="teacher-stat">
              <span class="stat-number">{{ teacherData.totalCommissions }} د.ج</span>
              <span class="stat-label">إجمالي العمولات</span>
            </div>
            <div class="teacher-stat">
              <span class="stat-number" style="color: #00b894;">{{ teacherData.paidCommissions }} د.ج</span>
              <span class="stat-label">المدفوع</span>
            </div>
            <div class="teacher-stat">
              <span class="stat-number" style="color: #fdcb6e;">{{ teacherData.pendingCommissions }} د.ج</span>
              <span class="stat-label">المتبقي</span>
            </div>
          </div>

          <!-- تبويبات المعلم -->
          <div class="teacher-tabs">
            <button class="tab-btn" [class.active]="activeTeacherTab === 'commissions'" (click)="setActiveTeacherTab('commissions')">
              <i class="fas fa-money-bill-wave"></i> عمولاتي
            </button>
            <button class="tab-btn" [class.active]="activeTeacherTab === 'students'" (click)="setActiveTeacherTab('students')">
              <i class="fas fa-users"></i> طلابي
            </button>
            <button class="tab-btn" [class.active]="activeTeacherTab === 'classes'" (click)="setActiveTeacherTab('classes')">
              <i class="fas fa-book"></i> حصصي
            </button>
          </div>

          <!-- محتوى تبويبات المعلم -->
          <div class="teacher-content">
            <!-- العمولات -->
            <div *ngIf="activeTeacherTab === 'commissions'" class="tab-content">
              <div class="commission-item" *ngFor="let comm of teacherData.commissions">
                <div class="commission-info">
                  <span class="commission-month">{{ comm.month }}</span>
                  <span class="commission-amount">{{ comm.amount }} د.ج</span>
                  <span class="commission-status" [class]="comm.status">{{ comm.status === 'paid' ? '✅ مدفوع' : '⏳ معلق' }}</span>
                </div>
                <div class="commission-date">
                  <span *ngIf="comm.date">{{ comm.date }}</span>
                  <span *ngIf="!comm.date" class="pending-text">غير مدفوع</span>
                </div>
              </div>
            </div>

            <!-- الطلاب -->
            <div *ngIf="activeTeacherTab === 'students'" class="tab-content">
              <div class="student-item" *ngFor="let student of teacherData.students">
                <span class="student-name">{{ student.name }}</span>
                <span class="student-status" [class]="student.status">{{ student.status === 'present' ? '✅ حاضر' : student.status === 'absent' ? '❌ غائب' : '⏰ متأخر' }}</span>
                <span class="student-payment" [class]="student.payment">{{ student.payment === 'paid' ? '✅ مدفوع' : '⏳ معلق' }}</span>
              </div>
            </div>

            <!-- الحصص -->
            <div *ngIf="activeTeacherTab === 'classes'" class="tab-content">
              <div class="class-item" *ngFor="let cls of teacherData.classes">
                <div class="class-info">
                  <h4>{{ cls.name }}</h4>
                  <span>عدد الطلاب: {{ cls.students }}</span>
                  <span>سعر الحصة: {{ cls.price }} د.ج</span>
                </div>
                <div class="class-total">إجمالي العمولة: {{ cls.total }} د.ج</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم طلبات الشراء -->
    <!-- ============================================= -->

    <section class="orders-section" id="orders">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">🛒 طلبات الشراء</span>
          <h2>اطلب <span>البطاقات والطابعات</span></h2>
          <p>قم بشراء بطاقات RFID والطابعات بأسعار تنافسية</p>
        </div>

        <div class="orders-grid">
          <!-- نموذج الطلب -->
          <div class="order-form">
            <h3><i class="fas fa-shopping-cart"></i> طلب جديد</h3>
            <div class="form-group">
              <label>🏫 اسم المدرسة</label>
              <input type="text" [(ngModel)]="orderSchoolName" placeholder="أدخل اسم المدرسة">
            </div>
            <div class="form-group">
              <label>📞 رقم الهاتف</label>
              <input type="tel" [(ngModel)]="orderPhone" placeholder="أدخل رقم الهاتف">
            </div>
            <div class="form-group">
              <label>✉️ البريد الإلكتروني</label>
              <input type="email" [(ngModel)]="orderEmail" placeholder="أدخل البريد الإلكتروني (اختياري)">
            </div>
            
            <div class="order-products">
              <h4>اختر المنتجات</h4>
              <div class="product-item" (click)="addOrderItem('بطاقات RFID', 100)">
                <div class="product-info">
                  <i class="fas fa-id-card"></i>
                  <span>بطاقات RFID</span>
                  <span class="product-price">100 د.ج/بطاقة</span>
                </div>
                <button class="btn-add">+ إضافة</button>
              </div>
              <div class="product-item" (click)="addOrderItem('طابعة البطاقات', 20000)">
                <div class="product-info">
                  <i class="fas fa-print"></i>
                  <span>طابعة البطاقات</span>
                  <span class="product-price">20,000 د.ج/جهاز</span>
                </div>
                <button class="btn-add">+ إضافة</button>
              </div>
              <div class="product-item" (click)="addOrderItem('حزمة كاملة (طابعة + 100 بطاقة)', 30000)">
                <div class="product-info">
                  <i class="fas fa-gift"></i>
                  <span>حزمة كاملة</span>
                  <span class="product-price">30,000 د.ج</span>
                </div>
                <button class="btn-add">+ إضافة</button>
              </div>
            </div>

            <div class="order-items" *ngIf="orderItems.length > 0">
              <h4>المنتجات المختارة</h4>
              <div class="order-item" *ngFor="let item of orderItems; let i = index">
                <span>{{ item.product }}</span>
                <span>{{ item.quantity }} × {{ item.unitPrice }} د.ج</span>
                <span class="item-total">{{ item.total }} د.ج</span>
                <button class="btn-remove" (click)="removeOrderItem(i)">✕</button>
              </div>
              <div class="order-total">
                <span>الإجمالي:</span>
                <span class="total-amount">{{ getOrderTotal() }} د.ج</span>
              </div>
            </div>

            <div class="form-group">
              <label>📝 ملاحظات إضافية</label>
              <textarea [(ngModel)]="orderNotes" placeholder="أي ملاحظات إضافية..."></textarea>
            </div>

            <button class="btn-submit" (click)="submitOrder()" [disabled]="orderItems.length === 0 || !orderSchoolName || !orderPhone">
              <i class="fas fa-paper-plane"></i> إرسال الطلب
            </button>

            <div class="order-success" *ngIf="orderSuccess">
              <i class="fas fa-check-circle"></i>
              <span>تم إرسال طلبك بنجاح! سيتم التواصل معكم خلال 24 ساعة</span>
            </div>
          </div>

          <!-- قائمة الطلبات -->
          <div class="orders-list">
            <h3><i class="fas fa-list"></i> طلباتي السابقة</h3>
            <div class="order-card" *ngFor="let order of orders">
              <div class="order-header">
                <span class="order-id">{{ order.id }}</span>
                <span class="order-status" [class]="order.status">{{ getStatusText(order.status) }}</span>
              </div>
              <div class="order-school">
                <i class="fas fa-school"></i>
                {{ order.schoolName }}
              </div>
              <div class="order-items-list">
                <span *ngFor="let item of order.items">
                  {{ item.product }} ({{ item.quantity }})
                </span>
              </div>
              <div class="order-footer">
                <span class="order-date">{{ order.date }}</span>
                <span class="order-total">{{ order.totalAmount }} د.ج</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم خطط الاشتراك -->
    <!-- ============================================= -->

    <section class="plans-section" id="plans">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">📊 الخطط</span>
          <h2>اختر الخطة المناسبة <span>لمدرستك</span></h2>
          <p>خطط مرنة تناسب جميع احتياجات المدارس بأسعار تنافسية</p>
        </div>

        <div class="plans-grid">
          <div class="plan-card" *ngFor="let plan of plans" [class.popular]="plan.isPopular">
            <div class="plan-badge" *ngIf="plan.badge">
              <i class="fas fa-star"></i>
              {{ plan.badge }}
            </div>
            <div class="plan-icon" [style.background-color]="plan.color + '22'">
              <i class="fas" [class]="plan.icon" [style.color]="plan.color"></i>
            </div>
            <h3>{{ plan.name }}</h3>
            <div class="plan-price">
              <span class="price">{{ plan.price }}</span>
              <span class="period">/ سنة</span>
            </div>
            <div class="plan-limits">
              <div class="limit-item">
                <i class="fas fa-user-graduate"></i>
                <span>{{ plan.students }} طالب</span>
              </div>
              <div class="limit-item">
                <i class="fas fa-chalkboard-teacher"></i>
                <span>{{ plan.teachers }} معلم</span>
              </div>
              <div class="limit-item">
                <i class="fas fa-book-open"></i>
                <span>{{ plan.classes }} حصة</span>
              </div>
            </div>
            <ul class="plan-features">
              <li *ngFor="let feature of plan.features">
                <i class="fas fa-check-circle" [style.color]="plan.color"></i>
                {{ feature }}
              </li>
            </ul>
            <button class="btn-plan" [style.background-color]="plan.color">
              <i class="fas fa-arrow-left"></i>
              اختر الخطة
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم المميزات الإضافية -->
    <!-- ============================================= -->

    <section class="benefits-section" id="benefits">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">💎 المميزات</span>
          <h2>لماذا تختار <span>Redox</span>؟</h2>
          <p>مميزات تجعل نظامنا الخيار الأمثل لإدارة مدرستك</p>
        </div>

        <div class="benefits-grid">
          <div class="benefit-card" *ngFor="let benefit of benefits">
            <div class="benefit-icon">
              <i class="fas" [class]="benefit.icon"></i>
            </div>
            <h4>{{ benefit.title }}</h4>
            <p>{{ benefit.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم الأسئلة الشائعة -->
    <!-- ============================================= -->

    <section class="faq-section" id="faq">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">❓ الأسئلة</span>
          <h2>الأسئلة <span>الشائعة</span></h2>
          <p>إجابات على أكثر الأسئلة تكراراً حول النظام</p>
        </div>

        <div class="faq-grid">
          <div class="faq-item" *ngFor="let faq of faqs; let i = index">
            <div class="faq-question" (click)="faq.open = !faq.open">
              <span>{{ faq.question }}</span>
              <i class="fas" [class]="faq.open ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </div>
            <div class="faq-answer" [class.open]="faq.open">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- قسم الدعوة للتسجيل -->
    <!-- ============================================= -->

    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>جاهز لبدء رحلتك مع <span>Redox</span>؟</h2>
          <p>انضم إلى أكثر من 50 مدرسة يستخدمون نظامنا لإدارة مؤسساتهم التعليمية</p>
          <div class="cta-buttons">
            <button class="btn-cta-primary" (click)="scrollToSection('plans')">
              <i class="fas fa-rocket"></i>
              ابدأ الآن مجاناً
            </button>
            <button class="btn-cta-secondary" (click)="scrollToSection('orders')">
              <i class="fas fa-shopping-cart"></i>
              اطلب البطاقات والطابعات
            </button>
            <button class="btn-cta-secondary" (click)="scrollToSection('features')">
              <i class="fas fa-info-circle"></i>
              تعرف على المزيد
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================= -->
    <!-- التذييل -->
    <!-- ============================================= -->

    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="footer-logo">
              <i class="fas fa-graduation-cap"></i>
              <span>Redox</span>
            </div>
            <p>منصة ذكية لإدارة المدارس والطلاب، تجمع بين التكنولوجيا الحديثة والسهولة في الاستخدام.</p>
            <div class="footer-social">
              <a href="#"><i class="fab fa-facebook"></i></a>
              <a href="#"><i class="fab fa-twitter"></i></a>
              <a href="#"><i class="fab fa-linkedin"></i></a>
              <a href="#"><i class="fab fa-youtube"></i></a>
              <a href="#"><i class="fab fa-instagram"></i></a>
            </div>
          </div>
          <div class="footer-links">
            <div class="footer-column">
              <h4>النظام</h4>
              <a (click)="scrollToSection('features'); $event.preventDefault()">الميزات</a>
              <a (click)="scrollToSection('plans'); $event.preventDefault()">الخطط</a>
              <a (click)="scrollToSection('student-dashboard'); $event.preventDefault()">فضاء الطالب</a>
              <a (click)="scrollToSection('teacher-dashboard'); $event.preventDefault()">فضاء المعلم</a>
            </div>
            <div class="footer-column">
              <h4>المنتجات</h4>
              <a (click)="scrollToSection('orders'); $event.preventDefault()">بطاقات RFID</a>
              <a (click)="scrollToSection('orders'); $event.preventDefault()">طابعات البطاقات</a>
              <a (click)="scrollToSection('orders'); $event.preventDefault()">حزمة كاملة</a>
            </div>
            <div class="footer-column">
              <h4>الدعم</h4>
              <a (click)="scrollToSection('faq'); $event.preventDefault()">الأسئلة الشائعة</a>
            </div>
            <div class="footer-column">
              <h4>قانوني</h4>
              <a href="#">سياسة الخصوصية</a>
              <a href="#">شروط الخدمة</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} <strong>Redox</strong>. جميع الحقوق محفوظة.</p>
          <p class="footer-version">الإصدار 2.0.0</p>
        </div>
      </div>
    </footer>

    <!-- زر العودة للأعلى -->
    <button class="back-to-top" id="backToTop" (click)="scrollToTop()">
      <i class="fas fa-chevron-up"></i>
    </button>
  `,
  styles: [`
    /* ============================================= */
    /* IMPORT FONTS & BASE */
    /* ============================================= */

    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');

    :host {
      display: block;
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      background: #f8f9fa;
      color: #1a1a2e;
    }

    .container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* ============================================= */
    /* MAIN HEADER - الهيدر الرئيسي */
    /* ============================================= */

    .main-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(26, 26, 46, 0.95);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      padding: 15px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .main-header.scrolled {
      background: rgba(26, 26, 46, 0.98);
      padding: 10px 0;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    /* ===== LOGO ===== */
    .logo a {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: white;
      font-size: 24px;
      font-weight: 800;
      cursor: pointer;
    }

    .logo i {
      color: #e94560;
      font-size: 28px;
    }

    .logo span {
      background: linear-gradient(135deg, #e94560, #fdcb6e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ===== NAVIGATION ===== */
    .main-nav {
      display: flex;
      align-items: center;
      gap: 30px;
      flex: 1;
      justify-content: flex-end;
    }

    .nav-list {
      display: flex;
      list-style: none;
      gap: 5px;
      margin: 0;
      padding: 0;
      align-items: center;
    }

    .nav-item {
      position: relative;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      transition: all 0.3s;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .nav-link:hover {
      color: white;
      background: rgba(255, 255, 255, 0.08);
    }

    .nav-link i {
      font-size: 14px;
    }

    .nav-item.has-dropdown .nav-link::after {
      content: '▾';
      font-size: 10px;
      margin-right: 5px;
    }

    /* ===== DROPDOWN ===== */
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 8px;
      min-width: 200px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s ease;
      list-style: none;
      margin: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }

    .nav-item:hover .dropdown-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-menu li a {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(255, 255, 255, 0.7);
      padding: 10px 14px;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.3s;
      font-size: 14px;
      cursor: pointer;
    }

    .dropdown-menu li a:hover {
      background: rgba(233, 69, 96, 0.15);
      color: #e94560;
    }

    .dropdown-menu li a i {
      color: #e94560;
      width: 18px;
    }

    /* ===== NAV ACTIONS ===== */
    .nav-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .btn-nav-primary {
      background: #e94560;
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }

    .btn-nav-primary:hover {
      background: #c23152;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(233, 69, 96, 0.3);
    }

    .btn-nav-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }

    .btn-nav-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    /* ===== MOBILE MENU ===== */
    .mobile-menu-btn {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
    }

    .mobile-menu-btn span {
      display: block;
      width: 25px;
      height: 3px;
      background: white;
      border-radius: 3px;
      transition: all 0.3s ease;
    }

    .mobile-menu-btn.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .mobile-menu-btn.active span:nth-child(2) {
      opacity: 0;
    }

    .mobile-menu-btn.active span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }

    /* ============================================= */
    /* RESPONSIVE HEADER */
    /* ============================================= */

    @media (max-width: 1024px) {
      .main-nav {
        position: fixed;
        top: 0;
        right: -100%;
        width: 280px;
        height: 100vh;
        background: #1a1a2e;
        flex-direction: column;
        padding: 80px 25px 30px;
        transition: all 0.4s ease;
        justify-content: flex-start;
        align-items: stretch;
        gap: 20px;
        overflow-y: auto;
      }

      .main-nav.open {
        right: 0;
      }

      .nav-list {
        flex-direction: column;
        align-items: stretch;
        gap: 5px;
      }

      .nav-link {
        padding: 12px 16px;
        font-size: 16px;
      }

      .dropdown-menu {
        position: static;
        opacity: 1;
        visibility: visible;
        transform: none;
        background: rgba(255, 255, 255, 0.03);
        border: none;
        border-radius: 8px;
        margin-top: 5px;
        box-shadow: none;
        padding: 5px;
      }

      .nav-item.has-dropdown .nav-link::after {
        content: '';
      }

      .nav-actions {
        flex-direction: column;
        margin-top: 10px;
      }

      .btn-nav-primary,
      .btn-nav-secondary {
        justify-content: center;
        width: 100%;
      }

      .mobile-menu-btn {
        display: flex;
      }

      /* Overlay */
      .main-nav.open::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 280px;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: -1;
      }
    }

    @media (max-width: 480px) {
      .logo a {
        font-size: 20px;
      }
      
      .main-header {
        padding: 10px 0;
      }
    }

    /* ============================================= */
    /* SECTION HEADER */
    /* ============================================= */

    .section-header {
      text-align: center;
      margin-bottom: 50px;
    }

    .section-badge {
      display: inline-block;
      background: rgba(233, 69, 96, 0.1);
      color: #e94560;
      padding: 6px 18px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .section-header h2 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .section-header h2 span {
      color: #e94560;
    }

    .section-header p {
      color: #666;
      font-size: 18px;
      max-width: 600px;
      margin: 0 auto;
    }

    /* ============================================= */
    /* HERO SECTION */
    /* ============================================= */

    .hero-section {
      position: relative;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      overflow: hidden;
      padding: 120px 0 80px;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }

    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }

    .particles span {
      position: absolute;
      display: block;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      animation: float 20s infinite linear;
    }

    .particles span:nth-child(1) { top: 10%; left: 20%; animation-delay: 0s; }
    .particles span:nth-child(2) { top: 30%; left: 70%; animation-delay: 2s; }
    .particles span:nth-child(3) { top: 50%; left: 10%; animation-delay: 4s; }
    .particles span:nth-child(4) { top: 70%; left: 80%; animation-delay: 6s; }
    .particles span:nth-child(5) { top: 90%; left: 30%; animation-delay: 8s; }

    @keyframes float {
      0% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
      50% { opacity: 0.8; }
      100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
    }

    .hero-content {
      position: relative;
      z-index: 2;
      color: white;
      max-width: 700px;
    }

    .hero-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 8px 20px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 25px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .hero-badge i {
      color: #e94560;
      margin-left: 8px;
    }

    .badge-new {
      background: #e94560;
      color: white;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      margin-right: 10px;
    }

    .hero-content h1 {
      font-size: 56px;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 20px;
    }

    .hero-content h1 span {
      color: #e94560;
    }

    .hero-content h1 .highlight {
      background: linear-gradient(135deg, #e94560, #fdcb6e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-description {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.8;
      margin-bottom: 35px;
    }

    .hero-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 50px;
    }

    .btn-primary {
      background: #e94560;
      color: white;
      border: none;
      padding: 16px 35px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
    }

    .btn-primary:hover {
      background: #c23152;
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(233, 69, 96, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
      padding: 16px 35px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-3px);
    }

    /* ============================================= */
    /* STATS SECTION */
    /* ============================================= */

    .stats-section {
      padding: 60px 0;
      background: white;
      margin-top: -40px;
      position: relative;
      z-index: 3;
      border-radius: 30px 30px 0 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 30px;
    }

    .stat-card {
      text-align: center;
      padding: 20px;
      transition: all 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
    }

    .stat-icon i {
      font-size: 28px;
    }

    .stat-card .stat-number {
      font-size: 36px;
      font-weight: 800;
      color: #1a1a2e;
      display: block;
    }

    .stat-card .stat-label {
      font-size: 16px;
      color: #666;
    }

    /* ============================================= */
    /* FEATURES SECTION */
    /* ============================================= */

    .features-section {
      padding: 80px 0;
      background: #f8f9fa;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .feature-card {
      background: white;
      padding: 35px;
      border-radius: 20px;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.05);
      transition: all 0.4s;
      border: 1px solid rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      width: 65px;
      height: 65px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .feature-icon i {
      font-size: 28px;
    }

    .feature-card h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .feature-card p {
      color: #666;
      line-height: 1.8;
      font-size: 15px;
      margin-bottom: 15px;
    }

    .feature-details {
      margin-top: 10px;
    }

    .feature-detail {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 0;
      font-size: 14px;
      color: #555;
    }

    .feature-detail i {
      font-size: 14px;
    }

    .feature-line {
      width: 40px;
      height: 3px;
      border-radius: 3px;
      margin-top: 15px;
    }

    /* ============================================= */
    /* STUDENT SECTION */
    /* ============================================= */

    .student-section {
      padding: 80px 0;
      background: white;
    }

    .student-dashboard {
      background: #f8f9fa;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.05);
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: white;
      border-radius: 16px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .student-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e94560, #c23152);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 800;
      color: white;
    }

    .student-info h3 {
      font-size: 20px;
      font-weight: 700;
    }

    .student-meta {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-top: 5px;
    }

    .student-meta span {
      font-size: 14px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.active i {
      font-size: 8px;
      color: #28a745;
    }

    .student-notifications-badge {
      position: relative;
      margin-right: auto;
      font-size: 20px;
      color: #666;
      cursor: pointer;
    }

    .student-notifications-badge .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #e94560;
      color: white;
      font-size: 11px;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .student-tabs {
      display: flex;
      gap: 5px;
      margin-bottom: 25px;
      flex-wrap: wrap;
      background: white;
      padding: 8px;
      border-radius: 12px;
    }

    .tab-btn {
      padding: 10px 20px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      cursor: pointer;
      transition: all 0.3s;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn:hover {
      background: #f0f0f0;
      color: #1a1a2e;
    }

    .tab-btn.active {
      background: #e94560;
      color: white;
    }

    .student-content {
      background: white;
      border-radius: 16px;
      padding: 25px;
      min-height: 300px;
    }

    /* Profile Grid */
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .profile-card {
      background: #f8f9fa;
      border-radius: 16px;
      padding: 20px;
    }

    .profile-card h4 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #1a1a2e;
    }

    .profile-card h4 i {
      color: #e94560;
      margin-left: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
      font-size: 14px;
    }

    .info-row span:last-child {
      font-weight: 600;
      color: #1a1a2e;
    }

    .performance-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .perf-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .perf-item span:first-child {
      min-width: 80px;
      font-size: 14px;
      color: #555;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar .progress {
      height: 100%;
      background: linear-gradient(90deg, #e94560, #fdcb6e);
      border-radius: 4px;
      transition: width 1s;
    }

    .perf-value {
      font-weight: 700;
      color: #1a1a2e;
      min-width: 40px;
      text-align: left;
    }

    /* Classes Grid */
    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .class-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 12px;
      transition: all 0.3s;
    }

    .class-item:hover {
      transform: translateX(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.06);
    }

    .class-icon {
      width: 45px;
      height: 45px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .class-info {
      flex: 1;
    }

    .class-info h4 {
      font-size: 16px;
      font-weight: 700;
    }

    .class-info .class-subject {
      font-size: 12px;
      color: #e94560;
      font-weight: 600;
    }

    .class-info .class-teacher,
    .class-info .class-time,
    .class-info .class-days {
      font-size: 13px;
      color: #666;
      display: block;
    }

    .class-price {
      font-weight: 700;
      color: #00b894;
      font-size: 16px;
    }

    /* Payments */
    .payment-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .payment-stat {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 12px;
      text-align: center;
    }

    .payment-stat .stat-number {
      font-size: 24px;
      font-weight: 800;
      display: block;
    }

    .payment-stat .stat-label {
      font-size: 13px;
      color: #666;
    }

    .payment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f3f5;
      flex-wrap: wrap;
      gap: 8px;
    }

    .payment-info {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .payment-month {
      font-weight: 600;
    }

    .payment-amount {
      font-weight: 700;
    }

    .payment-amount.paid { color: #00b894; }
    .payment-amount.pending { color: #fdcb6e; }
    .payment-amount.late { color: #e17055; }

    .payment-status {
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .payment-status.paid { background: #d4edda; color: #155724; }
    .payment-status.pending { background: #fff3cd; color: #856404; }
    .payment-status.late { background: #f8d7da; color: #721c24; }

    .payment-date {
      font-size: 13px;
      color: #888;
    }

    .pending-text {
      color: #fdcb6e;
    }

    .invoice-link {
      color: #0984e3;
      cursor: pointer;
      margin-right: 10px;
    }

    /* Attendance */
    .attendance-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .attendance-stat {
      text-align: center;
      padding: 15px;
      border-radius: 12px;
    }

    .attendance-stat.present { background: #d4edda; }
    .attendance-stat.absent { background: #f8d7da; }
    .attendance-stat.late { background: #fff3cd; }

    .attendance-stat span {
      font-size: 28px;
      font-weight: 800;
      display: block;
    }

    .attendance-stat label {
      font-size: 14px;
      color: #555;
    }

    .absence-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f3f5;
    }

    .absence-info {
      display: flex;
      gap: 20px;
    }

    .absence-date {
      font-weight: 600;
    }

    .absence-class {
      color: #666;
    }

    .absence-status {
      font-weight: 600;
    }

    .absence-status.present { color: #00b894; }
    .absence-status.absent { color: #e17055; }
    .absence-status.late { color: #fdcb6e; }

    .notified {
      font-size: 12px;
      color: #00b894;
      margin-right: 10px;
    }

    /* Schedule */
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
    }

    .schedule-header {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      background: #f8f9fa;
      padding: 12px 16px;
      font-weight: 700;
      border-radius: 8px;
      margin-bottom: 10px;
    }

    .schedule-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      padding: 10px 16px;
      border-bottom: 1px solid #f1f3f5;
      align-items: center;
    }

    .schedule-day {
      font-weight: 600;
    }

    .schedule-time {
      color: #e94560;
      font-weight: 600;
    }

    /* Notifications */
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 15px;
      border-bottom: 1px solid #f1f3f5;
    }

    .notification-item.unread {
      background: #f0f4ff;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon.warning { background: #fff3cd; color: #856404; }
    .notification-icon.info { background: #d1ecf1; color: #0c5460; }
    .notification-icon.success { background: #d4edda; color: #155724; }
    .notification-icon.error { background: #f8d7da; color: #721c24; }

    .notification-content {
      flex: 1;
    }

    .notification-content p {
      margin: 0;
      font-size: 14px;
    }

    .notification-date {
      font-size: 12px;
      color: #888;
    }

    .notification-status {
      font-size: 11px;
      font-weight: 600;
      color: #e94560;
      background: rgba(233, 69, 96, 0.1);
      padding: 2px 10px;
      border-radius: 20px;
    }

    /* ============================================= */
    /* TEACHER SECTION */
    /* ============================================= */

    .teacher-section {
      padding: 80px 0;
      background: #f8f9fa;
    }

    .teacher-dashboard {
      background: white;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.05);
    }

    .teacher-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 16px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .teacher-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0984e3, #6c5ce7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 800;
      color: white;
    }

    .teacher-info h3 {
      font-size: 20px;
      font-weight: 700;
    }

    .teacher-meta {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-top: 5px;
    }

    .teacher-meta span {
      font-size: 14px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .teacher-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }

    .teacher-stat {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }

    .teacher-stat .stat-number {
      font-size: 28px;
      font-weight: 800;
      display: block;
    }

    .teacher-stat .stat-label {
      font-size: 14px;
      color: #666;
    }

    .teacher-tabs {
      display: flex;
      gap: 5px;
      margin-bottom: 25px;
      flex-wrap: wrap;
      background: #f8f9fa;
      padding: 8px;
      border-radius: 12px;
    }

    .teacher-content {
      background: white;
      border-radius: 16px;
      padding: 25px;
      min-height: 200px;
    }

    .commission-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f3f5;
    }

    .commission-month {
      font-weight: 600;
    }

    .commission-amount {
      font-weight: 700;
    }

    .commission-status.paid { color: #00b894; }
    .commission-status.pending { color: #fdcb6e; }

    .student-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #f1f3f5;
    }

    .student-name {
      font-weight: 600;
    }

    .student-status.present { color: #00b894; }
    .student-status.absent { color: #e17055; }
    .student-status.late { color: #fdcb6e; }

    .student-payment.paid { color: #00b894; }
    .student-payment.pending { color: #fdcb6e; }

    /* ============================================= */
    /* ORDERS SECTION */
    /* ============================================= */

    .orders-section {
      padding: 80px 0;
      background: white;
    }

    .orders-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .order-form {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 20px;
    }

    .order-form h3 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .order-form h3 i {
      color: #e94560;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 5px;
      font-size: 14px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      font-size: 15px;
      font-family: inherit;
      transition: all 0.3s;
      background: white;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      border-color: #e94560;
      outline: none;
    }

    .form-group textarea {
      height: 80px;
      resize: vertical;
    }

    .order-products {
      margin: 20px 0;
    }

    .order-products h4 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border-radius: 10px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;
    }

    .product-item:hover {
      border-color: #e94560;
      transform: translateX(-5px);
    }

    .product-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .product-info i {
      color: #e94560;
      font-size: 20px;
    }

    .product-price {
      font-weight: 700;
      color: #00b894;
    }

    .btn-add {
      background: #e94560;
      color: white;
      border: none;
      padding: 5px 15px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }

    .btn-add:hover {
      background: #c23152;
    }

    .order-items {
      background: white;
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f3f5;
    }

    .item-total {
      font-weight: 700;
      color: #1a1a2e;
    }

    .btn-remove {
      background: #e17055;
      color: white;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .order-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 18px;
      font-weight: 700;
      border-top: 2px solid #e9ecef;
      margin-top: 10px;
    }

    .total-amount {
      color: #e94560;
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #e94560, #c23152);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(233, 69, 96, 0.3);
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .order-success {
      margin-top: 15px;
      padding: 15px;
      background: #d4edda;
      border-radius: 10px;
      color: #155724;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .order-success i {
      font-size: 24px;
    }

    .orders-list {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 20px;
    }

    .orders-list h3 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .orders-list h3 i {
      color: #e94560;
    }

    .order-card {
      background: white;
      padding: 18px;
      border-radius: 12px;
      margin-bottom: 12px;
      border-right: 4px solid #e9ecef;
    }

    .order-card:hover {
      border-right-color: #e94560;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .order-id {
      font-weight: 700;
      color: #1a1a2e;
    }

    .order-status {
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .order-status.pending { background: #fff3cd; color: #856404; }
    .order-status.processing { background: #d1ecf1; color: #0c5460; }
    .order-status.completed { background: #d4edda; color: #155724; }
    .order-status.cancelled { background: #f8d7da; color: #721c24; }

    .order-school {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .order-school i {
      color: #e94560;
    }

    .order-items-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 13px;
      color: #666;
    }

    .order-items-list span {
      background: #f8f9fa;
      padding: 2px 10px;
      border-radius: 4px;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f1f3f5;
    }

    .order-date {
      font-size: 13px;
      color: #888;
    }

    .order-total {
      font-weight: 700;
      color: #e94560;
    }

    /* ============================================= */
    /* PLANS SECTION */
    /* ============================================= */

    .plans-section {
      padding: 80px 0;
      background: #f8f9fa;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 25px;
      align-items: stretch;
    }

    .plan-card {
      background: white;
      padding: 30px 25px;
      border-radius: 20px;
      text-align: center;
      transition: all 0.3s;
      position: relative;
      border: 2px solid transparent;
      display: flex;
      flex-direction: column;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.05);
    }

    .plan-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.08);
    }

    .plan-card.popular {
      border-color: #e94560;
      box-shadow: 0 10px 40px rgba(233, 69, 96, 0.15);
      transform: scale(1.02);
    }

    .plan-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #e94560;
      color: white;
      padding: 4px 18px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .plan-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
    }

    .plan-icon i {
      font-size: 26px;
    }

    .plan-card h3 {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .plan-price {
      margin-bottom: 15px;
    }

    .plan-price .price {
      font-size: 28px;
      font-weight: 800;
      color: #1a1a2e;
    }

    .plan-price .period {
      font-size: 14px;
      color: #888;
    }

    .plan-limits {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 20px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
    }

    .limit-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
      color: #555;
    }

    .limit-item i {
      color: #e94560;
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 25px 0;
      flex: 1;
    }

    .plan-features li {
      padding: 8px 0;
      font-size: 14px;
      color: #555;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
    }

    .plan-features li i {
      font-size: 16px;
    }

    .btn-plan {
      border: none;
      color: white;
      padding: 14px 30px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
      font-family: inherit;
      width: 100%;
    }

    .btn-plan:hover {
      opacity: 0.85;
      transform: translateY(-2px);
    }

    /* ============================================= */
    /* BENEFITS SECTION */
    /* ============================================= */

    .benefits-section {
      padding: 80px 0;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      color: white;
    }

    .benefits-section .section-header h2 {
      color: white;
    }

    .benefits-section .section-header h2 span {
      color: #e94560;
    }

    .benefits-section .section-header p {
      color: rgba(255, 255, 255, 0.7);
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
    }

    .benefit-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 30px;
      border-radius: 16px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: all 0.3s;
    }

    .benefit-card:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-5px);
    }

    .benefit-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(233, 69, 96, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
    }

    .benefit-icon i {
      font-size: 24px;
      color: #e94560;
    }

    .benefit-card h4 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .benefit-card p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      line-height: 1.8;
    }

    /* ============================================= */
    /* FAQ SECTION */
    /* ============================================= */

    .faq-section {
      padding: 80px 0;
      background: white;
    }

    .faq-grid {
      max-width: 800px;
      margin: 0 auto;
    }

    .faq-item {
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .faq-question {
      padding: 18px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s;
    }

    .faq-question:hover {
      background: #f0f0f0;
    }

    .faq-question i {
      color: #e94560;
      transition: transform 0.3s;
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease, padding 0.4s ease;
    }

    .faq-answer.open {
      max-height: 300px;
      padding: 0 25px 18px 25px;
    }

    .faq-answer p {
      color: #555;
      line-height: 1.8;
      font-size: 15px;
    }

    /* ============================================= */
    /* CTA SECTION */
    /* ============================================= */

    .cta-section {
      padding: 80px 0;
      background: linear-gradient(135deg, #e94560, #c23152);
      color: white;
    }

    .cta-content {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .cta-content h2 {
      font-size: 38px;
      font-weight: 800;
      margin-bottom: 15px;
    }

    .cta-content h2 span {
      color: #fdcb6e;
    }

    .cta-content p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 30px;
    }

    .cta-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-cta-primary {
      background: white;
      color: #e94560;
      border: none;
      padding: 16px 35px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
    }

    .btn-cta-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .btn-cta-secondary {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      padding: 16px 35px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
    }

    .btn-cta-secondary:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-3px);
    }

    /* ============================================= */
    /* FOOTER */
    /* ============================================= */

    .footer {
      background: #1a1a2e;
      color: rgba(255, 255, 255, 0.7);
      padding: 60px 0 20px 0;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 2fr 3fr;
      gap: 50px;
      padding-bottom: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 28px;
      font-weight: 800;
      color: white;
      margin-bottom: 15px;
    }

    .footer-logo i {
      color: #e94560;
    }

    .footer-brand p {
      line-height: 1.8;
      margin-bottom: 20px;
    }

    .footer-social {
      display: flex;
      gap: 12px;
    }

    .footer-social a {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
      text-decoration: none;
    }

    .footer-social a:hover {
      background: #e94560;
      color: white;
    }

    .footer-links {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 30px;
    }

    .footer-column h4 {
      color: white;
      font-weight: 700;
      margin-bottom: 15px;
    }

    .footer-column a {
      display: block;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      padding: 6px 0;
      font-size: 14px;
      transition: all 0.3s;
      cursor: pointer;
    }

    .footer-column a:hover {
      color: #e94560;
      padding-right: 5px;
    }

    .footer-bottom {
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .footer-version {
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
    }

    /* ============================================= */
    /* BACK TO TOP */
    /* ============================================= */

    .back-to-top {
      position: fixed;
      bottom: 30px;
      left: 30px;
      background: #e94560;
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 5px 20px rgba(233, 69, 96, 0.4);
      transition: all 0.3s;
      border: none;
      font-size: 20px;
      opacity: 0;
      visibility: hidden;
      z-index: 100;
    }

    .back-to-top.visible {
      opacity: 1;
      visibility: visible;
    }

    .back-to-top:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(233, 69, 96, 0.5);
    }

    /* ============================================= */
    /* RESPONSIVE */
    /* ============================================= */

    @media (max-width: 992px) {
      .hero-content h1 {
        font-size: 42px;
      }
      
      .footer-content {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      
      .footer-links {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .plan-card.popular {
        transform: none;
      }
      
      .orders-grid {
        grid-template-columns: 1fr;
      }
      
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero-content h1 {
        font-size: 32px;
      }
      
      .hero-description {
        font-size: 17px;
      }
      
      .section-header h2 {
        font-size: 28px;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .plans-grid {
        grid-template-columns: 1fr 1fr;
      }
      
      .benefits-grid {
        grid-template-columns: 1fr 1fr;
      }
      
      .cta-content h2 {
        font-size: 28px;
      }
      
      .footer-links {
        grid-template-columns: 1fr;
      }
      
      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }
      
      .student-header {
        flex-direction: column;
        text-align: center;
      }
      
      .student-notifications-badge {
        margin-right: 0;
      }
      
      .student-tabs {
        flex-wrap: wrap;
      }
      
      .tab-btn {
        flex: 1;
        justify-content: center;
      }
      
      .teacher-header {
        flex-direction: column;
        text-align: center;
      }
      
      .teacher-stats {
        grid-template-columns: 1fr;
      }
      
      .class-item {
        flex-direction: column;
        text-align: center;
      }
      
      .payment-item {
        flex-direction: column;
        text-align: center;
      }
      
      .attendance-stats {
        grid-template-columns: 1fr;
      }
      
      .schedule-header,
      .schedule-row {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 5px;
      }
      
      .hero-buttons {
        flex-direction: column;
      }
      
      .btn-primary,
      .btn-secondary {
        justify-content: center;
      }
      
      .cta-buttons {
        flex-direction: column;
      }
      
      .btn-cta-primary,
      .btn-cta-secondary {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .plans-grid {
        grid-template-columns: 1fr;
      }
      
      .benefits-grid {
        grid-template-columns: 1fr;
      }
      
      .orders-list {
        padding: 15px;
      }
      
      .order-card {
        padding: 12px;
      }
      
      .order-item {
        flex-wrap: wrap;
        gap: 5px;
      }
    }
  `]
})
export class RedoxComponent implements OnInit {

  // =============================================
  // المتغيرات العامة
  // =============================================
  
  currentYear = new Date().getFullYear();
  isMobileMenuOpen: boolean = false;
  isScrolled: boolean = false;
  activeStudentTab: string = 'profile';
  activeTeacherTab: string = 'commissions';
  
  // متغيرات الطلبات
  orderPhone: string = '';
  orderSchoolName: string = '';
  orderEmail: string = '';
  orderNotes: string = '';
  orderItems: OrderItem[] = [];
  orderSuccess: boolean = false;
  
  // متغيرات البطاقات
  cardQuantity: number = 10;
  printerQuantity: number = 1;

  // =============================================
  // قائمة التنقل الرئيسية
  // =============================================
  
  navItems: NavItem[] = [
    {
      label: 'الرئيسية',
      icon: 'fa-home',
      link: '#home'
    },
    {
      label: 'الميزات',
      icon: 'fa-star',
      link: '#features'
    },
    {
      label: 'الخطط',
      icon: 'fa-crown',
      link: '#plans'
    },
    {
      label: 'فضاء الطالب',
      icon: 'fa-user-graduate',
      link: '#student-dashboard'
    },
    {
      label: 'فضاء المعلم',
      icon: 'fa-chalkboard-teacher',
      link: '#teacher-dashboard'
    },
    {
      label: 'المتجر',
      icon: 'fa-shopping-cart',
      link: '#orders',
      dropdown: [
        { label: 'بطاقات RFID', icon: 'fa-id-card', link: '#orders' },
        { label: 'طابعات البطاقات', icon: 'fa-print', link: '#orders' },
        { label: 'حزمة كاملة', icon: 'fa-gift', link: '#orders' }
      ]
    },
    {
      label: 'الدعم',
      icon: 'fa-headset',
      link: '#faq'
    }
  ];

  // =============================================
  // البيانات المحسوبة - Getter methods
  // =============================================

  get totalPaidPayments(): number {
    return this.studentData.payments.filter(p => p.status === 'paid').length;
  }

  get totalPendingPayments(): number {
    return this.studentData.payments.filter(p => p.status === 'pending').length;
  }

  get totalLatePayments(): number {
    return this.studentData.payments.filter(p => p.status === 'late').length;
  }

  get totalPayments(): number {
    return this.studentData.payments.length;
  }

  get totalPresentAbsences(): number {
    return this.studentData.absences.filter(a => a.status === 'present').length;
  }

  get totalAbsentAbsences(): number {
    return this.studentData.absences.filter(a => a.status === 'absent').length;
  }

  get totalLateAbsences(): number {
    return this.studentData.absences.filter(a => a.status === 'late').length;
  }

  get totalAbsences(): number {
    return this.studentData.absences.length;
  }

  get unreadNotifications(): number {
    return this.studentData.notifications.filter(n => !n.read).length;
  }

  get totalPaymentsAmount(): number {
    return this.studentData.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  get totalDueAmount(): number {
    return this.studentData.payments
      .filter(p => p.status === 'pending' || p.status === 'late')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  // =============================================
  // البيانات الثابتة
  // =============================================
  
  features: Feature[] = [
    {
      icon: 'fa-school',
      title: 'إدارة المدارس',
      description: 'منصة متكاملة لإدارة المدارس مع نظام اشتراكات مرن وخطط متنوعة.',
      color: '#e94560',
      details: [
        'إنشاء وإدارة المدارس',
        'نظام اشتراكات سنوي مرن',
        'خطط متنوعة (تجريبي، أساسي، قياسي، مميز، مؤسسات)',
        'إدارة المدراء والصلاحيات',
        'متابعة صلاحية الاشتراك وإشعارات التجديد'
      ]
    },
    {
      icon: 'fa-user-graduate',
      title: 'إدارة الطلاب',
      description: 'نظام متكامل لإدارة الطلاب يشمل التسجيل والمتابعة الأكاديمية والمالية.',
      color: '#00b894',
      details: [
        'تسجيل الطلاب وإدارة بياناتهم',
        'إنشاء حسابات للطلاب للدخول إلى المنصة',
        'متابعة الحصص المسجل فيها الطالب',
        'عرض المدفوعات والغيابات',
        'جدول الدراسة الشخصي'
      ]
    },
    {
      icon: 'fa-chalkboard-teacher',
      title: 'إدارة المعلمين',
      description: 'إدارة شاملة للمعلمين مع نظام عمولات متكامل وواجهة خاصة للمعلمين.',
      color: '#0984e3',
      details: [
        'إدارة بيانات المعلمين والمواد',
        'نظام عمولات بنسبة 70% من رسوم الحصص',
        'واجهة خاصة للمعلم لمتابعة عمولاته',
        'توزيع الحصص على المعلمين',
        'متابعة أداء المعلمين'
      ]
    },
    {
      icon: 'fa-book-open',
      title: 'إدارة الحصص',
      description: 'نظام مرن لإدارة الحصص الدراسية مع جدولة تلقائية وأنظمة دفع متعددة.',
      color: '#fdcb6e',
      details: [
        'إنشاء وإدارة الحصص الدراسية',
        'نظام دفع مرن (شهري أو جولات)',
        'جدولة تلقائية للحصص الحية',
        'تخصيص المعلمين والقاعات',
        'متابعة الحضور والغياب'
      ]
    },
    {
      icon: 'fa-id-card',
      title: 'نظام البطاقات RFID',
      description: 'نظام متقدم لتسجيل الحضور والغياب باستخدام بطاقات RFID مع إشعارات فورية.',
      color: '#6c5ce7',
      details: [
        'إضافة بطاقات مصرحة مع تاريخ صلاحية',
        'ربط البطاقات بالطلاب',
        'تسجيل الحضور تلقائياً عند المسح',
        'إرسال إشعارات لحظية لأولياء الأمور',
        'إحصائيات الحضور والغياب'
      ]
    },
    {
      icon: 'fa-money-bill-wave',
      title: 'المحاسبة والمالية',
      description: 'نظام محاسبي متكامل يشمل المدفوعات والعمولات والمصروفات والتقارير المالية.',
      color: '#00b894',
      details: [
        'إدارة المدفوعات الشهرية والجولات',
        'نظام عمولات الأساتذة (70%)',
        'متابعة المصروفات والميزانية',
        'تقارير مالية يومية وشهرية وسنوية',
        'حساب صافي الربح تلقائياً'
      ]
    }
  ];

  plans: Plan[] = [
    {
      name: 'تجريبي',
      icon: 'fa-flask',
      price: 'مجاناً',
      students: '10',
      teachers: '3',
      classes: '5',
      color: '#636e72',
      badge: 'لمدة 30 يوم',
      features: [
        'إدارة الطلاب الأساسية',
        'إدارة المعلمين',
        'إدارة الحصص',
        'تسجيل الحضور اليدوي',
        'دعم فني محدود'
      ]
    },
    {
      name: 'أساسي',
      icon: 'fa-star',
      price: '2,500 د.ج',
      students: '50',
      teachers: '10',
      classes: '20',
      color: '#00b894',
      features: [
        'جميع ميزات التجريبي',
        'تقارير متقدمة',
        'نظام المدفوعات',
        'دعم فني 24/7',
        'تحديثات دورية',
        'تصدير التقارير'
      ]
    },
    {
      name: 'قياسي',
      icon: 'fa-crown',
      price: '5,000 د.ج',
      students: '150',
      teachers: '25',
      classes: '50',
      isPopular: true,
      color: '#e94560',
      badge: '🔥 الأكثر طلباً',
      features: [
        'جميع ميزات الأساسي',
        'نظام RFID لتسجيل الحضور',
        'نظام العمولات للمعلمين',
        'تقارير مالية متقدمة',
        'API مفتوح للتكامل',
        'واجهة الطالب والمعلم'
      ]
    },
    {
      name: 'مميز',
      icon: 'fa-gem',
      price: '10,000 د.ج',
      students: '500',
      teachers: '50',
      classes: '100',
      color: '#6c5ce7',
      features: [
        'جميع ميزات القياسي',
        'نظام SMS للإشعارات',
        'لوحة تحكم متقدمة',
        'تكامل مع أنظمة خارجية',
        'أولوية في الدعم الفني',
        'تدريب الموظفين'
      ]
    },
    {
      name: 'مؤسسات',
      icon: 'fa-building',
      price: 'مخصص',
      students: 'غير محدود',
      teachers: 'غير محدود',
      classes: 'غير محدود',
      color: '#fdcb6e',
      features: [
        'جميع الميزات السابقة',
        'حل مخصص حسب الاحتياجات',
        'تدريب مكثف للموظفين',
        'دعم فني مخصص على مدار الساعة',
        'خادم خاص (Dedicated Server)',
        'تكامل مع أنظمة الوزارة'
      ]
    }
  ];

  // =============================================
  // بيانات الطالب
  // =============================================
  
  studentData: StudentData = {
    name: 'أحمد محمد',
    id: 'STU-2024-1234',
    year: '3AS (الثالثة ثانوي)',
    classes: [
      { name: 'الرياضيات', subject: 'رياضيات', teacher: 'محمد علي', price: 1000, days: ['الأحد', 'الأربعاء'], time: '08:00 - 10:00' },
      { name: 'الفيزياء', subject: 'فيزياء', teacher: 'سعيد نور', price: 1200, days: ['الإثنين', 'الخميس'], time: '10:00 - 12:00' },
      { name: 'اللغة العربية', subject: 'لغة عربية', teacher: 'فاطمة زهر', price: 800, days: ['الثلاثاء'], time: '09:00 - 11:00' },
      { name: 'اللغة الإنجليزية', subject: 'لغة انجليزية', teacher: 'نورا سمير', price: 900, days: ['الأربعاء'], time: '11:00 - 13:00' },
      { name: 'التاريخ', subject: 'تاريخ', teacher: 'عبد الرحمن', price: 700, days: ['الخميس'], time: '13:00 - 15:00' }
    ],
    payments: [
      { month: 'يناير 2024', amount: 1000, status: 'paid', date: '05/01/2024', invoice: 'INV-001' },
      { month: 'فبراير 2024', amount: 1000, status: 'late', date: '28/02/2024', invoice: 'INV-002' },
      { month: 'مارس 2024', amount: 1000, status: 'pending', date: '' },
      { month: 'أبريل 2024', amount: 1000, status: 'pending', date: '' },
      { month: 'ماي 2024', amount: 1000, status: 'pending', date: '' }
    ],
    absences: [
      { date: '15/01/2024', class: 'الرياضيات', status: 'absent', notified: true },
      { date: '20/01/2024', class: 'الفيزياء', status: 'late', notified: true },
      { date: '05/02/2024', class: 'اللغة العربية', status: 'absent', notified: true }
    ],
    schedule: [
      { day: 'الأحد', time: '08:00 - 10:00', subject: 'الرياضيات', classroom: 'A1' },
      { day: 'الإثنين', time: '10:00 - 12:00', subject: 'الفيزياء', classroom: 'B2' },
      { day: 'الثلاثاء', time: '09:00 - 11:00', subject: 'اللغة العربية', classroom: 'C3' },
      { day: 'الأربعاء', time: '08:00 - 10:00', subject: 'الرياضيات', classroom: 'A1' },
      { day: 'الأربعاء', time: '11:00 - 13:00', subject: 'اللغة الإنجليزية', classroom: 'D4' },
      { day: 'الخميس', time: '10:00 - 12:00', subject: 'الفيزياء', classroom: 'B2' },
      { day: 'الخميس', time: '13:00 - 15:00', subject: 'التاريخ', classroom: 'E5' }
    ],
    notifications: [
      { type: 'warning', message: 'دفعة فبراير 2024 متأخرة', date: '28/02/2024', icon: 'fa-exclamation-triangle', read: false },
      { type: 'info', message: 'تم إضافة حصة جديدة: اللغة الإنجليزية', date: '25/02/2024', icon: 'fa-info-circle', read: false },
      { type: 'error', message: 'تم تسجيل غيابك في حصة الرياضيات', date: '20/02/2024', icon: 'fa-times-circle', read: false },
      { type: 'success', message: 'تم دفع رسوم التسجيل بنجاح', date: '15/02/2024', icon: 'fa-check-circle', read: true }
    ]
  };

  // =============================================
  // بيانات المعلم
  // =============================================
  
  teacherData = {
    name: 'محمد علي',
    id: 'TCH-2024-5678',
    subjects: ['الرياضيات', 'الفيزياء'],
    totalCommissions: 35000,
    paidCommissions: 21000,
    pendingCommissions: 14000,
    commissions: [
      { month: 'أكتوبر 2023', amount: 7000, status: 'paid', date: '05/11/2023' },
      { month: 'نوفمبر 2023', amount: 7000, status: 'paid', date: '05/12/2023' },
      { month: 'ديسمبر 2023', amount: 7000, status: 'paid', date: '05/01/2024' },
      { month: 'يناير 2024', amount: 7000, status: 'pending', date: '' },
      { month: 'فبراير 2024', amount: 7000, status: 'pending', date: '' }
    ],
    students: [
      { name: 'أحمد محمد', status: 'present', payment: 'paid' },
      { name: 'سارة أحمد', status: 'absent', payment: 'pending' },
      { name: 'محمد خالد', status: 'present', payment: 'paid' },
      { name: 'نورا سمير', status: 'present', payment: 'pending' },
      { name: 'علي حسن', status: 'late', payment: 'paid' }
    ],
    classes: [
      { name: 'الرياضيات', students: 10, price: 1000, total: 7000 },
      { name: 'الفيزياء', students: 8, price: 1200, total: 6720 }
    ]
  };

  // =============================================
  // طلبات الشراء
  // =============================================
  
  orders: Order[] = [
    {
      id: 'ORD-1001',
      schoolName: 'مدرسة النجاح',
      phone: '0555123456',
      email: 'info@najah.edu',
      items: [
        { product: 'بطاقات RFID', quantity: 50, unitPrice: 100, total: 5000 },
        { product: 'طابعة البطاقات', quantity: 1, unitPrice: 20000, total: 20000 }
      ],
      totalAmount: 25000,
      status: 'pending',
      date: '28/02/2024',
      notes: 'نريد طباعة البطاقات بأسماء الطلاب'
    },
    {
      id: 'ORD-1002',
      schoolName: 'مدرسة الأمل',
      phone: '0555789012',
      email: 'info@amal.edu',
      items: [
        { product: 'بطاقات RFID', quantity: 100, unitPrice: 100, total: 10000 }
      ],
      totalAmount: 10000,
      status: 'completed',
      date: '25/02/2024',
      notes: 'توصيل سريع'
    },
    {
      id: 'ORD-1003',
      schoolName: 'مدرسة المستقبل',
      phone: '0555345678',
      email: 'info@mostakbal.edu',
      items: [
        { product: 'بطاقات RFID', quantity: 200, unitPrice: 100, total: 20000 },
        { product: 'طابعة البطاقات', quantity: 2, unitPrice: 20000, total: 40000 }
      ],
      totalAmount: 60000,
      status: 'processing',
      date: '27/02/2024',
      notes: 'نظام متكامل مع البرنامج'
    }
  ];

  // =============================================
  // الإحصائيات والمميزات
  // =============================================
  
  stats = [
    { number: '50+', label: 'مدرسة', icon: 'fa-school', color: '#e94560' },
    { number: '5,000+', label: 'طالب', icon: 'fa-user-graduate', color: '#00b894' },
    { number: '200+', label: 'معلم', icon: 'fa-chalkboard-teacher', color: '#0984e3' },
    { number: '10,000+', label: 'دفعة', icon: 'fa-money-bill-wave', color: '#fdcb6e' }
  ];

  benefits = [
    {
      icon: 'fa-clock',
      title: 'توفير الوقت',
      description: 'أتمتة العمليات الإدارية وتقليل الجهد اليدوي بنسبة 80%'
    },
    {
      icon: 'fa-chart-pie',
      title: 'تقارير دقيقة',
      description: 'تقارير شاملة ومفصلة عن جميع جوانب المدرسة مع تحليلات ذكية'
    },
    {
      icon: 'fa-mobile-screen',
      title: 'متابعة عبر الهاتف',
      description: 'تابع إيراداتك ومصروفاتك اليومية من خلال هاتفك أينما كنت'
    },
    {
      icon: 'fa-shield-halved',
      title: 'أمان عالي',
      description: 'نظام أمان متطور لحماية بيانات المدرسة والطلاب والمعلمين'
    },
    {
      icon: 'fa-bell',
      title: 'إشعارات فورية',
      description: 'إشعارات لحظية للطلاب وأولياء الأمور عند الغياب أو تأخر الدفع'
    },
    {
      icon: 'fa-hand-holding-heart',
      title: 'دعم متواصل',
      description: 'فريق دعم فني على مدار الساعة لمساعدتك في أي استفسار'
    }
  ];

  faqs = [
    {
      question: 'ما هي متطلبات تشغيل النظام؟',
      answer: 'النظام يعمل على جميع المتصفحات الحديثة ولا يحتاج إلى تثبيت برامج إضافية. كل ما تحتاجه هو اتصال بالإنترنت وجهاز كمبيوتر أو هاتف ذكي.'
    },
    {
      question: 'كيف يتم حساب عمولة المعلم؟',
      answer: 'يتم حساب عمولة المعلم بنسبة 70% من رسوم الحصة الدراسية. مثلاً: إذا كانت رسوم الحصة 1000 د.ج، فإن عمولة المعلم تكون 700 د.ج. ويمكن للمعلم متابعة عمولاته من خلال واجهته الخاصة.'
    },
    {
      question: 'كيف يعمل نظام البطاقات RFID؟',
      answer: 'يتم إضافة البطاقات المصرحة في النظام (سعر البطاقة 100 د.ج)، ثم ربطها بالطلاب. عند مسح البطاقة، يتم تسجيل الحضور تلقائياً وإرسال إشعار لولي الأمر. يمكن أيضاً شراء طابعة البطاقات بسعر 20,000 د.ج.'
    },
    {
      question: 'هل يمكن للطالب متابعة مدفوعاته؟',
      answer: 'نعم، للطالب واجهة خاصة يمكنه من خلالها متابعة جميع مدفوعاته، الغيابات، جدول الدراسة، والإشعارات التي تصل إليه عند التأخر في الدفع أو عند تسجيل غياب.'
    },
    {
      question: 'ما هي خيارات الدفع المتاحة؟',
      answer: 'نظام الدفع مرن ويشمل: الدفع الشهري (12 دفعة) أو نظام الجولات (دفعات حسب الجلسات). يمكن للمدرسة اختيار النظام المناسب لها.'
    },
    {
      question: 'كيف يمكن شراء البطاقات والطابعات؟',
      answer: 'يمكنك تقديم طلب شراء من خلال المنصة، حيث تختار المنتج (بطاقات RFID بسعر 100 د.ج/بطاقة، أو طابعة بسعر 20,000 د.ج)، تحدد العدد، وتدخل رقم هاتفك. سيتم التواصل معك خلال 24 ساعة.'
    }
  ];

  // =============================================
  // دوال التنقل
  // =============================================
  
  ngOnInit(): void {
    // يمكن إضافة أي منطق تهيئة هنا
  }
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
  
  scrollToSection(sectionId: string): void {
    const cleanId = sectionId.replace('#', '');
    const element = document.getElementById(cleanId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      this.closeMobileMenu();
    }
  }

  setActiveStudentTab(tab: string): void {
    this.activeStudentTab = tab;
  }

  setActiveTeacherTab(tab: string): void {
    this.activeTeacherTab = tab;
  }

  // =============================================
  // دوال الطلبات
  // =============================================
  
  addOrderItem(product: string, unitPrice: number): void {
    const existingItem = this.orderItems.find(item => item.product === product);
    if (existingItem) {
      existingItem.quantity++;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
    } else {
      this.orderItems.push({
        product: product,
        quantity: 1,
        unitPrice: unitPrice,
        total: unitPrice
      });
    }
  }
  
  removeOrderItem(index: number): void {
    this.orderItems.splice(index, 1);
  }
  
  getOrderTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.total, 0);
  }
  
  submitOrder(): void {
    if (!this.orderSchoolName || !this.orderPhone) {
      alert('يرجى إدخال اسم المدرسة ورقم الهاتف');
      return;
    }
    
    if (this.orderItems.length === 0) {
      alert('يرجى إضافة منتجات إلى الطلب');
      return;
    }
    
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      schoolName: this.orderSchoolName,
      phone: this.orderPhone,
      email: this.orderEmail || 'غير محدد',
      items: [...this.orderItems],
      totalAmount: this.getOrderTotal(),
      status: 'pending',
      date: new Date().toLocaleDateString('ar-EG'),
      notes: this.orderNotes || ''
    };
    
    this.orders.unshift(newOrder);
    this.orderSuccess = true;
    
    setTimeout(() => {
      this.orderSuccess = false;
      this.orderItems = [];
      this.orderSchoolName = '';
      this.orderPhone = '';
      this.orderEmail = '';
      this.orderNotes = '';
    }, 3000);
  }
  
  getStatusText(status: string): string {
    const map: Record<string, string> = {
      'pending': '⏳ معلق',
      'processing': '🔄 قيد المعالجة',
      'completed': '✅ منجز',
      'cancelled': '❌ ملغى'
    };
    return map[status] || status;
  }
  
  getStatusClass(status: string): string {
    return status;
  }

  // =============================================
  // دوال مساعدة أخرى
  // =============================================
  
  getPaymentStatusText(status: string): string {
    const map: Record<string, string> = {
      'paid': '✅ مدفوع',
      'pending': '⏳ معلق',
      'late': '⚠️ متأخر',
      'cancelled': '❌ ملغى'
    };
    return map[status] || status;
  }
  
  getPaymentStatusClass(status: string): string {
    return status;
  }
  
  getAbsenceStatusText(status: string): string {
    const map: Record<string, string> = {
      'present': '✅ حاضر',
      'absent': '❌ غائب',
      'late': '⏰ متأخر'
    };
    return map[status] || status;
  }
  
  getNotificationIcon(type: string): string {
    const map: Record<string, string> = {
      'warning': 'fa-exclamation-triangle',
      'info': 'fa-info-circle',
      'success': 'fa-check-circle',
      'error': 'fa-times-circle'
    };
    return map[type] || 'fa-bell';
  }
  
  getNotificationClass(type: string): string {
    return type;
  }

  getClassColor(subject: string): string {
    const colors: Record<string, string> = {
      'رياضيات': '#e94560',
      'فيزياء': '#0984e3',
      'لغة عربية': '#00b894',
      'لغة انجليزية': '#fdcb6e',
      'تاريخ': '#6c5ce7'
    };
    return colors[subject] || '#636e72';
  }

  getTotalPayments(): number {
    return this.studentData.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  // =============================================
  // مستمع الأحداث
  // =============================================

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      if (window.scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
    
    this.isScrolled = window.scrollY > 50;
  }
  
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}