import { Component, OnInit, HostListener, Input, Output, EventEmitter, inject, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SoundService } from '../../../sound.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- النافبار الرئيسي -->
    <aside class="sidebar-container" 
           [class.is-collapsed]="collapsed" 
           [class.mobile-open]="isMobile"
           [class.is-mini]="isMiniMode"
           [class.slide-out]="isMiniMode && !isMobile"
           dir="rtl">
      
      <!-- شريط التصغير الإبداعي (ملتصق بالحافة اليسرى) -->
      <div class="mini-control-bar" *ngIf="!isMobile">
        <button class="mini-toggle-btn" 
                (click)="toggleMiniMode()"
                [class.active]="isMiniMode">
          <i [class]="isMiniMode ? 'bi bi-chevron-left' : 'bi bi-chevron-right'"></i>
          <span class="mini-tooltip">{{ isMiniMode ? 'توسيع القائمة' : 'تصغير القائمة' }}</span>
        </button>
      </div>

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
              (mouseleave)="onItemLeave()"
              (click)="playClickSound()">
            
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
      --shadow-color: rgba(67, 97, 238, 0.15);
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

    .mini-control-bar {
      position: absolute;
      top: 50%;
      left: -14px; 
      transform: translateY(-50%);
      z-index: 1120;
    }

    .mini-toggle-btn {
      width: 28px;
      height: 48px;
      border: none;
      border-radius: 12px 0 0 12px; 
      background: var(--side-primary);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: var(--transition);
      box-shadow: -2px 0 10px rgba(67, 97, 238, 0.2);
      position: relative;
    }

    .mini-toggle-btn:hover {
      background: #3651d4;
      width: 34px;
      transform: translateX(-6px); 
    }

    .mini-toggle-btn .mini-tooltip {
      position: absolute;
      right: 40px; 
      background: var(--side-text-active);
      color: #fff;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      opacity: 0;
      pointer-events: none;
      transition: var(--transition);
      white-space: nowrap;
    }

    .mini-toggle-btn:hover .mini-tooltip {
      opacity: 1;
    }

    .sidebar-container.is-mini {
      transform: translateX(calc(100% - 65px));
      box-shadow: -2px 0 20px rgba(0,0,0,0.05);
    }

    .sidebar-container.is-mini .sidebar-header {
      padding: 1.5rem 12px;
      justify-content: flex-end; 
    }

    .sidebar-container.is-mini .logo-text,
    .sidebar-container.is-mini .user-context,
    .sidebar-container.is-mini .link-label,
    .sidebar-container.is-mini .sub-arrow,
    .sidebar-container.is-mini .logout-link span,
    .sidebar-container.is-mini .toggle-btn {
      display: none;
    }

    .sidebar-container.is-mini .nav-link {
      padding: 12px 10px;
      justify-content: flex-end; 
    }

    .sidebar-container.is-mini .icon-box {
      margin: 0;
      width: 40px;
      height: 40px;
    }

    .sidebar-container.is-mini .nav-item.active .nav-link {
      background: var(--side-primary);
      border-radius: 12px;
    }

    .sidebar-container.is-mini .sidebar-footer {
      padding: 1rem 12px;
    }

    .sidebar-container.is-mini .logout-link {
      justify-content: flex-end;
      padding: 12px 10px;
      border-radius: 12px;
    }

    .sidebar-container.is-collapsed {
      width: 85px;
    }

    .sidebar-container.is-collapsed .sidebar-header {
      padding: 1.5rem 0.5rem;
      justify-content: center;
    }

    .sidebar-container.is-collapsed .logo-text,
    .sidebar-container.is-collapsed .user-context,
    .sidebar-container.is-collapsed .link-label,
    .sidebar-container.is-collapsed .sub-arrow,
    .sidebar-container.is-collapsed .logout-link span {
      display: none;
    }

    .sidebar-container.is-collapsed .icon-box {
      margin: 0;
    }

    .sidebar-container.is-collapsed .logout-link {
      justify-content: center;
    }

    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
      position: relative;
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
      transition: var(--transition);
    }

    .toggle-btn:hover {
      background: var(--side-active);
      color: var(--side-primary);
    }

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
      object-fit: cover;
    }

    .user-meta { display: flex; flex-direction: column; overflow: hidden; }
    .u-name { font-weight: 700; font-size: 0.9rem; color: var(--side-text-active); }
    .u-role { font-size: 0.75rem; color: var(--side-text); }

    .menu-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 0 0.8rem;
    }

    .menu-wrapper::-webkit-scrollbar {
      width: 4px;
    }

    .menu-wrapper::-webkit-scrollbar-thumb {
      background: var(--side-border);
      border-radius: 4px;
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
      position: relative;
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

    .nav-item.active .nav-link .bi {
      color: #fff;
    }

    .icon-box {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      position: relative;
      flex-shrink: 0;
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
      min-width: 18px;
      text-align: center;
    }

    .sub-arrow { font-size: 0.8rem; opacity: 0.5; margin-right: auto; }

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
      animation: fadeInTooltip 0.2s ease;
    }

    @keyframes fadeInTooltip {
      from { opacity: 0; transform: translateY(-50%) translateX(10px); }
      to { opacity: 1; transform: translateY(-50%) translateX(0); }
    }

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
      font-size: 0.95rem;
    }

    .logout-link:hover {
      background: #fee2e2;
      transform: scale(1.02);
    }

    .logout-link i {
      font-size: 1.2rem;
    }

    .nav-glass-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
      z-index: 1050;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 768px) {
      .sidebar-container {
        right: -100%;
        width: 300px;
        box-shadow: -8px 0 30px rgba(0,0,0,0.1);
      }

      .sidebar-container.mobile-open {
        right: 0;
      }

      .sidebar-container.is-mini {
        transform: translateX(0);
      }

      .mini-control-bar {
        display: none;
      }
    }

    .sidebar-container.is-collapsed .nav-item.active .nav-link {
      border-radius: 12px;
      background: var(--side-primary);
    }

    .sidebar-container.is-collapsed .icon-box {
      width: 40px;
      height: 40px;
      font-size: 1.4rem;
    }

    .sidebar-container.is-mini .nav-link:hover {
      background: var(--side-active);
      border-radius: 12px;
    }

    .sidebar-container.is-mini .nav-item.active .nav-link:hover {
      background: var(--side-primary);
    }

    .sidebar-container.slide-out {
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-container.is-mini .logo-box {
      animation: pulseLogo 2s infinite;
    }

    @keyframes pulseLogo {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .sidebar-container.is-mini::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 3px;
      height: 100%;
      background: linear-gradient(to bottom, var(--side-primary), #7c3aed, var(--side-primary));
      opacity: 0.3;
    }
  `]
})
export class NavBarComponent implements OnInit {
  @Input() isMobile = false;
  @Output() sidebarClosed = new EventEmitter<void>();
  
  private router = inject(Router);
  private soundService = inject(SoundService);
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);

  collapsed = false;
  isMiniMode = false;
  activeSection = 'dashboard';
  hoveredItem: string | null = null;

  userData = (() => {
    const rawUser = localStorage.getItem('user');
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    return parsedUser ?? {};
  })();

  userName = this.userData?.fullName ?? 'المستخدم';
  userRole = this.userData?.role ?? 'Admin';
  userAvatar = 'https://ui-avatars.com/api/?name=ياسر+خيشه&background=4361ee&color=fff&size=128';

  menuItems = [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'لوحة التحكم', route: '/home/dashboard', notification: 3 },
    { id: 'live-classes', icon: 'bi-camera-video', label: 'الحصص الحية', route: '/home/live-class' },
    { id: 'students', icon: 'bi-people', label: 'إدارة الطلاب', route: '/home/students-management', subItems: true },
    { id: 'teachers', icon: 'bi-person-video3', label: 'إدارة الأساتذة', route: '/home/teachers-management' },
    { id: 'messages', icon: 'bi-chat-dots', label: 'الرسائل', route: '/home/messages', notification: 8 },
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
    this.loadStateFromLocalStorage();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.isMiniMode = false;
    }
  }

  private loadStateFromLocalStorage(): void {
    try {
      const savedState = localStorage.getItem('navBarState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.isMiniMode = state.isMiniMode || false;
        this.collapsed = state.collapsed || false;
      }
    } catch (e) {
      console.warn('⚠️ خطأ في تحميل حالة النافبار');
    }
  }

  private saveStateToLocalStorage(): void {
    try {
      localStorage.setItem('navBarState', JSON.stringify({
        isMiniMode: this.isMiniMode,
        collapsed: this.collapsed
      }));
    } catch (e) {
      console.warn('⚠️ خطأ في حفظ حالة النافبار');
    }
  }

  playClickSound(): void {
    this.soundService.playClick(0.15);
  }

  playSwitchSound(): void {
    this.soundService.playTabSwitch(0.2);
  }

  playLogoutSound(): void {
    this.soundService.playLogout(0.3);
  }

  setActiveFromRoute(): void {
    const currentRoute = this.router.url;
    const activeItem = this.menuItems.find(item => currentRoute.includes(item.route));
    if (activeItem) this.activeSection = activeItem.id;
  }

  toggleCollapsed(): void {
    if (this.isMobile) return;
    this.collapsed = !this.collapsed;
    this.playSwitchSound();
    this.saveStateToLocalStorage();
    
    if (this.isMiniMode && this.collapsed) {
      this.isMiniMode = false;
    }
  }

  toggleMiniMode(): void {
    if (this.isMobile) return;
    this.isMiniMode = !this.isMiniMode;
    this.playSwitchSound();
    this.saveStateToLocalStorage();
    
    if (this.isMiniMode) {
      this.collapsed = false;
    }
  }

  navigateTo(route: string, sectionId: string): void {
    this.playClickSound();
    this.activeSection = sectionId;
    this.router.navigate([route]).then(() => {
      if (this.isMobile) this.closeSidebar();
    });
  }

  closeSidebar(): void {
    this.sidebarClosed.emit();
  }

  logout(): void {
    this.playLogoutSound();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  onItemHover(itemId: string): void {
    if (this.collapsed && !this.isMobile && !this.isMiniMode) {
      this.hoveredItem = itemId;
    }
  }

  onItemLeave(): void {
    this.hoveredItem = null;
  }
}