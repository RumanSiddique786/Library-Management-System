import { Routes } from '@angular/router';

export const mainLayoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./main-layout').then(m => m.MainLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../../pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'users',
        loadComponent: () => import('../../pages/users/users').then(m => m.Users)
      },
      {
        path: 'members',
        loadComponent: () => import('../../pages/members/members').then(m => m.Members)
      },
      {
        path: 'books',
        loadComponent: () => import('../../pages/books/books').then(m => m.Books)
      },
      {
        path: 'book-search',
        loadComponent: () => import('../../pages/books/book-search').then(m => m.BookSearch)
      },
      {
        path: 'transactions',
        loadComponent: () => import('../../pages/transactions/transactions').then(m => m.Transactions)
      },
      {
        path: 'fines',
        loadComponent: () => import('../../pages/fines/fines').then(m => m.Fines)
      },
      {
        path: 'reservations',
        loadComponent: () => import('../../pages/reservations/reservations').then(m => m.Reservations)
      },
      {
        path: 'reports',
        loadComponent: () => import('../../pages/reports/reports').then(m => m.Reports)
      },
      {
        path: 'inventory',
        loadComponent: () => import('../../pages/books/inventory').then(m => m.Inventory)
      },
      {
        path: 'settings',
        loadComponent: () => import('../../pages/settings/settings').then(m => m.Settings)
      },
      {
        path: 'notifications',
        loadComponent: () => import('../../pages/notifications/notifications').then(m => m.Notifications)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];