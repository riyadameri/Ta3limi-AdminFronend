import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CountService } from '../../../services/count.service';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule],
})
export class HeaderComponent implements OnInit {

  constructor(private countService: CountService) { 

  }
  // البيانات الديناميكية
  studentCount: number = 0;
  teacherCount: number = 0;
  lessonCount: number = 0;
  
  userName: string = 'المستخدم';
  userRole: string = 'الدور';
  userAvatar: string = 'https://ui-avatars.com/api/?name=User&background=random';
  
  notificationCount: number = 3;

  ngOnInit(): void {
    // محاكاة تحميل البيانات
    this.loadStats();
    this.loadUserData();
  }
  

  loadStats(): void {
    forkJoin({
      students: this.countService.getStudentsNumber(),
      teachers: this.countService.getTeachersNumber(),
      classes: this.countService.getClassesNumber()
    }).subscribe(res => {
      this.studentCount = res.students.count;
      this.teacherCount = res.teachers.count;
      this.lessonCount = res.classes.count;
    });
  }

  loadUserData(): void {
    // محاكاة تحميل بيانات المستخدم
    setTimeout(() => {
      this.userName = 'ياسر خيشه';
      this.userRole = 'مدير النظام';
      this.userAvatar = 'https://ui-avatars.com/api/?name=أحمد+محمد&background=0D8ABC&color=fff';
    }, 800);
  }
}