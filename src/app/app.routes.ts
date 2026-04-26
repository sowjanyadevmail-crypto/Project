import { Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { StudentList } from './components/student-list/student-list';
import { StudentForm } from './components/student-form/student-form';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'students', component: StudentList },
      { path: 'awards/new', component: StudentForm },
      { path: 'awards/edit/:id', component: StudentForm }
    ]
  }
];
