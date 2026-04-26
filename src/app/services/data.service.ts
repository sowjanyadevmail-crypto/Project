import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  Firestore
} from 'firebase/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Student, Award, FundCategory, INITIAL_FUNDS } from '../models/types';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {
  private db: Firestore;
  private funds$ = new BehaviorSubject<FundCategory[]>(INITIAL_FUNDS);

  constructor() {
    const app = getApps().length === 0
      ? initializeApp(environment.firebase)
      : getApps()[0];
    this.db = getFirestore(app);
  }

  getFunds(): Observable<FundCategory[]> {
    return this.funds$.asObservable();
  }

  getStudents(): Observable<Student[]> {
    return new Observable<Student[]>(observer => {
      const ref = collection(this.db, 'students');
      const unsubscribe = onSnapshot(ref,
        snapshot => observer.next(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student))),
        err => observer.error(err)
      );
      return () => unsubscribe();
    });
  }

  getAwards(): Observable<Award[]> {
    return new Observable<Award[]>(observer => {
      const ref = collection(this.db, 'awards');
      const unsubscribe = onSnapshot(ref,
        snapshot => observer.next(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Award))),
        err => observer.error(err)
      );
      return () => unsubscribe();
    });
  }

  async getAwardById(id: string): Promise<Award | null> {
    const snap = await getDoc(doc(this.db, `awards/${id}`));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Award : null;
  }

  async getStudentByBsuId(bsuId: string): Promise<Student | null> {
    const snap = await getDoc(doc(this.db, `students/${bsuId}`));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Student : null;
  }

  /**
   * Add a new award.
   * Uses BSU ID as the Firestore document ID for the student (unique key).
   * If a student with that BSU ID already exists, it updates their profile.
   */
  async addAward(student: Partial<Student>, award: Partial<Award>): Promise<void> {
    if (!student.bsuId) throw new Error('BSU ID is required');

    // Use BSU ID as the Firestore document ID — this enforces uniqueness
    const studentDocRef = doc(this.db, `students/${student.bsuId}`);
    await setDoc(studentDocRef, student, { merge: true });

    // Award links back to student via BSU ID
    await addDoc(collection(this.db, 'awards'), {
      ...award,
      studentId: student.bsuId,   // store BSU ID, not an auto-generated ID
      dateAwarded: new Date().toISOString()
    });
  }

  /**
   * Update an existing award and student record.
   * studentId here IS the BSU ID (document ID).
   */
  async updateAward(
    awardId: string,
    studentBsuId: string,
    student: Partial<Student>,
    award: Partial<Award>
  ): Promise<void> {
    await updateDoc(doc(this.db, `students/${studentBsuId}`), student);
    await updateDoc(doc(this.db, `awards/${awardId}`), award);
  }

  /**
   * Delete an award. Also deletes the student document if they have no other awards.
   */
  async deleteAward(awardId: string, studentBsuId: string): Promise<void> {
    // Delete the award first
    await deleteDoc(doc(this.db, `awards/${awardId}`));

    // Check if this student has any remaining awards
    const awardsRef = collection(this.db, 'awards');
    const remainingQuery = query(awardsRef, where('studentId', '==', studentBsuId));
    const remaining = await getDocs(remainingQuery);

    // If no awards left for this student, also delete their student record
    if (remaining.empty) {
      await deleteDoc(doc(this.db, `students/${studentBsuId}`));
    }
  }
}
