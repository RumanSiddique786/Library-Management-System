import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class Inventory implements OnInit {
  copies: any[] = [];
  filteredCopies: any[] = [];
  isLoading = true;
  searchQuery = '';
  statusFilter = '';
  conditionFilter = '';
  isVerifying = false;
  verificationSession: any = {
    startTime: null,
    verified: 0,
    total: 0,
    issues: []
  };
  showUpdateModal = false;
  selectedCopy: any = null;
  updateForm: any = { status: '', condition: '', notes: '' };
  summary: any = null;

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadInventory(): void {
    this.isLoading = true;
    const headers = this.getHeaders();

    this.http.get<any>(`${this.baseUrl}/reports/inventory`, { headers })
      .subscribe({
        next: (res) => {
          this.copies = res.data?.copies || [];
          this.summary = res.data?.summary || null;
          this.applyFilters();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    let result = [...this.copies];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.copyCode?.toLowerCase().includes(q) ||
        c.book?.title?.toLowerCase().includes(q) ||
        c.book?.isbn?.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter) {
      result = result.filter(c => c.status === this.statusFilter);
    }

    if (this.conditionFilter) {
      result = result.filter(c => c.condition === this.conditionFilter);
    }

    this.filteredCopies = result;
    this.cdr.detectChanges();
  }

  onSearch(): void {
    this.applyFilters();
  }

  startVerification(): void {
    this.isVerifying = true;
    this.verificationSession = {
      startTime: new Date(),
      verified: 0,
      total: this.filteredCopies.length,
      issues: []
    };
    this.cdr.detectChanges();
  }

  stopVerification(): void {
    this.isVerifying = false;
    this.cdr.detectChanges();
  }

  openUpdateModal(copy: any): void {
    this.selectedCopy = { ...copy };
    this.updateForm = {
      status: copy.status,
      condition: copy.condition,
      notes: ''
    };
    this.showUpdateModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showUpdateModal = false;
    this.selectedCopy = null;
    this.cdr.detectChanges();
  }

  updateCopyStatus(): void {
    if (!this.selectedCopy) return;
    const headers = this.getHeaders();

    this.http.patch<any>(
      `${this.baseUrl}/books/copies/${this.selectedCopy.id}/status`,
      {
        status: this.updateForm.status,
        condition: this.updateForm.condition
      },
      { headers }
    ).subscribe({
      next: (res) => {
  if (res.success) {
    if (this.isVerifying) {
      this.verificationSession.verified++;
      if (
        this.updateForm.condition !== 'GOOD' ||
        this.updateForm.status === 'LOST' ||
        this.updateForm.status === 'DAMAGED'
      ) {
        const alreadyAdded = this.verificationSession.issues
          .find((i: any) => i.copyCode === this.selectedCopy.copyCode);
        if (!alreadyAdded) {
          this.verificationSession.issues.push({
            copyCode: this.selectedCopy.copyCode,
            book: this.selectedCopy.book?.title,
            issue: `${this.updateForm.condition} - ${this.updateForm.status}`
          });
        }
      }
    }
    this.closeModal();
    this.loadInventory();
  }
 },
      error: (err) => {
        alert(err.error?.message || 'Error updating copy');
      }
    });
  }

  markAsVerified(copy: any): void {
  if (!this.isVerifying) return;
  this.verificationSession.verified++;

  // If condition is not GOOD or status is problematic — add to issues
  if (copy.condition !== 'GOOD' || copy.status === 'LOST' || copy.status === 'DAMAGED') {
    const alreadyAdded = this.verificationSession.issues
      .find((i: any) => i.copyCode === copy.copyCode);
    if (!alreadyAdded) {
      this.verificationSession.issues.push({
        copyCode: copy.copyCode,
        book: copy.book?.title,
        issue: `${copy.condition} - ${copy.status}`
      });
    }
  }
  this.cdr.detectChanges();
 }

  getStatusClass(status: string): string {
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

  getConditionClass(condition: string): string {
    const classes: any = {
      'GOOD': 'cond-good',
      'DAMAGED': 'cond-damaged',
      'LOST': 'cond-lost',
      'MISSING_PAGES': 'cond-missing'
    };
    return classes[condition] || '';
  }

  getProgressPercent(): number {
    if (!this.verificationSession.total) return 0;
    return Math.round(
      (this.verificationSession.verified / this.verificationSession.total) * 100
    );
  }

  statuses = ['AVAILABLE', 'ISSUED', 'RESERVED', 'LOST', 'DAMAGED', 'MAINTENANCE'];
  conditions = ['GOOD', 'DAMAGED', 'LOST', 'MISSING_PAGES'];
}