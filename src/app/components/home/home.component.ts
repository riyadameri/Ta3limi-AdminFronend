import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { NavBarComponent } from '../layout/nav-bar/nav-bar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    HeaderComponent,
    NavBarComponent
  ],
  template: `
    <div class="layout-wrapper" [class.sidebar-hidden]="!sidebarOpen && isMobile" dir="rtl">
      <app-header class="main-header-fixed"></app-header>
      
      <div class="layout-container">
        <app-nav-bar 
          class="side-navigation" 
          [class.mobile-active]="sidebarOpen" 
          [isMobile]="isMobile"
          (sidebarClosed)="closeSidebar()">
        </app-nav-bar>

        <main class="main-viewport">
          <div class="mobile-control-bar" *ngIf="isMobile">
            <button class="menu-trigger" (click)="toggleSidebar()">
              <i class="bi" [class.bi-list]="!sidebarOpen" [class.bi-x-lg]="sidebarOpen"></i>
              <span>القائمة الرئيسية</span>
            </button>
          </div>

          <div class="content-canvas">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <div class="glass-shield" 
           *ngIf="sidebarOpen && isMobile" 
           (click)="closeSidebar()">
      </div>
    </div>
  `,
  styles: [`
    :host {
      --header-height: 80px;
      --sidebar-width: 280px;
      --sidebar-collapsed-width: 85px;
      --bg-canvas: #f4f7fe;
      --transition-speed: 0.35s;
    }

    .layout-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--bg-canvas);
    }

    /* تنسيق الهيدر الثابت */
    .main-header-fixed {
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      z-index: 1050;
      height: var(--header-height);
    }

    .layout-container {
      display: flex;
      margin-top: var(--header-height);
      min-height: calc(100vh - var(--header-height));
    }

    /* تنسيق القائمة الجانبية */
    .side-navigation {
      position: fixed;
      right: 0;
      top: var(--header-height);
      bottom: 0;
      width: var(--sidebar-width);
      z-index: 1040;
      transition: transform var(--transition-speed) ease;
    }

    /* منطقة المحتوى */
    .main-viewport {
      flex: 1;
      margin-right: var(--sidebar-width); /* حجز مساحة للسايدبار */
      padding: 2rem;
      transition: margin var(--transition-speed) ease;
      display: flex;
      flex-direction: column;
    }

    .content-canvas {
      width: 100%;
      max-width: 1400px; /* تحديد أقصى عرض لراحة العين */
      margin: 0 auto;
      animation: fadeIn 0.5s ease-out;
    }

    /* التحكم في الجوال */
    .mobile-control-bar {
      margin-bottom: 1.5rem;
    }

    .menu-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      border: 1px solid #e2e8f0;
      padding: 10px 20px;
      border-radius: 12px;
      color: #4361ee;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    /* طبقة التعتيم الجمالية */
    .glass-shield {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1030;
      animation: shieldFade 0.3s ease;
    }

    /* حالات الشاشات الكبيرة (عندما يكون السايدبار مصغراً) */
    :host-context(.is-collapsed) .main-viewport {
      margin-right: var(--sidebar-collapsed-width);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes shieldFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* التجاوب مع الجوال */
    @media (max-width: 768px) {
      .main-viewport {
        margin-right: 0 !important;
        padding: 1rem;
      }

      .side-navigation {
        transform: translateX(100%); /* إخفاء السايدبار خارج الشاشة يميناً */
      }

      .side-navigation.mobile-active {
        transform: translateX(0);
      }
    }

    /* منع التمرير عند فتح القائمة */
    :host ::ng-deep body.no-scroll {
      overflow: hidden;
    }
  `]
})
export class HomeComponent implements OnInit {
  sidebarOpen = false;
  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupKeyboardListeners();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.sidebarOpen && this.isMobile) {
      this.closeSidebar();
    }
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.sidebarOpen) {
      this.closeSidebar();
    }
  }

  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        this.toggleSidebar();
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.updateBodyScroll();
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll(): void {
    if (this.isMobile) {
      if (this.sidebarOpen) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
    }
  }

  isLandscape(): boolean {
    return window.innerWidth > window.innerHeight && this.isMobile;
  }
}