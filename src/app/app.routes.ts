import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'game/:appId',
    loadComponent: () => import('./features/game-details/game-details').then((m) => m.GameDetails),
  },
  //   {
  //     path: 'library',
  //     loadComponent: () =>
  //       import('./features/library/library').then((m) => m.LibraryComponent),
  //   },
  //   {
  //     path: 'backlog',
  //     loadComponent: () =>
  //       import('./features/backlog/backlog').then((m) => m.BacklogComponent),
  //   },
  //   {
  //     path: 'profile',
  //     loadComponent: () =>
  //       import('./features/profile/profile').then((m) => m.ProfileComponent),
  //   },
];
