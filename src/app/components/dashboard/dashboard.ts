import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { combineLatest, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private sub!: Subscription;

  loading = true;
  metrics: any = null;
  recentAwards: any[] = [];

  analytics = {
    totalStudents: 0,
    totalAwards: 0,
    totalDisbursed: 0,
    avgAward: 0,
    genderBreakdown: {} as Record<string, number>,
    raceBreakdown: {} as Record<string, number>,
    programBreakdown: {} as Record<string, number>
  };

  ngOnInit(): void {
    this.sub = combineLatest([
      this.dataService.getAwards().pipe(startWith([])),
      this.dataService.getStudents().pipe(startWith([])),
      this.dataService.getFunds().pipe(startWith([]))
    ]).subscribe({
      next: ([awards, students, funds]: any[]) => {
        const fundDetails = funds.map((f: any) => {
          const used = awards
            .filter((a: any) => a.fundCategoryId === f.id)
            .reduce((sum: number, a: any) => sum + Number(a.amountAwarded || 0), 0);

          const total = Number(f.totalBudgetAllocated || 0);

          return {
            ...f,
            used,
            remaining: total - used,
            percentage: Math.min(total > 0 ? (used / total) * 100 : 0, 100)
          };
        });

        const Klarman = { total: 0, used: 0, remaining: 0 };
        const MGB = { total: 0, used: 0, remaining: 0 };

        fundDetails.forEach((f: any) => {
          const target = f.parentFund === 'Klarman' ? Klarman : MGB;
          target.total += Number(f.totalBudgetAllocated || 0);
          target.used += Number(f.used || 0);
        });

        Klarman.remaining = Klarman.total - Klarman.used;
        MGB.remaining = MGB.total - MGB.used;

        this.metrics = { Klarman, MGB, fundDetails };

        const totalDisbursed = awards.reduce(
          (sum: number, a: any) => sum + Number(a.amountAwarded || 0),
          0
        );

        const genderBreakdown: Record<string, number> = {};
        const raceBreakdown: Record<string, number> = {};
        const programBreakdown: Record<string, number> = {};

        students.forEach((s: any) => {
          if (s.gender) genderBreakdown[s.gender] = (genderBreakdown[s.gender] || 0) + 1;
          if (s.race) raceBreakdown[s.race] = (raceBreakdown[s.race] || 0) + 1;
          if (s.programType) programBreakdown[s.programType] = (programBreakdown[s.programType] || 0) + 1;
        });

        this.analytics = {
          totalStudents: students.length,
          totalAwards: awards.length,
          totalDisbursed,
          avgAward: awards.length ? totalDisbursed / awards.length : 0,
          genderBreakdown,
          raceBreakdown,
          programBreakdown
        };

        this.recentAwards = [...awards]
          .sort((a: any, b: any) =>
            new Date(b.dateAwarded || 0).getTime() - new Date(a.dateAwarded || 0).getTime()
          )
          .slice(0, 5)
          .map((award: any) => {
            const student = students.find((s: any) => s.id === award.studentId);
            const fund = fundDetails.find((f: any) => f.id === award.fundCategoryId);

            return {
              ...award,
              student,
              fundName: fund?.name || 'Unknown'
            };
          });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard Firestore error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
