import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  stats: any = {
    books: { total: 0, available: 0, issued: 0, overdue: 0, reserved: 0, lost: 0 },
    members: { total: 0, active: 0, expired: 0 },
    transactions: { today: 0, monthly: 0 },
    fines: { collected: 0, pending: 0 },
    reservations: { active: 0 }
  };
  recentActivities: any[] = [];
  popularBooks: any[] = [];
  today = new Date();
  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadDashboard(): void {
    const headers = this.getHeaders();

    this.http.get<any>(`${this.baseUrl}/dashboard/stats`, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.stats = res.data;
            this.cdr.detectChanges();
            console.log('Stats updated:', this.stats);
          }
        },
        error: (err) => console.error('Stats error:', err)
      });

    this.http.get<any>(`${this.baseUrl}/dashboard/recent-activities`, { headers })
      .subscribe({
        next: (res) => {
          this.recentActivities = res.data?.slice(0, 8) || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Activities error:', err)
      });

    this.http.get<any>(`${this.baseUrl}/dashboard/popular-books`, { headers })
      .subscribe({
        next: (res) => {
          this.popularBooks = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Books error:', err)
      });
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  getActivityIcon(action: string): string {
    const icons: any = {
      'CREATE': 'add_circle',
      'UPDATE': 'edit',
      'DELETE': 'delete',
      'LOGIN': 'login',
      'LOGOUT': 'logout',
      'ISSUE': 'book',
      'RETURN': 'assignment_return',
      'PAYMENT': 'payments',
    };
    return icons[action] || 'info';
  }

  getActivityClass(action: string): string {
    const classes: any = {
      'CREATE': 'create',
      'UPDATE': 'update',
      'DELETE': 'delete',
      'LOGIN': 'login',
      'LOGOUT': 'login',
      'ISSUE': 'issue',
      'RETURN': 'return',
      'PAYMENT': 'create',
    };
    return classes[action] || 'default';
  }
}