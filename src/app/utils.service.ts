import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  getAcademicYearName(code: string): string {
    if (!code || code === 'NS' || code === 'غير محدد') return 'غير محدد';
    
    const years: { [key: string]: string } = {
      // Secondary (AS)
      '1AS': 'الأولى ثانوي',
      '2AS': 'الثانية ثانوي',
      '3AS': 'الثالثة ثانوي',
      // Middle (MS)
      '1MS': 'الأولى متوسط',
      '2MS': 'الثانية متوسط',
      '3MS': 'الثالثة متوسط',
      '4MS': 'الرابعة متوسط',
      // Primary (AP)
      '1AP': 'الأولى ابتدائي',
      '2AP': 'الثانية ابتدائي',
      '3AP': 'الثالثة ابتدائي',
      '4AP': 'الرابعة ابتدائي',
      '5AP': 'الخامسة ابتدائي',
      // Other possible values
      'اولى ابتدائي': 'الأولى ابتدائي',
      'ثانية ابتدائي': 'الثانية ابتدائي',
      'ثالثة ابتدائي': 'الثالثة ابتدائي',
      'رابعة ابتدائي': 'الرابعة ابتدائي',
      'خامسة ابتدائي': 'الخامسة ابتدائي'
    };
    
    return years[code] || code;
  }

  normalizeCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    
    // Remove non-numeric characters
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Handle different reader formats
    if (cleanNumber.match(/^0{6,}/)) {
      return cleanNumber.replace(/^0+/, '');
    }
    
    if (cleanNumber.length <= 12) {
      return cleanNumber;
    }
    
    return cleanNumber;
  }

  detectReaderType(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.match(/^0{6,}/)) {
      return 'new_reader';
    } else if (cleanNumber.length <= 12) {
      return 'old_reader';
    } else {
      return 'unknown';
    }
  }

  generateMonthOptions(): { value: string; name: string }[] {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (new Date().getMonth() + i) % 12;
      const year = currentYear + Math.floor((new Date().getMonth() + i) / 12);
      const value = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const name = `${months[monthIndex]} ${year}`;
      
      options.push({ value, name });
    }
    
    return options;
  }

  debounce(func: Function, wait: number, immediate: boolean = false): Function {
    let timeout: any;
    return function executedFunction(...args: any[]) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  checkIfLate(classStartTime: string, maxDelayMinutes: number = 30): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHours, startMinutes] = classStartTime.split(':').map(Number);
    const classStartMinutes = startHours * 60 + startMinutes;
    
    const allowedLateTime = classStartMinutes + maxDelayMinutes;
    
    return currentTime > allowedLateTime;
  }

  checkIfClassEnded(classEndTime: string): boolean {
    if (!classEndTime) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [endHours, endMinutes] = classEndTime.split(':').map(Number);
    const classEndMinutes = endHours * 60 + endMinutes;
    
    return currentTime > classEndMinutes;
  }
}