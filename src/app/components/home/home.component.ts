// home.component.ts
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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  sidebarOpen = false;
  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupKeyboardListeners();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // إغلاق النافبار بالضغط على زر Escape
    if (event.key === 'Escape' && this.sidebarOpen && this.isMobile) {
      this.closeSidebar();
    }
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    
    // إغلاق النافبار تلقائياً عند تغيير حجم الشاشة لتصبح كبيرة
    if (!this.isMobile && this.sidebarOpen) {
      this.closeSidebar();
    }
  }

  private setupKeyboardListeners(): void {
    // إضافة مستمع لضغط المفاتيح للتحكم بالقائمة
    document.addEventListener('keydown', (event) => {
      // Ctrl + M لفتح/إغلاق القائمة على جميع الشاشات
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        this.toggleSidebar();
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.updateBodyScroll();
    
    // إضافة صوت نقر بسيط لتجربة أفضل
    this.playClickSound();
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll(): void {
    // منع التمرير عند فتح النافبار على الجوال
    if (this.isMobile) {
      if (this.sidebarOpen) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
    }
  }

  private playClickSound(): void {
    // يمكنك إضافة صوت نقر هنا إذا أردت
    // const audio = new Audio('assets/sounds/click.mp3');
    // audio.volume = 0.3;
    // audio.play().catch(() => {});
  }

  // دالة لمعرفة إذا كان الهاتف في وضع الأفقي
  isLandscape(): boolean {
    return window.innerWidth > window.innerHeight && this.isMobile;
  }
}