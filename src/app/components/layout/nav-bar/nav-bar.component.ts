// nav-bar.component.ts
import { Component, OnInit, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
  @Input() isMobile = false;
  @Output() sidebarClosed = new EventEmitter<void>();
  
  collapsed = false;
  activeSection = 'dashboard';
  hoveredItem: string | null = null;

  // بيانات المستخدم
  userName = 'Yasser';
  userRole = 'مدير النظام';
  userAvatar = 'https://ui-avatars.com/api/?name=أحمد+محمد&background=0D8ABC&color=fff';

  // قائمة العناصر المحسنة
  menuItems = [
    { 
      id: 'dashboard', 
      icon: 'bi-speedometer2', 
      label: 'لوحة التحكم', 
      route: '/home/lesson-management',
      notification: 3
    },
    { 
      id: 'live-classes', 
      icon: 'bi-camera-video', 
      label: 'الحصص الحية', 
      route: '/home/live-class'
    },
    { 
      id: 'students', 
      icon: 'bi-people', 
      label: 'إدارة الطلاب', 
      route: '/home/students-management',
      subItems: [
        { label: 'قائمة الطلاب', route: '/home/students-management' },
        { label: 'حسابات الطلاب', route: '/home/students-accounts' },
        { label: 'طلبات التسجيل', route: '/home/registration-requests' }
      ]
    },
    { 
      id: 'teachers', 
      icon: 'bi-person-video3', 
      label: 'إدارة الأساتذة', 
      route: '/home/teachers-management'
    },
    { 
      id: 'classes', 
      icon: 'bi-book', 
      label: 'إدارة الحصص', 
      route: '/home/lesson-management'
    },
    { 
      id: 'classrooms', 
      icon: 'bi-building', 
      label: 'إدارة القاعات', 
      route: '/home/rooms-management'
    },
    { 
      id: 'payments', 
      icon: 'bi-cash-coin', 
      label: 'المدفوعات', 
      route: '/home/payments-management',
      notification: 5
    },
    { 
      id: 'cards', 
      icon: 'bi-credit-card', 
      label: 'البطاقات', 
      route: '/home/cards-management'
    },
    { 
      id: 'gate-interface', 
      icon: 'bi-door-open', 
      label: 'واجهة المدخل', 
      route: '/home/gate-interface'
    },
    { 
      id: 'settings', 
      icon: 'bi-gear', 
      label: 'الإعدادات', 
      route: '/home/settings',
      subItems: [
        { label: 'الإعدادات العامة', route: '/home/settings/general' },
        { label: 'صلاحيات المستخدمين', route: '/home/settings/permissions' },
        { label: 'نسخ احتياطي', route: '/home/settings/backup' }
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setActiveFromRoute();
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.collapsed = false;
    }
  }

  setActiveFromRoute(): void {
    const currentRoute = this.router.url;
    const activeItem = this.menuItems.find(item => 
      currentRoute.includes(item.route) || 
      (item.subItems && item.subItems.some(sub => currentRoute.includes(sub.route)))
    );
    if (activeItem) {
      this.activeSection = activeItem.id;
    }
  }

  toggleCollapsed(): void {
    if (!this.isMobile) {
      this.collapsed = !this.collapsed;
    }
  }
  navigateTo(route: string, sectionId: string): void {
    this.activeSection = sectionId;
    this.router.navigate([route]).then(() => {
      // إغلاق النافبار على الجوال بعد التنقل
      if (this.isMobile) {
        this.closeSidebar();
      }
    });
  }

  closeSidebar(): void {
    this.sidebarClosed.emit();
  }

  logout(): void {
    // منطق تسجيل الخروج
    this.router.navigate(['/login']);
  }

  onItemHover(itemId: string): void {
    if (this.collapsed && !this.isMobile) {
      this.hoveredItem = itemId;
    }
  }

  onItemLeave(): void {
    this.hoveredItem = null;
  }
}