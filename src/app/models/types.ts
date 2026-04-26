export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  bsuEmail: string;
  personalEmail: string;
  bsuId: string;
  gender: string;
  race: string;
  programType: 'MSW' | 'BSW';
  enrollmentYear: string;
}

export interface FundCategory {
  id: string;
  parentFund: 'Klarman' | 'MGB';
  name: string;
  defaultAmount?: number;
  totalBudgetAllocated: number; // Placeholder for total starting budget
}

export interface Award {
  id?: string;
  studentId: string;
  fundCategoryId: string;
  amountAwarded: number;
  dateAwarded: string;
}

export const INITIAL_FUNDS: FundCategory[] = [
  { id: 'k1', parentFund: 'Klarman', name: 'Student Scholarship', totalBudgetAllocated: 100000 },
  { id: 'k2', parentFund: 'Klarman', name: 'Emergency Funds', totalBudgetAllocated: 50000 },
  { id: 'm1', parentFund: 'MGB', name: '3 year award part time students', defaultAmount: 7500, totalBudgetAllocated: 75000 },
  { id: 'm2', parentFund: 'MGB', name: '1 year award BSW seniors', defaultAmount: 15000, totalBudgetAllocated: 75000 },
  { id: 'm3', parentFund: 'MGB', name: '2 year award MSW advanced standing', defaultAmount: 5625, totalBudgetAllocated: 56250 },
  { id: 'm4', parentFund: 'MGB', name: 'Continuing evening students BSW', defaultAmount: 3000, totalBudgetAllocated: 30000 }
];
