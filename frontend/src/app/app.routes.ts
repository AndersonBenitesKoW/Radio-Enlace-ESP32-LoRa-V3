import { Routes } from '@angular/router';
import { DashboardPageComponent } from './dashboard/pages/dashboard-page/dashboard-page.component';

export const routes: Routes = [
  { path: '', component: DashboardPageComponent },
  { path: '**', redirectTo: '' },
];
