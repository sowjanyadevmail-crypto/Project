import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { INITIAL_FUNDS, FundCategory, Award, Student } from '../../models/types';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-form.html',
  styleUrl: './student-form.css'
})
export class StudentForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);

  awardForm: FormGroup;
  funds: FundCategory[] = INITIAL_FUNDS;
  isEditMode = false;
  editingAwardId: string | null = null;
  editingStudentId: string | null = null;
  
  constructor() {
    this.awardForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      bsuEmail: ['', [Validators.required, Validators.email]],
      personalEmail: ['', Validators.email],
      bsuId: ['', Validators.required],
      gender: ['', Validators.required],
      race: ['', Validators.required],
      programType: ['', Validators.required],
      enrollmentYear: [new Date().getFullYear(), Validators.required],
      fundCategoryId: ['', Validators.required],
      amountAwarded: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editingAwardId = id;
        this.loadDataForEdit(id);
      }
    });
  }

  async loadDataForEdit(awardId: string) {
    const award = await this.dataService.getAwardById(awardId);
    if (award) {
      this.editingStudentId = award.studentId;
      const student = await this.dataService.getStudentByBsuId(award.studentId);
      if (student) {
        this.awardForm.patchValue({
          firstName: student.firstName,
          lastName: student.lastName,
          bsuEmail: student.bsuEmail,
          personalEmail: student.personalEmail,
          bsuId: student.bsuId,
          gender: student.gender,
          race: student.race,
          programType: student.programType,
          enrollmentYear: student.enrollmentYear,
          fundCategoryId: award.fundCategoryId,
          amountAwarded: award.amountAwarded
        });
      }
    }
  }

  onFundChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedFundId = selectElement.value;
    const fund = this.funds.find(f => f.id === selectedFundId);
    
    // Only patch default amount if we are creating a new one (not overriding during edit)
    if (fund && fund.defaultAmount && !this.isEditMode) {
      this.awardForm.patchValue({ amountAwarded: fund.defaultAmount });
    }
  }

  async onSubmit() {
    if (this.awardForm.valid) {
      const formValue = this.awardForm.value;
      const studentData: Partial<Student> = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        bsuEmail: formValue.bsuEmail,
        personalEmail: formValue.personalEmail,
        bsuId: formValue.bsuId,
        gender: formValue.gender,
        race: formValue.race,
        programType: formValue.programType,
        enrollmentYear: formValue.enrollmentYear
      };
      const awardData: Partial<Award> = {
        fundCategoryId: formValue.fundCategoryId,
        amountAwarded: formValue.amountAwarded
      };

      try {
        if (this.isEditMode && this.editingAwardId && this.editingStudentId) {
          await this.dataService.updateAward(this.editingAwardId, this.editingStudentId, studentData, awardData);
        } else {
          await this.dataService.addAward(studentData as Student, awardData as Award);
        }
        this.awardForm.reset();
        this.router.navigate(['/students']); // Redirect to directory after CRUD
      } catch(e) {
        alert("Error saving data. Ensure Firebase is configured correctly.");
      }
    } else {
      this.awardForm.markAllAsTouched();
    }
  }
}
