import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit {
  isCollapsed = false;
  showUserMenu = false;
  currentUser: any = null;
  isReady = false;

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
    { label: 'Users', icon: 'manage_accounts', route: '/users', roles: ['SUPER_ADMIN'] },
    { label: 'Members', icon: 'people', route: '/members', roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
    { label: 'Books', icon: 'menu_book', route: '/books', roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
    { label: 'Inventory', icon: 'inventory_2', route: '/inventory', roles: ['SUPER_ADMIN', 'LIBRARIAN'] },
    { label: 'Book Search', icon: 'search', route: '/book-search', roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
    { label: 'Transactions', icon: 'swap_horiz', route: '/transactions', roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
    { label: 'Fines', icon: 'payments', route: '/fines', roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
    { label: 'Reservations', icon: 'bookmark', route: '/reservations', roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
    { label: 'Reports', icon: 'bar_chart', route: '/reports', roles: ['SUPER_ADMIN', 'LIBRARIAN'] },
    { label: 'Notifications', icon: 'notifications', route: '/notifications', roles: ['SUPER_ADMIN', 'LIBRARIAN'] },
    { label: 'Settings', icon: 'settings', route: '/settings', roles: ['SUPER_ADMIN'] },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();

    // Listen to route changes to refresh user
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadUser();
    });
  }

  loadUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.isReady = true;
        this.cdr.detectChanges();
      } catch (e) {
        this.currentUser = null;
        this.isReady = false;
      }
    } else {
      this.currentUser = null;
      this.isReady = false;
    }
  }

  getFilteredNavItems() {
    if (!this.currentUser?.role) return [];
    const userRole = this.currentUser.role;
    return this.navItems.filter(item => item.roles.includes(userRole));
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
  }

  getUserInitials(): string {
    const name = this.currentUser?.name || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getPageTitle(): string {
    const url = this.router.url;
    const item = this.navItems.find(n => url.startsWith(n.route));
    return item ? item.label : 'Dashboard';
  }
}