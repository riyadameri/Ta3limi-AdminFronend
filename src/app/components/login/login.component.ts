import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, CommonModule]
})
export class LoginComponent implements OnInit {

  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  
  currentYear: number = new Date().getFullYear();
  isLoading: boolean = false;
  passwordFieldType: string = 'password';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadRememberedUser();
  }

  loadRememberedUser(): void {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      try {
        const credentials = JSON.parse(rememberedUser);
        if (credentials.rememberMe) {
          this.username = credentials.username;
          this.rememberMe = true;
        }
      } catch (e) { localStorage.removeItem('rememberedUser'); }
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  async login(): Promise<void> {
    if (!this.isFormValid()) {
      Swal.fire({ title: 'خطأ', text: 'يرجى إكمال البيانات', icon: 'error', confirmButtonColor: '#0a66c2' });
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch('https://redox-sm.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username.trim(), password: this.password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (this.rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({ username: this.username.trim(), rememberMe: true }));
        } else {
          localStorage.removeItem('rememberedUser');
        }

        await Swal.fire({
          title: 'تم تسجيل الدخول',
          text: 'جاري تحويلك إلى مدرسة الرواد...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Redirect to default child route
        this.router.navigate(['/home/lesson-management']);
      } else {
        Swal.fire({ title: 'فشل الدخول', text: data.message || 'بيانات غير صحيحة', icon: 'error' });
      }
    } catch (err) {
      Swal.fire({ title: 'خطأ في الاتصال', text: 'يرجى التحقق من الإنترنت', icon: 'error' });
    } finally {
      this.isLoading = false;
    }
  }

  onUsernameKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') document.getElementById('password')?.focus();
  }

  onPasswordKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.login();
  }

  forgotPassword(): void {
    Swal.fire({
      title: 'نسيت كلمة المرور؟',
      text: 'يرجى الاتصال بإدارة مدرسة الرواد لإعادة تعيين حسابك.',
      icon: 'info',
      confirmButtonText: 'حسناً'
    });
  }

  navigateToRegister(): void { this.router.navigate(['/register']); }

  isFormValid(): boolean { return this.username.trim().length > 0 && this.password.length > 0; }

  getGreeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'صباح الخير' : 'مساء الخير';
  }
}