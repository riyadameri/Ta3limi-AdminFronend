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
    <!-- الكلاسات الديناميكية هنا تتفاعل مع حالة النافبار بفضل الـ Template Reference (#navBar) -->
    <div class="layout-wrapper" 
         [class.sidebar-hidden]="!sidebarOpen && isMobile" 
         [class.sidebar-mini]="navBar.isMiniMode"
         [class.sidebar-collapsed]="navBar.collapsed"
         dir="rtl">
      
      <app-header class="main-header-fixed"></app-header>
      
      <div class="layout-container">
        <!-- متغير مرجعي #navBar للوصول لخصائص الشريط الجانبي -->
        <app-nav-bar #navBar
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
      --sidebar-mini-width: 65px; 
      --sidebar-collapsed-width: 85px; 
      --bg-canvas: #f4f7fe;
      --transition-speed: 0.3s;
      --transition-curve: cubic-bezier(0.4, 0, 0.2, 1);
    }

    .layout-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--bg-canvas);
      overflow-x: hidden;
    }

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

    .side-navigation {
      position: fixed;
      right: 0;
      top: var(--header-height);
      bottom: 0;
      width: var(--sidebar-width);
      z-index: 1040;
    }

    .main-viewport {
      flex: 1;
      margin-right: var(--sidebar-width); 
      padding: 2rem;
      transition: margin-right var(--transition-speed) var(--transition-curve);
      display: flex;
      flex-direction: column;
    }
    
    /* 1. تمدد المحتوى عند تفعيل الوضع الإبداعي */
    .layout-wrapper.sidebar-mini .main-viewport {
      margin-right: var(--sidebar-mini-width);
    }

    /* 2. تمدد المحتوى عند تفعيل وضع الطي العادي */
    .layout-wrapper.sidebar-collapsed .main-viewport {
      margin-right: var(--sidebar-collapsed-width);
    }

    .content-canvas {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeIn 0.5s ease-out;
    }

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

    .glass-shield {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1030;
      animation: shieldFade 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes shieldFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 768px) {
      .main-viewport {
        margin-right: 0 !important; 
        padding: 1rem;
      }

      .side-navigation {
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      .side-navigation.mobile-active {
        transform: translateX(0);
      }
    }

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