import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fines',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './fines.html',
  styleUrl: './fines.scss'
})
export class Fines implements OnInit {
  fines: any[] = [];
  stats: any = null;
  isLoading = true;
  showPayModal = false;
  showWaiveModal = false;
  showViewModal = false;
  selectedFine: any = null;
  statusFilter = '';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 10;

  payForm: any = { amount: '', paymentMode: 'CASH' };
  waiveForm: any = { reason: '' };

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFines();
    this.loadStats();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadStats(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/fines/stats`, { headers })
      .subscribe({
        next: (res) => {
          this.stats = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  loadFines(): void {
    this.isLoading = true;
    const headers = this.getHeaders();
    const params = `?page=${this.currentPage}&limit=${this.limit}&status=${this.statusFilter}`;

    this.http.get<any>(`${this.baseUrl}/fines${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.fines = res.data || [];
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

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadFines();
  }

  viewFine(fine: any): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/fines/${fine.id}`, { headers })
      .subscribe({
        next: (res) => {
          this.selectedFine = res.data;
          this.showViewModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  paymentModes = ['CASH', 'CARD', 'UPI', 'ONLINE'];

  openPayModal(fine: any): void {
    this.selectedFine = { ...fine };
    this.payForm = {
    amount: parseFloat(fine.amount) - parseFloat(fine.paidAmount),
    paymentMode: 'CASH'  // ← default selected
   };
    this.showPayModal = true;
    this.cdr.detectChanges();
  }

  openWaiveModal(fine: any): void {
    this.selectedFine = { ...fine };
    this.waiveForm = { reason: '' };
    this.showWaiveModal = true;
    this.cdr.detectChanges();
  }

  payFine(): void {
    if (!this.payForm.amount || this.payForm.amount <= 0) {
      alert('Please enter a valid amount!');
      return;
    }

    const headers = this.getHeaders();
    this.http.post<any>(
      `${this.baseUrl}/fines/${this.selectedFine.id}/pay`,
      {
        amount: parseFloat(this.payForm.amount),
        paymentMode: this.payForm.paymentMode
      },
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert(res.data?.message || 'Payment successful!');
          this.closeModal();
          this.loadFines();
          this.loadStats();
        }
      },
      error: (err) => alert(err.error?.message || 'Error processing payment')
    });
  }

  waiveFine(): void {
    if (!this.waiveForm.reason) {
      alert('Please enter a reason for waiving!');
      return;
    }

    const headers = this.getHeaders();
    this.http.patch<any>(
      `${this.baseUrl}/fines/${this.selectedFine.id}/waive`,
      { reason: this.waiveForm.reason },
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Fine waived successfully!');
          this.closeModal();
          this.loadFines();
          this.loadStats();
        }
      },
      error: (err) => alert(err.error?.message || 'Error waiving fine')
    });
  }

  closeModal(): void {
    this.showPayModal = false;
    this.showWaiveModal = false;
    this.showViewModal = false;
    this.selectedFine = null;
    this.cdr.detectChanges();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadFines();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'PENDING': 'badge-warning',
      'PAID': 'badge-success',
      'WAIVED': 'badge-gray',
      'PARTIAL': 'badge-info'
    };
    return classes[status] || 'badge-gray';
  }

  getTypeIcon(type: string): string {
    const icons: any = {
      'LATE_RETURN': 'schedule',
      'LOST_BOOK': 'report_problem',
      'DAMAGED_BOOK': 'build',
      'MEMBERSHIP_EXPIRY': 'card_membership'
    };
    return icons[type] || 'payments';
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      'LATE_RETURN': 'Late Return',
      'LOST_BOOK': 'Lost Book',
      'DAMAGED_BOOK': 'Damaged Book',
      'MEMBERSHIP_EXPIRY': 'Membership Expiry'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: any = {
      'LATE_RETURN': 'type-late',
      'LOST_BOOK': 'type-lost',
      'DAMAGED_BOOK': 'type-damaged',
      'MEMBERSHIP_EXPIRY': 'type-expiry'
    };
    return classes[type] || '';
  }

  getRemainingAmount(fine: any): number {
    return parseFloat(fine.amount) - parseFloat(fine.paidAmount);
  }

  getProgressPercent(fine: any): number {
    return (parseFloat(fine.paidAmount) / parseFloat(fine.amount)) * 100;
  }

//  paymentModes = ['CASH', 'CARD', 'UPI', 'ONLINE'];


printFineReceipt(fine: any): void {
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fine Receipt #${fine.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #333;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .header h1 { font-size: 20px; font-weight: bold; }
        .header p { font-size: 12px; color: #555; }
        .receipt-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          background: #f0f0f0;
          padding: 8px;
          margin-bottom: 12px;
          border-radius: 4px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .row .label { color: #555; }
        .row .value { font-weight: bold; }
        .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: bold;
          margin: 8px 0;
        }
        .status {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          padding: 8px;
          border: 2px solid;
          border-radius: 8px;
          margin: 12px 0;
        }
        .status.paid { color: #10b981; border-color: #10b981; }
        .status.pending { color: #f59e0b; border-color: #f59e0b; }
        .status.waived { color: #8b5cf6; border-color: #8b5cf6; }
        .footer {
          text-align: center;
          margin-top: 16px;
          font-size: 11px;
          color: #777;
        }
        .payment-history { margin-top: 12px; }
        .payment-item {
          font-size: 12px;
          padding: 4px 0;
          border-bottom: 1px dotted #ccc;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📚 Library System</h1>
        <p>Fine Payment Receipt</p>
      </div>

      <div class="receipt-title">💰 FINE RECEIPT</div>

      <div class="row">
        <span class="label">Receipt No.</span>
        <span class="value">FINE-#${fine.id}</span>
      </div>
      <div class="row">
        <span class="label">Member Name</span>
        <span class="value">${fine.member?.name}</span>
      </div>
      <div class="row">
        <span class="label">Member ID</span>
        <span class="value">${fine.member?.memberId}</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Fine Type</span>
        <span class="value">${fine.type?.replace(/_/g, ' ')}</span>
      </div>
      <div class="row">
        <span class="label">Reason</span>
        <span class="value" style="max-width:60%;text-align:right;font-size:11px">
          ${fine.reason || 'Library fine'}
        </span>
      </div>
      <div class="row">
        <span class="label">Fine Date</span>
        <span class="value">${new Date(fine.createdAt).toLocaleDateString()}</span>
      </div>

      <div class="divider"></div>

      <div class="total-row">
        <span>Total Fine</span>
        <span>₹${fine.amount}</span>
      </div>
      <div class="row">
        <span class="label">Amount Paid</span>
        <span class="value" style="color:#10b981">₹${fine.paidAmount}</span>
      </div>
      <div class="row">
        <span class="label">Remaining</span>
        <span class="value" style="color:#ef4444">
          ₹${(parseFloat(fine.amount) - parseFloat(fine.paidAmount)).toFixed(2)}
        </span>
      </div>

      ${fine.payments?.length > 0 ? `
      <div class="payment-history">
        <div style="font-size:12px;font-weight:bold;margin-bottom:6px;color:#555">
          PAYMENT HISTORY
        </div>
        ${fine.payments.map((p: any) => `
          <div class="payment-item">
            <span>${new Date(p.paidAt).toLocaleDateString()} - ${p.paymentMode}</span>
            <span style="font-weight:bold">₹${p.amount}</span>
          </div>
        `).join('')}
      </div>` : ''}

      <div class="divider"></div>

      <div class="status ${fine.status.toLowerCase()}">
        ${fine.status === 'PAID' ? '✅' : fine.status === 'WAIVED' ? '🔵' : '⏳'} ${fine.status}
      </div>

      <div class="footer">
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Transaction ID: #${fine.transactionId}</p>
        <br>
        <button onclick="window.print()"
          style="padding:8px 20px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">
          🖨️ Print Receipt
        </button>
      </div>
    </body>
    </html>
  `;

 const newTab = window.open('', '_blank');
if (newTab) {
  newTab.document.write(receiptHTML);
  newTab.document.close();
  // Wait for content to load then auto-trigger print dialog
  newTab.addEventListener('load', () => {
    newTab.focus();
    newTab.print();
  });
  // Fallback if load event doesn't fire
  setTimeout(() => {
    newTab.focus();
    newTab.print();
  }, 800);
}
}

  // Add these methods

selectPaymentMode(mode: string): void {
  this.payForm = { ...this.payForm, paymentMode: mode };
  this.cdr.detectChanges();
}

setFullAmount(): void {
  this.payForm = {
    ...this.payForm,
    amount: this.getRemainingAmount(this.selectedFine)
  };
  this.cdr.detectChanges();
}

setHalfAmount(): void {
  this.payForm = {
    ...this.payForm,
    amount: this.getRemainingAmount(this.selectedFine) / 2
  };
  this.cdr.detectChanges();
}

copyUpiId(): void {
  navigator.clipboard.writeText('library@upi').then(() => {
    alert('UPI ID copied!');
  });
}
}