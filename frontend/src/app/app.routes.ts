import { Routes } from '@angular/router';
import { DashboardPageComponent } from './dashboard/pages/dashboard-page/dashboard-page.component';
import { RadioChat } from './radio-chat/radio-chat';

export const routes: Routes = [
  { path: '', component: DashboardPageComponent },
  { path: 'chat', component: RadioChat },
  { path: '**', redirectTo: '' },
];
