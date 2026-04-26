import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { combineLatest, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css'
})
export class StudentList implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private sub!: Subscription;

  awardsWithStudents: any[] = [];
  filteredAwards: any[] = [];
  searchTerm = '';
  isLoading = true;

  ngOnInit(): void {
    this.sub = combineLatest([
      this.dataService.getAwards().pipe(startWith([])),
      this.dataService.getStudents().pipe(startWith([])),
      this.dataService.getFunds().pipe(startWith([]))
    ]).subscribe({
      next: ([awards, students, funds]: any[]) => {
        this.awardsWithStudents = awards.map((award: any) => {
          const student = students.find((s: any) => s.id === award.studentId);
          const fund = funds.find((f: any) => f.id === award.fundCategoryId);

          return {
            ...award,
            student,
            fundName: fund?.name || 'Unknown'
          };
        });

        this.filterData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data from Firestore:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  filterData(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredAwards = [...this.awardsWithStudents];
      return;
    }

    this.filteredAwards = this.awardsWithStudents.filter((item: any) =>
      item.student?.firstName?.toLowerCase().includes(term) ||
      item.student?.lastName?.toLowerCase().includes(term) ||
      item.student?.bsuId?.toLowerCase().includes(term) ||
      item.student?.bsuEmail?.toLowerCase().includes(term) ||
      item.fundName?.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterData();
  }

  onEdit(awardId: string): void {
    this.router.navigate(['/awards/edit', awardId]);
  }

  async onDelete(awardId: string, studentBsuId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this award record?');
    if (!confirmed) return;

    try {
      await this.dataService.deleteAward(awardId, studentBsuId);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete. Check console for details.');
    }
  }
}
