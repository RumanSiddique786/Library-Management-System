import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit {
  activeTab = 'library';
  isLoading = false;
  isSaving = false;

  // Library Settings
  librarySettings: any = null;
  settingsForm: any = {};

  // Holidays
  holidays: any[] = [];
  showHolidayModal = false;
  holidayForm: any = { name: '', date: '' };

  // Member Types
  memberTypes: any[] = [];
  showMemberTypeModal = false;
  isEditingMemberType = false;
  selectedMemberType: any = null;
  memberTypeForm: any = {
    name: '', maxBooks: 3, maxDays: 14,
    finePerDay: 1.00, renewalLimit: 2, membershipDuration: 365
  };

  // Languages
  languages: any[] = [];
  showLanguageModal = false;
  languageForm: any = { name: '', code: '' };

  // Subjects
  subjects: any[] = [];
  showSubjectModal = false;
  subjectForm: any = { name: '' };

  // Vendors
  vendors: any[] = [];
  showVendorModal = false;
  vendorForm: any = { name: '', contact: '', email: '', address: '' };

  // Audit Logs
  auditLogs: any[] = [];
  auditTotal = 0;
  auditPage = 1;
  auditLimit = 15;
  auditFilter = { module: '', action: '' };

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLibrarySettings();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    switch (tab) {
      case 'library': this.loadLibrarySettings(); break;
      case 'holidays': this.loadHolidays(); break;
      case 'member-types': this.loadMemberTypes(); break;
      case 'languages': this.loadLanguages(); break;
      case 'subjects': this.loadSubjects(); break;
      case 'vendors': this.loadVendors(); break;
      case 'audit': this.loadAuditLogs(); break;
      case 'location':
              this.loadFloors();
              this.loadRacks();
              this.loadShelves();
             break;
    }
  }

  loadLibrarySettings(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/settings`, { headers })
      .subscribe({
        next: (res) => {
          this.librarySettings = res.data;
          this.settingsForm = { ...res.data };
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  saveLibrarySettings(): void {
    this.isSaving = true;
    const headers = this.getHeaders();
    this.http.put<any>(`${this.baseUrl}/settings`, this.settingsForm, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            alert('Settings saved successfully!');
            this.loadLibrarySettings();
          }
          this.isSaving = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.error?.message || 'Error saving settings');
          this.isSaving = false;
        }
      });
  }

  loadHolidays(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/settings/holidays`, { headers })
      .subscribe({
        next: (res) => { this.holidays = res.data || []; this.cdr.detectChanges(); },
        error: (err) => console.error(err)
      });
  }

  addHoliday(): void {
    if (!this.holidayForm.name || !this.holidayForm.date) {
      alert('Name and date are required!');
      return;
    }
    const headers = this.getHeaders();
    this.http.post<any>(`${this.baseUrl}/settings/holidays`, this.holidayForm, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showHolidayModal = false;
            this.holidayForm = { name: '', date: '' };
            this.loadHolidays();
          }
        },
        error: (err) => alert(err.error?.message || 'Error adding holiday')
      });
  }

  deleteHoliday(id: number): void {
    if (!confirm('Delete this holiday?')) return;
    const headers = this.getHeaders();
    this.http.delete<any>(`${this.baseUrl}/settings/holidays/${id}`, { headers })
      .subscribe({
        next: () => this.loadHolidays(),
        error: (err) => alert(err.error?.message || 'Error deleting holiday')
      });
  }

  loadMemberTypes(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/settings/member-types`, { headers })
      .subscribe({
        next: (res) => { this.memberTypes = res.data || []; this.cdr.detectChanges(); },
        error: (err) => console.error(err)
      });
  }

  openAddMemberType(): void {
    this.isEditingMemberType = false;
    this.selectedMemberType = null;
    this.memberTypeForm = {
      name: '', maxBooks: 3, maxDays: 14,
      finePerDay: 1.00, renewalLimit: 2, membershipDuration: 365
    };
    this.showMemberTypeModal = true;
    this.cdr.detectChanges();
  }

  openEditMemberType(type: any): void {
    this.isEditingMemberType = true;
    this.selectedMemberType = { ...type };
    this.memberTypeForm = {
      name: type.name,
      maxBooks: type.maxBooks,
      maxDays: type.maxDays,
      finePerDay: type.finePerDay,
      renewalLimit: type.renewalLimit,
      membershipDuration: type.membershipDuration
    };
    this.showMemberTypeModal = true;
    this.cdr.detectChanges();
  }

  saveMemberType(): void {
    const headers = this.getHeaders();
    const url = this.isEditingMemberType
      ? `${this.baseUrl}/settings/member-types/${this.selectedMemberType.id}`
      : `${this.baseUrl}/settings/member-types`;
    const method = this.isEditingMemberType ? 'put' : 'post';

    this.http[method]<any>(url, this.memberTypeForm, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showMemberTypeModal = false;
            this.loadMemberTypes();
          }
        },
        error: (err) => alert(err.error?.message || 'Error saving member type')
      });
  }

  loadLanguages(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/settings/languages`, { headers })
      .subscribe({
        next: (res) => { this.languages = res.data || []; this.cdr.detectChanges(); },
        error: (err) => console.error(err)
      });
  }

  addLanguage(): void {
    if (!this.languageForm.name || !this.languageForm.code) {
      alert('Name and code are required!');
      return;
    }
    const headers = this.getHeaders();
    this.http.post<any>(`${this.baseUrl}/settings/languages`, this.languageForm, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showLanguageModal = false;
            this.languageForm = { name: '', code: '' };
            this.loadLanguages();
          }
        },
        error: (err) => alert(err.error?.message || 'Error adding language')
      });
  }

  loadSubjects(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/settings/subjects`, { headers })
      .subscribe({
        next: (res) => { this.subjects = res.data || []; this.cdr.detectChanges(); },
        error: (err) => console.error(err)
      });
  }

  addSubject(): void {
    if (!this.subjectForm.name) {
      alert('Subject name is required!');
      return;
    }
    const headers = this.getHeaders();
    this.http.post<any>(`${this.baseUrl}/settings/subjects`, this.subjectForm, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showSubjectModal = false;
            this.subjectForm = { name: '' };
            this.loadSubjects();
          }
        },
        error: (err) => alert(err.error?.message || 'Error adding subject')
      });
  }

  loadVendors(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/settings/vendors`, { headers })
      .subscribe({
        next: (res) => { this.vendors = res.data || []; this.cdr.detectChanges(); },
        error: (err) => console.error(err)
      });
  }

  addVendor(): void {
    if (!this.vendorForm.name) {
      alert('Vendor name is required!');
      return;
    }
    const headers = this.getHeaders();
    this.http.post<any>(`${this.baseUrl}/settings/vendors`, this.vendorForm, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showVendorModal = false;
            this.vendorForm = { name: '', contact: '', email: '', address: '' };
            this.loadVendors();
          }
        },
        error: (err) => alert(err.error?.message || 'Error adding vendor')
      });
  }

  loadAuditLogs(): void {
    const headers = this.getHeaders();
    const params = `?page=${this.auditPage}&limit=${this.auditLimit}&module=${this.auditFilter.module}&action=${this.auditFilter.action}`;
    this.http.get<any>(`${this.baseUrl}/settings/audit-logs${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.auditLogs = res.data || [];
          this.auditTotal = res.pagination?.total || 0;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  closeModal(): void {
  this.showHolidayModal = false;
  this.showMemberTypeModal = false;
  this.showLanguageModal = false;
  this.showSubjectModal = false;
  this.showVendorModal = false;
  this.showFloorModal = false;
  this.showRackModal = false;
  this.showShelfModal = false;
  this.showChangePasswordModal = false;  
  this.cdr.detectChanges();
  }

  getActionClass(action: string): string {
    const classes: any = {
      'CREATE': 'action-create',
      'UPDATE': 'action-update',
      'DELETE': 'action-delete',
      'LOGIN': 'action-login',
      'LOGOUT': 'action-logout',
      'ISSUE': 'action-issue',
      'RETURN': 'action-return',
      'PAYMENT': 'action-create'
    };
    return classes[action] || 'action-default';
  }

  getActionIcon(action: string): string {
    const icons: any = {
      'CREATE': 'add_circle',
      'UPDATE': 'edit',
      'DELETE': 'delete',
      'LOGIN': 'login',
      'LOGOUT': 'logout',
      'ISSUE': 'book',
      'RETURN': 'assignment_return',
      'PAYMENT': 'payments'
    };
    return icons[action] || 'info';
  }

  modules = ['AUTH', 'BOOKS', 'MEMBERS', 'TRANSACTIONS', 'FINES', 'RESERVATIONS', 'SETTINGS', 'USERS'];
  actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ISSUE', 'RETURN', 'PAYMENT'];

  // Added properties
showChangePasswordModal = false;
changePasswordForm: any = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};
isChangingPassword = false;
hideCurrentPass = true;
hideNewPass = true;
hideConfirmPass = true;

// Added methods
openChangePassword(): void {
  this.changePasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  this.showChangePasswordModal = true;
  this.cdr.detectChanges();
}

changePassword(): void {
  const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('All fields are required!');
    return;
  }

  if (newPassword.length < 6) {
    alert('New password must be at least 6 characters!');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('New passwords do not match!');
    return;
  }

  this.isChangingPassword = true;
  const headers = this.getHeaders();

  this.http.post<any>(
    `${this.baseUrl}/auth/change-password`,
    { currentPassword, newPassword },
    { headers }
  ).subscribe({
    next: (res) => {
      if (res.success) {
        alert('Password changed successfully! Please login again.');
        this.showChangePasswordModal = false;
        this.isChangingPassword = false;
        // Logout after password change
        localStorage.clear();
        window.location.href = '/auth/login';
      }
    },
    error: (err) => {
      alert(err.error?.message || 'Error changing password');
      this.isChangingPassword = false;
    }
  });
}
 
 // Add properties
floors: any[] = [];
racks: any[] = [];
shelves: any[] = [];
showFloorModal = false;
showRackModal = false;
showShelfModal = false;
floorForm: any = { name: '' };
rackForm: any = { name: '', floorId: '' };
shelfForm: any = { name: '', rackId: '' };

// Add methods
loadFloors(): void {
  const headers = this.getHeaders();
  this.http.get<any>(`${this.baseUrl}/settings/floors`, { headers })
    .subscribe({
      next: (res) => {
        this.floors = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
}

addFloor(): void {
  if (!this.floorForm.name) { alert('Floor name required!'); return; }
  const headers = this.getHeaders();
  this.http.post<any>(`${this.baseUrl}/settings/floors`, this.floorForm, { headers })
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.showFloorModal = false;
          this.floorForm = { name: '' };
          this.loadFloors();
        }
      },
      error: (err) => alert(err.error?.message || 'Error adding floor')
    });
}

loadRacks(): void {
  const headers = this.getHeaders();
  this.http.get<any>(`${this.baseUrl}/settings/racks`, { headers })
    .subscribe({
      next: (res) => {
        this.racks = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
}

addRack(): void {
  if (!this.rackForm.name || !this.rackForm.floorId) {
    alert('Rack name and floor required!'); return;
  }
  const headers = this.getHeaders();
  this.http.post<any>(`${this.baseUrl}/settings/racks`, this.rackForm, { headers })
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.showRackModal = false;
          this.rackForm = { name: '', floorId: '' };
          this.loadRacks();
        }
      },
      error: (err) => alert(err.error?.message || 'Error adding rack')
    });
}

loadShelves(): void {
  const headers = this.getHeaders();
  this.http.get<any>(`${this.baseUrl}/settings/shelves`, { headers })
    .subscribe({
      next: (res) => {
        this.shelves = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
}

addShelf(): void {
  if (!this.shelfForm.name || !this.shelfForm.rackId) {
    alert('Shelf name and rack required!'); return;
  }
  const headers = this.getHeaders();
  this.http.post<any>(`${this.baseUrl}/settings/shelves`, this.shelfForm, { headers })
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.showShelfModal = false;
          this.shelfForm = { name: '', rackId: '' };
          this.loadShelves();
        }
      },
      error: (err) => alert(err.error?.message || 'Error adding shelf')
    });
}

toggleCurrentPass(): void {
  this.hideCurrentPass = !this.hideCurrentPass;
  this.cdr.detectChanges();
}

toggleNewPass(): void {
  this.hideNewPass = !this.hideNewPass;
  this.cdr.detectChanges();
}

toggleConfirmPass(): void {
  this.hideConfirmPass = !this.hideConfirmPass;
  this.cdr.detectChanges();
}

}