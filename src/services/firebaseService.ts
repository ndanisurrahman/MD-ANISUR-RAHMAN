import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Job, Application, Machine, Skill, Factory } from '../types';

const JOBS_COLLECTION = 'jobs';
const APPLICATIONS_COLLECTION = 'applications';
const MACHINES_COLLECTION = 'machines';
const SKILLS_COLLECTION = 'skills';
const FACTORIES_COLLECTION = 'factories';

export const jobService = {
  async getJobs() {
    const q = query(collection(db, JOBS_COLLECTION), orderBy('deadline', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
  },

  async addJob(job: Omit<Job, 'id'>) {
    return await addDoc(collection(db, JOBS_COLLECTION), job);
  },

  async updateJob(id: string, job: Partial<Job>) {
    const docRef = doc(db, JOBS_COLLECTION, id);
    await updateDoc(docRef, job);
  },

  async deleteJob(id: string) {
    const docRef = doc(db, JOBS_COLLECTION, id);
    await deleteDoc(docRef);
  }
};

export const machineService = {
  async getMachines() {
    const q = query(collection(db, MACHINES_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
  },
  async addMachine(machine: Omit<Machine, 'id'>) {
    return await addDoc(collection(db, MACHINES_COLLECTION), machine);
  },
  async updateMachine(id: string, machine: Partial<Machine>) {
    const docRef = doc(db, MACHINES_COLLECTION, id);
    await updateDoc(docRef, machine);
  },
  async deleteMachine(id: string) {
    const docRef = doc(db, MACHINES_COLLECTION, id);
    await deleteDoc(docRef);
  }
};

export const skillService = {
  async getSkills() {
    const q = query(collection(db, SKILLS_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  },
  async addSkill(skill: Omit<Skill, 'id'>) {
    return await addDoc(collection(db, SKILLS_COLLECTION), skill);
  },
  async updateSkill(id: string, skill: Partial<Skill>) {
    const docRef = doc(db, SKILLS_COLLECTION, id);
    await updateDoc(docRef, skill);
  },
  async deleteSkill(id: string) {
    const docRef = doc(db, SKILLS_COLLECTION, id);
    await deleteDoc(docRef);
  }
};

export const factoryService = {
  async getFactories() {
    const q = query(collection(db, FACTORIES_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Factory));
  },
  async addFactory(factory: Omit<Factory, 'id'>) {
    return await addDoc(collection(db, FACTORIES_COLLECTION), factory);
  },
  async updateFactory(id: string, factory: Partial<Factory>) {
    const docRef = doc(db, FACTORIES_COLLECTION, id);
    await updateDoc(docRef, factory);
  },
  async deleteFactory(id: string) {
    const docRef = doc(db, FACTORIES_COLLECTION, id);
    await deleteDoc(docRef);
  }
};

export const applicationService = {
  async getApplications() {
    const q = query(collection(db, APPLICATIONS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
  },

  async addApplication(application: Omit<Application, 'id' | 'createdAt'>) {
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

    const newApp = {
      ...application,
      createdAt: new Date().toISOString(),
    };

    return await addDoc(collection(db, APPLICATIONS_COLLECTION), newApp);
  },

  async getApplicationById(applicationId: string) {
    const q = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('applicationId', '==', applicationId.toUpperCase())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Application;
  },

  async updateApplicationStatus(id: string, status: Application['status'], extra?: Partial<Application>) {
    const docRef = doc(db, APPLICATIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.data() as Application;
    
    const historyEntry = {
      status,
      date: new Date().toISOString(),
      note: extra?.rejectReason || extra?.interviewDate || ''
    };

    const statusHistory = [...(currentData.statusHistory || []), historyEntry];

    await updateDoc(docRef, { 
      status, 
      statusHistory,
      ...extra 
    });
  }
};
