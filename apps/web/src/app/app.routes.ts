import type { Routes } from '@angular/router';

import { ShellHomeComponent } from './shell/shell-home.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: ShellHomeComponent,
    title: 'SurakshaSutra',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
