export type Language = 'bn' | 'en';

export interface Translation {
  title: string;
  step: string;
  next: string;
  prev: string;
  submit: string;
  basicInfo: string;
  contactInfo: string;
  positionSelect: string;
  skillsSection: string;
  employmentStatus: string;
  groupExperience: string;
  name: string;
  dob: string;
  day: string;
  month: string;
  year: string;
  ageError: string;
  mobile: string;
  mobileError: string;
  position: string;
  experience: string;
  currentlyEmployed: string;
  companyName: string;
  workedInGroup: string;
  factoryName: string;
  resignDate: string;
  resignReason: string;
  success: string;
  applicationId: string;
  yes: string;
  no: string;
  select: string;
  machines: string;
  skills: string;
  track: string;
  trackTitle: string;
  trackPlaceholder: string;
  trackButton: string;
  trackNotFound: string;
  statusLabel: string;
  interviewDateLabel: string;
  copyId: string;
  copied: string;
  assessmentTitle: string;
  assessmentScore: string;
  assessmentComplete: string;
  assessmentLoading: string;
  question: string;
  score: string;
}

export const translations: Record<Language, Translation> = {
  bn: {
    title: 'অনলাইন আবেদন ফর্ম',
    step: 'ধাপ',
    next: 'পরবর্তী',
    prev: 'পূর্ববর্তী',
    submit: 'জমা দিন',
    basicInfo: 'প্রাথমিক তথ্য',
    contactInfo: 'যোগাযোগের তথ্য',
    positionSelect: 'পদ নির্বাচন',
    skillsSection: 'স্কিল / দক্ষতা',
    employmentStatus: 'কর্মসংস্থান অবস্থা',
    groupExperience: 'আপনি কি ফ্যাসিবিগ জিন্স গ্রুপে কাজ করেছেন?',
    name: 'নাম',
    dob: 'জন্ম তারিখ',
    day: 'দিন',
    month: 'মাস',
    year: 'বছর',
    ageError: 'আপনার বয়স ১৮ বছরের কম, আপনি আবেদন করতে পারবেন না',
    mobile: 'মোবাইল নাম্বার',
    mobileError: 'মোবাইল নাম্বার অবশ্যই ১১ ডিজিট হতে হবে',
    position: 'পদ',
    experience: 'অভিজ্ঞতা (বছর)',
    currentlyEmployed: 'বর্তমানে কর্মরত?',
    companyName: 'কোম্পানির নাম',
    workedInGroup: 'আপনি কি ফ্যাসিবিগ জিন্স গ্রুপে কাজ করেছেন?',
    factoryName: 'ফ্যাক্টরির নাম',
    resignDate: 'পদত্যাগের তারিখ',
    resignReason: 'পদত্যাগের কারণ',
    success: 'আবেদন সফলভাবে জমা হয়েছে!',
    applicationId: 'আবেদন আইডি',
    yes: 'হ্যাঁ',
    no: 'না',
    select: 'নির্বাচন করুন',
    machines: 'মেশিন নির্বাচন',
    skills: 'দক্ষতা / প্রসেস নির্বাচন',
    track: 'ট্র্যাকিং',
    trackTitle: 'আবেদন ট্র্যাক করুন',
    trackPlaceholder: 'আপনার আবেদন আইডি লিখুন',
    trackButton: 'সার্চ করুন',
    trackNotFound: 'এই আইডি দিয়ে কোনো আবেদন পাওয়া যায়নি',
    statusLabel: 'বর্তমান অবস্থা',
    interviewDateLabel: 'ইন্টারভিউর তারিখ',
    copyId: 'আইডি কপি করুন',
    copied: 'কপি হয়েছে!',
    assessmentTitle: 'যোগ্যতা যাচাই পরীক্ষা',
    assessmentScore: 'আপনার স্কোর',
    assessmentComplete: 'পরীক্ষা সম্পন্ন হয়েছে',
    assessmentLoading: 'প্রশ্ন তৈরি হচ্ছে...',
    question: 'প্রশ্ন',
    score: 'স্কোর',
  },
  en: {
    title: 'Online Application Form',
    step: 'Step',
    next: 'Next',
    prev: 'Previous',
    submit: 'Submit',
    basicInfo: 'Basic Information',
    contactInfo: 'Contact Information',
    positionSelect: 'Position Selection',
    skillsSection: 'Skills Section',
    employmentStatus: 'Employment Status',
    groupExperience: 'Have you worked in Pacific Jeans Group?',
    name: 'Name',
    dob: 'Date of Birth',
    day: 'Day',
    month: 'Month',
    year: 'Year',
    ageError: 'Your age is less than 18, you cannot apply',
    mobile: 'Mobile Number',
    mobileError: 'Mobile number must be 11 digits',
    position: 'Position',
    experience: 'Experience (Years)',
    currentlyEmployed: 'Currently Employed?',
    companyName: 'Company Name',
    workedInGroup: 'Have you worked in Pacific Jeans Group?',
    factoryName: 'Factory Name',
    resignDate: 'Resign Date',
    resignReason: 'Resign Reason',
    success: 'Application submitted successfully!',
    applicationId: 'Application ID',
    yes: 'Yes',
    no: 'No',
    select: 'Select',
    machines: 'Machine Selection',
    skills: 'Skill / Process Selection',
    track: 'Tracking',
    trackTitle: 'Track Application',
    trackPlaceholder: 'Enter your Application ID',
    trackButton: 'Search',
    trackNotFound: 'No application found with this ID',
    statusLabel: 'Current Status',
    interviewDateLabel: 'Interview Date',
    copyId: 'Copy ID',
    copied: 'Copied!',
    assessmentTitle: 'Assessment Test',
    assessmentScore: 'Your Score',
    assessmentComplete: 'Assessment Complete',
    assessmentLoading: 'Generating Questions...',
    question: 'Question',
    score: 'Score',
  }
};

export interface Machine {
  id: string;
  name: string;
  category: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  machineId?: string; // Optional mapping to a machine
}

export interface Factory {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;
  category: 'Worker' | 'Staff' | 'Management' | 'Supervisor';
  vacancy: number;
  deadline: string;
}

export interface Application {
  id: string;
  applicationId: string;
  name: string;
  dob: string;
  mobile: string;
  positionId: string;
  positionName: string;
  experience?: string;
  machines?: string[];
  skills?: string[];
  currentlyEmployed: boolean;
  companyName?: string;
  workedInGroup: boolean;
  factoryName?: string;
  resignDate?: string;
  resignReason?: string;
  assessmentScore?: number;
  assessmentQuestions?: { question: string; options: string[]; correctAnswer: string }[];
  assessmentAnswers?: string[];
  status: 'Applied' | 'Shortlisted' | 'Interview Called' | 'Attended' | 'Selected' | 'Rejected';
  statusHistory?: { status: string; date: string; note?: string }[];
  rejectReason?: string;
  interviewDate?: string;
  interviewLocation?: string;
  attendance?: 'Present' | 'Absent';
  createdAt: string;
}

