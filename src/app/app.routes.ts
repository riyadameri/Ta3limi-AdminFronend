import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { LiveClass } from './services/live-classes.service';
import { LessonManagementComponent } from './components/lesson-management/lesson-management.component';
import { StudentsManagementComponent } from './students-management/students-management.component';
import { RoomsManagementComponentComponent } from './rooms-management-component/rooms-management-component.component';
import { PaymentsManagementComponent } from './payments-management/payments-management.component';
import { CardsManagementComponent } from './cards-management/cards-management.component';
import { LiveClassComponent } from './live-class/live-class.component';
import { TeachersManagementComponent } from './teachers-management/teachers-management.component';
import { StudentDetailsComponent } from './student-details/student-details.component';
import { AddStudentToClassesModalComponent } from './add-student-to-classes-modal/add-student-to-classes-modal.component';
export const routes: Routes = [
  // المسار الافتراضي - إعادة توجيه إلى login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // صفحة تسجيل الدخول
  { path: 'login', component: LoginComponent },
  
  // الصفحة الرئيسية مع التخطيط
  {
    path: 'home',
    component: HomeComponent,
    // يمكن إضافة canActivate: [AuthGuard] هنا إذا كانت الصفحة محمية
    children: [
      { path: 'lesson-management', component: LessonManagementComponent },
      { path: 'live-class', component: LiveClassComponent },
      { path: 'students-management', component: StudentsManagementComponent },
      { path: 'students-management/:id', component: StudentDetailsComponent },   
      { path: 'add-student-to-classes-modal/:id', component: AddStudentToClassesModalComponent },
         { path: 'teachers-management', component: TeachersManagementComponent },
      { path: 'rooms-management', component: RoomsManagementComponentComponent },
      { path: 'payments-management', component: PaymentsManagementComponent },
      { path: 'cards-management', component: CardsManagementComponent },
      
      // مسار افتراضي داخل home
      { path: '', redirectTo: 'lesson-management', pathMatch: 'full' }
    ]
  },
  
];