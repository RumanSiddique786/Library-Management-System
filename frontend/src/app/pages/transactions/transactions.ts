import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss'
})
export class Transactions implements OnInit {
  transactions: any[] = [];
  members: any[] = [];
  books: any[] = [];
  bookCopies: any[] = [];
  isLoading = true;
  showIssueModal = false;
  showViewModal = false;
  showReturnConfirm = false;
  showRenewConfirm = false;
  selectedTransaction: any = null;
  returnTransactionId: number | null = null;
  renewTransactionId: number | null = null;
  statusFilter = '';
  searchMember = '';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 10;

  issueForm: any = {
    memberId: '',
    bookCopyId: '',
    memberSearch: '',
    bookSearch: ''
  };

  returnForm: any = {
    condition: 'GOOD'
  };

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadTransactions(): void {
    this.isLoading = true;
    const headers = this.getHeaders();
    const params = `?page=${this.currentPage}&limit=${this.limit}&status=${this.statusFilter}`;

    this.http.get<any>(`${this.baseUrl}/transactions${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.transactions = res.data || [];
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

  loadMembers(search: string = ''): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/members?search=${search}&limit=20`, { headers })
      .subscribe({
        next: (res) => {
          this.members = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  loadBooks(search: string = ''): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/books/search?q=${search}&filter=available`, { headers })
      .subscribe({
        next: (res) => {
          this.books = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  openIssueModal(): void {
    this.issueForm = {
      memberId: '',
      bookCopyId: '',
      memberSearch: '',
      bookSearch: ''
    };
    this.members = [];
    this.books = [];
    this.showIssueModal = true;
    this.cdr.detectChanges();
  }

  onMemberSearch(): void {
    if (this.issueForm.memberSearch.length >= 2) {
      this.loadMembers(this.issueForm.memberSearch);
    }
  }

  onBookSearch(): void {
    if (this.issueForm.bookSearch.length >= 2) {
      this.loadBooks(this.issueForm.bookSearch);
    }
  }

  selectMember(member: any): void {
    this.issueForm.memberId = member.id;
    this.issueForm.memberSearch = `${member.name} (${member.memberId})`;
    this.members = [];
    this.cdr.detectChanges();
  }

  selectBookCopy(book: any, copy: any): void {
    this.issueForm.bookCopyId = copy.id;
    this.issueForm.bookSearch = `${book.title} - ${copy.copyCode}`;
    this.books = [];
    this.cdr.detectChanges();
  }

  issueBook(): void {
    if (!this.issueForm.memberId || !this.issueForm.bookCopyId) {
      alert('Please select both member and book copy!');
      return;
    }

    const headers = this.getHeaders();
    this.http.post<any>(
      `${this.baseUrl}/transactions/issue`,
      {
        memberId: parseInt(this.issueForm.memberId),
        bookCopyId: parseInt(this.issueForm.bookCopyId)
      },
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal();
          this.loadTransactions();
          alert('Book issued successfully!');
        }
      },
      error: (err) => alert(err.error?.message || 'Error issuing book')
    });
  }

  viewTransaction(transaction: any): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/transactions/${transaction.id}`, { headers })
      .subscribe({
        next: (res) => {
          this.selectedTransaction = res.data;
          this.showViewModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  openReturnConfirm(id: number): void {
    this.returnTransactionId = id;
    this.returnForm = { condition: 'GOOD' };
    this.showReturnConfirm = true;
    this.cdr.detectChanges();
  }

  confirmReturn(): void {
    if (!this.returnTransactionId) return;
    const headers = this.getHeaders();

    this.http.post<any>(
      `${this.baseUrl}/transactions/${this.returnTransactionId}/return`,
      { condition: this.returnForm.condition },
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          const fineMsg = res.data?.fineAmount > 0
            ? `\nFine charged: ₹${res.data.fineAmount}`
            : '';
          alert(`Book returned successfully!${fineMsg}`);
          this.closeModal();
          this.loadTransactions();
        }
      },
      error: (err) => alert(err.error?.message || 'Error returning book')
    });
  }

  openRenewConfirm(id: number): void {
    this.renewTransactionId = id;
    this.showRenewConfirm = true;
    this.cdr.detectChanges();
  }

  confirmRenew(): void {
    if (!this.renewTransactionId) return;
    const headers = this.getHeaders();

    this.http.post<any>(
      `${this.baseUrl}/transactions/${this.renewTransactionId}/renew`,
      {},
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Book renewed successfully!');
          this.closeModal();
          this.loadTransactions();
        }
      },
      error: (err) => alert(err.error?.message || 'Error renewing book')
    });
  }

  closeModal(): void {
    this.showIssueModal = false;
    this.showViewModal = false;
    this.showReturnConfirm = false;
    this.showRenewConfirm = false;
    this.selectedTransaction = null;
    this.returnTransactionId = null;
    this.renewTransactionId = null;
    this.cdr.detectChanges();
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadTransactions();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'ACTIVE': 'badge-success',
      'RETURNED': 'badge-gray',
      'OVERDUE': 'badge-danger',
      'LOST': 'badge-warning'
    };
    return classes[status] || 'badge-gray';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'ACTIVE': 'check_circle',
      'RETURNED': 'assignment_return',
      'OVERDUE': 'warning',
      'LOST': 'report_problem'
    };
    return icons[status] || 'info';
  }

  isOverdue(dueDate: string, status: string): boolean {
    return new Date(dueDate) < new Date() && status === 'ACTIVE';
  }

  getDaysOverdue(dueDate: string): number {
    const diff = new Date().getTime() - new Date(dueDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDaysLeft(dueDate: string): number {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getBookTitle(transaction: any): string {
    return transaction.items?.[0]?.bookCopy?.book?.title || 'Unknown Book';
  }

  getCopyCode(transaction: any): string {
    return transaction.items?.[0]?.bookCopy?.copyCode || '—';
  }


printReceipt(transaction: any): void {
  const book = transaction.items?.[0]?.bookCopy?.book?.title || 'Unknown Book';
  const copy = transaction.items?.[0]?.bookCopy?.copyCode || '—';

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Library Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px;
          max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #333;
          padding-bottom: 12px; margin-bottom: 12px; }
        .header h1 { font-size: 20px; font-weight: bold; }
        .header p { font-size: 12px; color: #555; }
        .receipt-title { text-align: center; font-size: 14px; font-weight: bold;
          background: #f0f0f0; padding: 8px; margin-bottom: 12px; border-radius: 4px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .row .label { color: #555; }
        .row .value { font-weight: bold; text-align: right; max-width: 55%; }
        .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
        .status { text-align: center; font-size: 16px; font-weight: bold;
          padding: 8px; border: 2px solid #10b981; color: #10b981;
          border-radius: 8px; margin: 12px 0; }
        .btn-row { text-align: center; margin-top: 16px; }
        .print-btn { padding: 10px 24px; background: #6366f1; color: white;
          border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          cursor: pointer; margin-right: 8px; }
        .close-btn-style { padding: 10px 24px; background: #f1f5f9; color: #475569;
          border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          cursor: pointer; }
        .footer { text-align: center; margin-top: 16px;
          font-size: 11px; color: #777; }
        @media print {
          .btn-row { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📚 Library System</h1>
        <p>Transaction Receipt</p>
      </div>

      <div class="receipt-title">
        ${transaction.status === 'RETURNED' ? '✅ RETURN RECEIPT' : '📖 ISSUE RECEIPT'}
      </div>

      <div class="row">
        <span class="label">Receipt No.</span>
        <span class="value">#${transaction.id}</span>
      </div>
      <div class="row">
        <span class="label">Member Name</span>
        <span class="value">${transaction.member?.name}</span>
      </div>
      <div class="row">
        <span class="label">Member ID</span>
        <span class="value">${transaction.member?.memberId}</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Book Title</span>
        <span class="value">${book}</span>
      </div>
      <div class="row">
        <span class="label">Copy Code</span>
        <span class="value">${copy}</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Issue Date</span>
        <span class="value">${new Date(transaction.issueDate).toLocaleDateString('en-IN')}</span>
      </div>
      <div class="row">
        <span class="label">Due Date</span>
        <span class="value">${new Date(transaction.dueDate).toLocaleDateString('en-IN')}</span>
      </div>
      ${transaction.returnDate ? `
      <div class="row">
        <span class="label">Return Date</span>
        <span class="value">${new Date(transaction.returnDate).toLocaleDateString('en-IN')}</span>
      </div>` : ''}
      <div class="row">
        <span class="label">Issued By</span>
        <span class="value">${transaction.issuedBy?.name || 'Librarian'}</span>
      </div>

      ${transaction.fines?.length > 0 ? `
      <div class="divider"></div>
      <div class="row">
        <span class="label" style="color:#ef4444">Fine Amount</span>
        <span class="value" style="color:#ef4444">₹${transaction.fines[0]?.amount}</span>
      </div>
      <div class="row">
        <span class="label" style="color:#ef4444">Fine Status</span>
        <span class="value" style="color:#ef4444">${transaction.fines[0]?.status}</span>
      </div>` : ''}

      <div class="divider"></div>

      <div class="status">${transaction.status}</div>

      <div class="footer">
        <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
        <p>Thank you for using our library!</p>
      </div>

      <div class="btn-row">
        <button class="print-btn" onclick="window.print()">🖨️ Print</button>
        <button class="close-btn-style" onclick="window.close()">✕ Close</button>
      </div>
    </body>
    </html>
  `;

  const newTab = window.open('', '_blank');
 if (newTab) {
  newTab.document.write(receiptHTML);
  newTab.document.close();
  newTab.addEventListener('load', () => {
    newTab.focus();
    newTab.print();
  });
  setTimeout(() => {
    newTab.focus();
    newTab.print();
  }, 800);
 }
}

  // const printWindow = window.open('', '_blank', 'width=500,height=700');
  // if (printWindow) {
  //   printWindow.document.write(receiptHTML);
  //   printWindow.document.close();
  //   printWindow.focus();
  //   setTimeout(() => printWindow.print(), 500);
  // }
}
