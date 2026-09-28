import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications implements OnInit {
  notifications: any[] = [];
  isLoading = true;
  isSending = false;
  activeTab = 'all';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 15;

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadNotifications(): void {
    this.isLoading = true;
    const headers = this.getHeaders();
    const isRead = this.activeTab === 'unread' ? 'false'
      : this.activeTab === 'read' ? 'true' : '';
    const params = `?page=${this.currentPage}&limit=${this.limit}&isRead=${isRead}`;

    this.http.get<any>(`${this.baseUrl}/notifications${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.notifications = res.data || [];
          this.total = res.pagination?.total || 0;
          this.totalPages = res.pagination?.totalPages || 1;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadNotifications();
  }

  markAsRead(id: number): void {
    const headers = this.getHeaders();
    this.http.patch<any>(`${this.baseUrl}/notifications/${id}/read`, {}, { headers })
      .subscribe({
        next: () => this.loadNotifications(),
        error: (err) => console.error(err)
      });
  }

  sendDueReminders(): void {
    this.isSending = true;
    const headers = this.getHeaders();
    this.http.post<any>(`${this.baseUrl}/notifications/send/due-reminders`, {}, { headers })
      .subscribe({
        next: (res) => {
          alert(`Due reminders sent: ${res.data?.count || 0}`);
          this.isSending = false;
          this.loadNotifications();
        },
        error: (err) => {
          alert(err.error?.message || 'Error sending reminders');
          this.isSending = false;
        }
      });
  }

  sendOverdueNotifications(): void {
    this.isSending = true;
    const headers = this.getHeaders();
    this.http.post<any>(`${this.baseUrl}/notifications/send/overdue`, {}, { headers })
      .subscribe({
        next: (res) => {
          alert(`Overdue notifications sent: ${res.data?.count || 0}`);
          this.isSending = false;
          this.loadNotifications();
        },
        error: (err) => {
          alert(err.error?.message || 'Error sending notifications');
          this.isSending = false;
        }
      });
  }

  sendMembershipExpiry(): void {
    this.isSending = true;
    const headers = this.getHeaders();
    this.http.post<any>(
      `${this.baseUrl}/notifications/send/membership-expiry`, {}, { headers }
    ).subscribe({
        next: (res) => {
          alert(`Membership expiry notifications sent: ${res.data?.count || 0}`);
          this.isSending = false;
          this.loadNotifications();
        },
        error: (err) => {
          alert(err.error?.message || 'Error sending notifications');
          this.isSending = false;
        }
      });
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getTypeIcon(type: string): string {
    const icons: any = {
      'DUE_REMINDER': 'schedule',
      'OVERDUE': 'warning',
      'RESERVATION_AVAILABLE': 'bookmark',
      'MEMBERSHIP_EXPIRY': 'card_membership',
      'NEW_ARRIVAL': 'new_releases',
      'GENERAL': 'notifications'
    };
    return icons[type] || 'notifications';
  }

  getTypeClass(type: string): string {
    const classes: any = {
      'DUE_REMINDER': 'type-due',
      'OVERDUE': 'type-overdue',
      'RESERVATION_AVAILABLE': 'type-reservation',
      'MEMBERSHIP_EXPIRY': 'type-expiry',
      'NEW_ARRIVAL': 'type-arrival',
      'GENERAL': 'type-general'
    };
    return classes[type] || 'type-general';
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      'DUE_REMINDER': 'Due Reminder',
      'OVERDUE': 'Overdue',
      'RESERVATION_AVAILABLE': 'Reservation',
      'MEMBERSHIP_EXPIRY': 'Membership',
      'NEW_ARRIVAL': 'New Arrival',
      'GENERAL': 'General'
    };
    return labels[type] || type;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }
}