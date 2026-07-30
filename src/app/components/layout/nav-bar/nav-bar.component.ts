import { Component, OnInit, HostListener, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-container" 
           [class.is-collapsed]="collapsed" 
           [class.mobile-open]="isMobile"
           dir="rtl">
      
      <div class="sidebar-header">
        <div class="logo-box">
          <i class="bi bi-shield-check-fill logo-icon"></i>
          <span class="logo-text" *ngIf="!collapsed">نظام المنارة</span>
        </div>
        <button class="toggle-btn" (click)="toggleCollapsed()" *ngIf="!isMobile">
          <i [class]="collapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right'"></i>
        </button>
      </div>

      <div class="user-context" *ngIf="!collapsed">
        <div class="avatar-ring">
          <img [src]="userAvatar" alt="user" class="side-avatar">
        </div>
        <div class="user-meta">
          <span class="u-name">{{ userName }}</span>
          <span class="u-role">{{ userRole }}</span>
        </div>
      </div>

      <nav class="menu-wrapper">
        <ul class="nav-list">
          <li *ngFor="let item of menuItems" 
              class="nav-item"
              [class.active]="activeSection === item.id"
              (mouseenter)="onItemHover(item.id)"
              (mouseleave)="onItemLeave()">
            
            <a class="nav-link" (click)="navigateTo(item.route, item.id)">
              <div class="icon-box">
                <i [class]="'bi ' + item.icon"></i>
                <span class="notif-dot" *ngIf="item.notification">{{ item.notification }}</span>
              </div>
              <span class="link-label" *ngIf="!collapsed">{{ item.label }}</span>
              
              <i class="bi bi-chevron-down sub-arrow" *ngIf="!collapsed && item.subItems"></i>
            </a>

            <div class="floating-label" *ngIf="collapsed && hoveredItem === item.id">
              {{ item.label }}
            </div>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-link" (click)="logout()">
          <i class="bi bi-box-arrow-right"></i>
          <span *ngIf="!collapsed">تسجيل الخروج</span>
        </button>
      </div>
    </aside>

    <div class="nav-glass-backdrop" *ngIf="isMobile" (click)="closeSidebar()"></div>
  `,
  styles: [`
    :host {
      --side-bg: #ffffff;
      --side-active: #f0f4ff;
      --side-primary: #4361ee;
      --side-text: #64748b;
      --side-text-active: #2b2d42;
      --side-border: #f1f5f9;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-container {
      width: 280px;
      height: 100vh;
      background: var(--side-bg);
      border-left: 1px solid var(--side-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      right: 0;
      top: 0;
      z-index: 1100;
      transition: var(--transition);
      box-shadow: -4px 0 15px rgba(0,0,0,0.02);
    }

    .sidebar-container.is-collapsed {
      width: 85px;
    }

    /* Header & Logo */
    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
    }

    .logo-box {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--side-primary);
    }

    .logo-icon { font-size: 1.8rem; }
    .logo-text { font-weight: 800; font-size: 1.2rem; color: var(--side-text-active); white-space: nowrap; }

    .toggle-btn {
      background: var(--side-border);
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--side-text);
    }

    /* User Profile Section */
    .user-context {
      padding: 1rem 1.5rem;
      margin: 0.5rem 1rem 1.5rem;
      background: #f8f9fe;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-ring {
      padding: 2px;
      border: 2px solid var(--side-primary);
      border-radius: 50%;
      display: flex;
    }

    .side-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .user-meta { display: flex; flex-direction: column; overflow: hidden; }
    .u-name { font-weight: 700; font-size: 0.9rem; color: var(--side-text-active); }
    .u-role { font-size: 0.75rem; color: var(--side-text); }

    /* Menu & Links */
    .menu-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 0 0.8rem;
    }

    .nav-list { list-style: none; padding: 0; margin: 0; }

    .nav-item {
      margin-bottom: 4px;
      position: relative;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      color: var(--side-text);
      text-decoration: none;
      border-radius: 12px;
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }

    .nav-link:hover {
      background: var(--side-active);
      color: var(--side-primary);
    }

    .nav-item.active .nav-link {
      background: var(--side-primary);
      color: #fff;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.2);
    }

    .icon-box {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      position: relative;
    }

    .link-label {
      margin-right: 12px;
      font-weight: 500;
      font-size: 0.95rem;
      flex: 1;
    }

    .notif-dot {
      position: absolute;
      top: -5px;
      left: -5px;
      background: #ef4444;
      color: white;
      font-size: 0.6rem;
      padding: 2px 6px;
      border-radius: 10px;
      border: 2px solid #fff;
    }

    .sub-arrow { font-size: 0.8rem; opacity: 0.5; }

    /* Collapsed Tooltip */
    .floating-label {
      position: absolute;
      right: 95px;
      top: 50%;
      transform: translateY(-50%);
      background: var(--side-text-active);
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      z-index: 100;
      pointer-events: none;
    }

    /* Footer */
    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--side-border);
    }

    .logout-link {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: none;
      background: #fff0f0;
      color: #ef4444;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: 0.3s;
    }
    .logout-link:hover { background: #fee2e2; }

    .is-collapsed .logout-link { justify-content: center; padding: 12px 0; }
    .is-collapsed .icon-box { margin: 0 auto; }

    /* Mobile Handling */
    .nav-glass-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
      z-index: 1050;
    }

    @media (max-width: 768px) {
      .sidebar-container {
        right: -100%;
      }
      .sidebar-container.mobile-open {
        right: 0;
      }
    }
  `]
})
export class NavBarComponent implements OnInit {
  @Input() isMobile = false;
  @Output() sidebarClosed = new EventEmitter<void>();
  
  private router = inject(Router);

  collapsed = false;
  activeSection = 'dashboard';
  hoveredItem: string | null = null;

  userName = 'ياسر خيشه';
  userRole = 'مدير النظام';
  userAvatar = 'https://ui-avatars.com/api/?name=ياسر+خيشه&background=4361ee&color=fff';

  menuItems = [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'لوحة التحكم', route: '/home/dashboard', notification: 3 },
    { id: 'live-classes', icon: 'bi-camera-video', label: 'الحصص الحية', route: '/home/live-class' },
    { id: 'students', icon: 'bi-people', label: 'إدارة الطلاب', route: '/home/students-management', subItems: true },
    { id: 'teachers', icon: 'bi-person-video3', label: 'إدارة الأساتذة', route: '/home/teachers-management' },
    {id : 'messages', icon: 'bi-chat-dots', label: 'الرسائل', route: '/home/messages', notification: 8},
    
    { id: 'classes', icon: 'bi-book', label: 'إدارة الحصص', route: '/home/lesson-management' },
    { id: 'classrooms', icon: 'bi-building', label: 'إدارة القاعات', route: '/home/rooms-management' },
    { id: 'payments', icon: 'bi-cash-coin', label: 'المدفوعات', route: '/home/add-expense', notification: 5 },
    { id: 'cards', icon: 'bi-credit-card', label: 'البطاقات', route: '/home/cards-management' },
    { id: 'gate-interface', icon: 'bi-door-open', label: 'واجهة المدخل', route: '/home/gate-interface' },
    { id: 'settings', icon: 'bi-gear', label: 'الإعدادات', route: '/home/settings', subItems: true }
  ];

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
    if (!this.isMobile) this.collapsed = false;
  }

  setActiveFromRoute(): void {
    const currentRoute = this.router.url;
    const activeItem = this.menuItems.find(item => currentRoute.includes(item.route));
    if (activeItem) this.activeSection = activeItem.id;
  }

  toggleCollapsed(): void {
    if (!this.isMobile) this.collapsed = !this.collapsed;
  }

  navigateTo(route: string, sectionId: string): void {
    this.activeSection = sectionId;
    this.router.navigate([route]).then(() => {
      if (this.isMobile) this.closeSidebar();
    });
  }

  closeSidebar(): void {
    this.sidebarClosed.emit();
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  onItemHover(itemId: string): void {
    if (this.collapsed && !this.isMobile) this.hoveredItem = itemId;
  }

  onItemLeave(): void {
    this.hoveredItem = null;
  }
}