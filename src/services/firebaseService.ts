import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Job, Application, Machine, Skill, Factory } from '../types';

const JOBS_COLLECTION = 'jobs';
const APPLICATIONS_COLLECTION = 'applications';
const MACHINES_COLLECTION = 'machines';
const SKILLS_COLLECTION = 'skills';
const FACTORIES_COLLECTION = 'factories';

const cleanData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
};

export const jobService = {
  async getJobs() {
    try {
      const q = query(collection(db, JOBS_COLLECTION), orderBy('deadline', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, JOBS_COLLECTION);
      return [];
    }
  },

  async addJob(job: Omit<Job, 'id'>) {
    try {
      return await addDoc(collection(db, JOBS_COLLECTION), cleanData(job));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, JOBS_COLLECTION);
    }
  },

  async updateJob(id: string, job: Partial<Job>) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, id);
      await updateDoc(docRef, cleanData(job));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${JOBS_COLLECTION}/${id}`);
    }
  },

  async deleteJob(id: string) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${JOBS_COLLECTION}/${id}`);
    }
  }
};

export const machineService = {
  async getMachines() {
    try {
      const q = query(collection(db, MACHINES_COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, MACHINES_COLLECTION);
      return [];
    }
  },
  async addMachine(machine: Omit<Machine, 'id'>) {
    try {
      return await addDoc(collection(db, MACHINES_COLLECTION), cleanData(machine));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, MACHINES_COLLECTION);
    }
  },
  async updateMachine(id: string, machine: Partial<Machine>) {
    try {
      const docRef = doc(db, MACHINES_COLLECTION, id);
      await updateDoc(docRef, cleanData(machine));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${MACHINES_COLLECTION}/${id}`);
    }
  },
  async deleteMachine(id: string) {
    try {
      const docRef = doc(db, MACHINES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${MACHINES_COLLECTION}/${id}`);
    }
  }
};

export const skillService = {
  async getSkills() {
    try {
      const q = query(collection(db, SKILLS_COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, SKILLS_COLLECTION);
      return [];
    }
  },
  async addSkill(skill: Omit<Skill, 'id'>) {
    try {
      return await addDoc(collection(db, SKILLS_COLLECTION), cleanData(skill));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, SKILLS_COLLECTION);
    }
  },
  async updateSkill(id: string, skill: Partial<Skill>) {
    try {
      const docRef = doc(db, SKILLS_COLLECTION, id);
      await updateDoc(docRef, cleanData(skill));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${SKILLS_COLLECTION}/${id}`);
    }
  },
  async deleteSkill(id: string) {
    try {
      const docRef = doc(db, SKILLS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${SKILLS_COLLECTION}/${id}`);
    }
  }
};

export const factoryService = {
  async getFactories() {
    try {
      const q = query(collection(db, FACTORIES_COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Factory));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, FACTORIES_COLLECTION);
      return [];
    }
  },
  async addFactory(factory: Omit<Factory, 'id'>) {
    try {
      return await addDoc(collection(db, FACTORIES_COLLECTION), cleanData(factory));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, FACTORIES_COLLECTION);
    }
  },
  async updateFactory(id: string, factory: Partial<Factory>) {
    try {
      const docRef = doc(db, FACTORIES_COLLECTION, id);
      await updateDoc(docRef, cleanData(factory));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${FACTORIES_COLLECTION}/${id}`);
    }
  },
  async deleteFactory(id: string) {
    try {
      const docRef = doc(db, FACTORIES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${FACTORIES_COLLECTION}/${id}`);
    }
  }
};

export const applicationService = {
  async getApplications() {
    try {
      const q = query(collection(db, APPLICATIONS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, APPLICATIONS_COLLECTION);
      return [];
    }
  },

  async addApplication(application: Omit<Application, 'id' | 'createdAt'>) {
    try {
      // Check for duplicate mobile or rejected status
      const q = query(collection(db, APPLICATIONS_COLLECTION), where('mobile', '==', application.mobile));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const existingApp = snapshot.docs[0].data() as Application;
        if (existingApp.status === 'Rejected') {
          throw new Error('REJECTED_USER');
        }
        throw new Error('Duplicate mobile number');
      }

      const newApp = cleanData({
        ...application,
        createdAt: new Date().toISOString(),
      });

      return await addDoc(collection(db, APPLICATIONS_COLLECTION), newApp);
    } catch (error: any) {
      if (error.message === 'REJECTED_USER' || error.message === 'Duplicate mobile number') {
        throw error;
      }
      handleFirestoreError(error, OperationType.WRITE, APPLICATIONS_COLLECTION);
    }
  },

  async getApplicationById(applicationId: string) {
    try {
      const q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('applicationId', '==', applicationId.toUpperCase())
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Application;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, APPLICATIONS_COLLECTION);
      return null;
    }
  },

  async updateApplicationStatus(id: string, status: Application['status'], extra?: Partial<Application>) {
    try {
      const docRef = doc(db, APPLICATIONS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const currentData = docSnap.data() as Application;
      
      const historyEntry = {
        status,
        date: new Date().toISOString(),
        note: extra?.rejectReason || extra?.interviewDate || ''
      };

      const statusHistory = [...(currentData.statusHistory || []), historyEntry];

      await updateDoc(docRef, cleanData({ 
        status, 
        statusHistory,
        ...extra 
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${APPLICATIONS_COLLECTION}/${id}`);
    }
  }
};
