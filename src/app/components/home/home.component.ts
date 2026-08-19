import { Component, OnInit, HostListener } from '@angular/core';
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
    <div class="layout-wrapper" 
         [class.sidebar-hidden]="!sidebarOpen && isMobile" 
         [class.sidebar-mini]="navBar?.isMiniMode || false"
         [class.sidebar-collapsed]="navBar?.collapsed || false"
         dir="rtl">
      
      <app-header class="main-header-fixed"></app-header>
      
      <div class="layout-container">
        <app-nav-bar #navBar
          class="side-navigation" 
          [class.mobile-active]="sidebarOpen" 
          [isMobile]="isMobile"
          (sidebarClosed)="closeSidebar()">
        </app-nav-bar>

        <main class="main-viewport">
          <div class="mobile-control-bar" *ngIf="isMobile">
            <button class="menu-trigger" (click)="toggleSidebar()" aria-label="Toggle menu">
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
      display: block;
      width: 100%;
      min-height: 100vh;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .layout-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--bg-canvas);
      overflow-x: hidden;
      width: 100%;
      position: relative;
    }

    .main-header-fixed {
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      z-index: 1050;
      height: var(--header-height);
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.5);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .layout-container {
      display: flex;
      margin-top: var(--header-height);
      min-height: calc(100vh - var(--header-height));
      width: 100%;
      position: relative;
    }

    .side-navigation {
      position: fixed;
      right: 0;
      top: var(--header-height);
      bottom: 0;
      width: var(--sidebar-width);
      z-index: 1040;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-left: 1px solid rgba(226, 232, 240, 0.5);
      transition: transform var(--transition-speed) var(--transition-curve),
                  width var(--transition-speed) var(--transition-curve);
      overflow-y: auto;
      overflow-x: hidden;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.03);
    }

    /* Custom scrollbar for sidebar */
    .side-navigation::-webkit-scrollbar {
      width: 4px;
    }
    .side-navigation::-webkit-scrollbar-track {
      background: transparent;
    }
    .side-navigation::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 10px;
    }

    .main-viewport {
      flex: 1;
      margin-right: var(--sidebar-width);
      padding: 2rem;
      transition: margin-right var(--transition-speed) var(--transition-curve);
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - var(--header-height));
      width: calc(100% - var(--sidebar-width));
    }

    /* Mini sidebar mode */
    .layout-wrapper.sidebar-mini .main-viewport {
      margin-right: var(--sidebar-mini-width);
      width: calc(100% - var(--sidebar-mini-width));
    }

    /* Collapsed sidebar mode */
    .layout-wrapper.sidebar-collapsed .main-viewport {
      margin-right: var(--sidebar-collapsed-width);
      width: calc(100% - var(--sidebar-collapsed-width));
    }

    .content-canvas {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
      flex: 1;
    }

    .mobile-control-bar {
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .menu-trigger {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 12px 20px;
      border-radius: 14px;
      color: #4361ee;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      width: 100%;
      justify-content: flex-start;
    }

    .menu-trigger:hover {
      background: #f8faff;
      border-color: #4361ee;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.12);
      transform: translateY(-1px);
    }

    .menu-trigger i {
      font-size: 1.3rem;
      transition: transform 0.3s ease;
    }

    .menu-trigger i.bi-x-lg {
      transform: rotate(90deg);
    }

    .glass-shield {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 1030;
      animation: shieldFade 0.3s ease;
      cursor: pointer;
    }

    /* --- Animations --- */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes shieldFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* --- Mobile Responsive --- */
    @media (max-width: 992px) {
      .main-viewport {
        padding: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      :host {
        --header-height: 70px;
        --sidebar-width: 85vw;
        --sidebar-mini-width: 85vw;
        --sidebar-collapsed-width: 85vw;
      }

      .main-viewport {
        margin-right: 0 !important;
        padding: 1rem 0.75rem;
        width: 100% !important;
        min-height: calc(100vh - var(--header-height));
      }

      .side-navigation {
        transform: translateX(100%);
        width: var(--sidebar-width);
        max-width: 340px;
        border-left: none;
        border-right: 1px solid rgba(226, 232, 240, 0.5);
        box-shadow: -8px 0 30px rgba(0, 0, 0, 0.08);
        border-radius: 0 0 0 0;
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                    width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        right: 0;
        top: var(--header-height);
        bottom: 0;
      }

      .side-navigation.mobile-active {
        transform: translateX(0);
        animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .menu-trigger {
        padding: 10px 16px;
        font-size: 0.85rem;
        border-radius: 12px;
      }

      .menu-trigger i {
        font-size: 1.2rem;
      }

      .content-canvas {
        padding: 0;
      }

      .glass-shield {
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
    }

    /* Small phones */
    @media (max-width: 480px) {
      :host {
        --header-height: 64px;
        --sidebar-width: 92vw;
      }

      .main-viewport {
        padding: 0.75rem 0.5rem;
      }

      .mobile-control-bar {
        margin-bottom: 0.75rem;
      }

      .menu-trigger {
        padding: 8px 14px;
        font-size: 0.8rem;
        border-radius: 10px;
      }

      .menu-trigger span {
        font-size: 0.8rem;
      }

      .side-navigation {
        max-width: 300px;
        top: var(--header-height);
      }
    }

    /* Landscape phones */
    @media (max-width: 768px) and (orientation: landscape) {
      :host {
        --header-height: 60px;
        --sidebar-width: 70vw;
      }

      .side-navigation {
        max-width: 280px;
        top: var(--header-height);
      }

      .main-viewport {
        padding: 0.75rem;
        min-height: calc(100vh - var(--header-height));
      }

      .mobile-control-bar {
        margin-bottom: 0.5rem;
      }

      .menu-trigger {
        padding: 6px 14px;
        font-size: 0.75rem;
      }
    }

    /* Prevent body scroll when mobile sidebar is open */
    :host ::ng-deep body.no-scroll {
      overflow: hidden !important;
      position: fixed;
      width: 100%;
      height: 100%;
    }

    /* Smooth hover for desktop sidebar */
    @media (min-width: 769px) {
      .side-navigation:hover {
        box-shadow: 4px 0 30px rgba(0, 0, 0, 0.06);
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  sidebarOpen = false;
  isMobile = false;
  navBar: any;

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupKeyboardListeners();
    // Prevent body scroll issues on mount
    document.body.classList.remove('no-scroll');
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
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    // Close sidebar when switching from mobile to desktop
    if (!this.isMobile && this.sidebarOpen) {
      this.closeSidebar();
    }
    
    // Remove no-scroll if switching to desktop
    if (!this.isMobile) {
      document.body.classList.remove('no-scroll');
    }
  }

  private setupKeyboardListeners(): void {
    // Keyboard shortcut: Ctrl+M or Cmd+M to toggle sidebar
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        this.toggleSidebar();
      }
    };
    document.addEventListener('keydown', handler);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.updateBodyScroll();
  }

  closeSidebar(): void {
    if (this.sidebarOpen) {
      this.sidebarOpen = false;
      this.updateBodyScroll();
    }
  }

  private updateBodyScroll(): void {
    if (this.isMobile) {
      if (this.sidebarOpen) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
    } else {
      document.body.classList.remove('no-scroll');
    }
  }
}