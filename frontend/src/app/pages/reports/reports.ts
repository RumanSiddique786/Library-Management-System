import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports implements OnInit {
  activeTab = 'books';
  isLoading = false;

  // Book Report
  bookReport: any = null;
  bookFilter = { status: '', categoryId: '', from: '', to: '' };

  // Member Report
  memberReport: any = null;
  memberFilter = { status: '', memberTypeId: '', from: '', to: '' };

  // Transaction Report
  transactionReport: any = null;
  transactionFilter = { period: 'monthly', status: '', from: '', to: '' };

  // Fine Report
  fineReport: any = null;
  fineFilter = { status: '', type: '', from: '', to: '' };

  // Inventory Report
  inventoryReport: any = null;

  // Reservation Report
  reservationReport: any = null;
  reservationFilter = { status: '', from: '', to: '' };

  categories: any[] = [];
  memberTypes: any[] = [];

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadMemberTypes();
    this.loadReport('books');
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadCategories(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/books/categories/all`, { headers })
      .subscribe({ next: (res) => { this.categories = res.data || []; this.cdr.detectChanges(); } });
  }

  loadMemberTypes(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/members/types`, { headers })
      .subscribe({ next: (res) => { this.memberTypes = res.data || []; this.cdr.detectChanges(); } });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.loadReport(tab);
  }

  loadReport(type: string): void {
    this.isLoading = true;
    const headers = this.getHeaders();

    let url = '';
    let params = '';

    switch (type) {
      case 'books':
        params = this.buildParams(this.bookFilter);
        url = `${this.baseUrl}/reports/books${params}`;
        this.http.get<any>(url, { headers }).subscribe({
          next: (res) => { this.bookReport = res.data; this.isLoading = false; this.cdr.detectChanges(); },
          error: () => { this.isLoading = false; }
        });
        break;

      case 'members':
        params = this.buildParams(this.memberFilter);
        url = `${this.baseUrl}/reports/members${params}`;
        this.http.get<any>(url, { headers }).subscribe({
          next: (res) => { this.memberReport = res.data; this.isLoading = false; this.cdr.detectChanges(); },
          error: () => { this.isLoading = false; }
        });
        break;

      case 'transactions':
        params = this.buildParams(this.transactionFilter);
        url = `${this.baseUrl}/reports/transactions${params}`;
        this.http.get<any>(url, { headers }).subscribe({
          next: (res) => { this.transactionReport = res.data; this.isLoading = false; this.cdr.detectChanges(); },
          error: () => { this.isLoading = false; }
        });
        break;

      case 'fines':
        params = this.buildParams(this.fineFilter);
        url = `${this.baseUrl}/reports/fines${params}`;
        this.http.get<any>(url, { headers }).subscribe({
          next: (res) => { this.fineReport = res.data; this.isLoading = false; this.cdr.detectChanges(); },
          error: () => { this.isLoading = false; }
        });
        break;

      case 'inventory':
        url = `${this.baseUrl}/reports/inventory`;
        this.http.get<any>(url, { headers }).subscribe({
          next: (res) => { this.inventoryReport = res.data; this.isLoading = false; this.cdr.detectChanges(); },
          error: () => { this.isLoading = false; }
        });
        break;

      case 'reservations':
        params = this.buildParams(this.reservationFilter);
        url = `${this.baseUrl}/reports/reservations${params}`;
        this.http.get<any>(url, { headers }).subscribe({
          next: (res) => { this.reservationReport = res.data; this.isLoading = false; this.cdr.detectChanges(); },
          error: () => { this.isLoading = false; }
        });
        break;
    }
  }

  buildParams(filter: any): string {
    const params = Object.entries(filter)
      .filter(([_, v]) => v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return params ? `?${params}` : '';
  }

  exportCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(v =>
        typeof v === 'object' ? JSON.stringify(v) : v
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'ACTIVE': 'badge-success',
      'RETURNED': 'badge-gray',
      'OVERDUE': 'badge-danger',
      'AVAILABLE': 'badge-success',
      'ISSUED': 'badge-info',
      'PAID': 'badge-success',
      'PENDING': 'badge-warning',
      'WAIVED': 'badge-gray',
      'PARTIAL': 'badge-info',
      'COLLECTED': 'badge-gray',
      'CANCELLED': 'badge-danger',
      'EXPIRED': 'badge-danger'
    };
    return classes[status] || 'badge-gray';
  }

  getCopyStatusClass(status: string): string {
    const classes: any = {
      'AVAILABLE': 'badge-success',
      'ISSUED': 'badge-info',
      'RESERVED': 'badge-warning',
      'LOST': 'badge-danger',
      'DAMAGED': 'badge-danger',
      'MAINTENANCE': 'badge-gray'
    };
    return classes[status] || 'badge-gray';
  }
  
   getAuthorNames(book: any): string {
  if (!book?.authors?.length) {
    return '—';
  }

  return book.authors
    .map((author: any) => author.author?.name)
    .join(', ');
  }

  getRemainingAmount(fine: any): string {
  const amount = parseFloat(fine.amount || 0);
  const paid = parseFloat(fine.paidAmount || 0);

  return (amount - paid).toFixed(2);
  }

  periods = ['daily', 'weekly', 'monthly', 'yearly'];
  fineTypes = ['LATE_RETURN', 'LOST_BOOK', 'DAMAGED_BOOK', 'MEMBERSHIP_EXPIRY'];
}