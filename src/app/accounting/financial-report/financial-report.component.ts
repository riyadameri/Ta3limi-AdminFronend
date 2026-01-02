import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AccountingService } from '../../services/accounting.service';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
Chart.register(...registerables);

@Component({
  selector: 'app-financial-report',
  templateUrl: './financial-report.component.html',
  styleUrls: ['./financial-report.component.css'],
  imports : [FormsModule,CommonModule]
})
export class FinancialReportComponent implements OnInit {
  reportForm: FormGroup;
  financialReport: any = null;
  loading = false;
  chart: any;
  chartType: 'daily' | 'weekly' | 'monthly' = 'monthly';

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService
  ) {
    this.reportForm = this.fb.group({
      periodType: ['monthly'],
      month: [new Date().toISOString().slice(0, 7)],
      startDate: [''],
      endDate: [''],
      year: [new Date().getFullYear()]
    });
  }

  ngOnInit(): void {
    this.loadFinancialReport();
  }

  loadFinancialReport(): void {
    this.loading = true;
    
    const formData = this.reportForm.value;
    let params: any = {};

    if (formData.periodType === 'monthly') {
      params.month = formData.month.split('-')[1];
      params.year = formData.month.split('-')[0];
    } else if (formData.periodType === 'custom') {
      params.startDate = formData.startDate;
      params.endDate = formData.endDate;
    } else if (formData.periodType === 'yearly') {
      params.year = formData.year;
    }

    this.accountingService.getMonthlyFinancialReport(params).subscribe({
      next: (data) => {
        this.financialReport = data;
        this.generateCharts();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading financial report:', error);
        this.loading = false;
      }
    });
  }

  generateCharts(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('financialChart') as HTMLCanvasElement;
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['الإيرادات', 'المصاريف', 'صافي الربح'],
        datasets: [{
          label: 'المبلغ (د.ج)',
          data: [
            this.financialReport.income.total,
            this.financialReport.expenses.total,
            this.financialReport.profit.netProfit
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'الملف المالي',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('ar-DZ', {
                  style: 'currency',
                  currency: 'DZD',
                  minimumFractionDigits: 0
                }).format(Number(value));
              }
            }
          }
        }
      }
    });
  }

  exportReport(format: string): void {
    const params = this.reportForm.value;
    
    this.accountingService.exportFinancialReport(format, params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting report:', error);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG');
  }
}