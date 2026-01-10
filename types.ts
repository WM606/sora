
export enum GradeLevel {
  PRIMARY_1 = 'أول ابتدائي',
  PRIMARY_2 = 'ثاني ابتدائي',
  PRIMARY_3 = 'ثالث ابتدائي',
  PRIMARY_4 = 'رابع ابتدائي',
  PRIMARY_5 = 'خامس ابتدائي',
  PRIMARY_6 = 'سادس ابتدائي',
  MIDDLE_1 = 'سابع / أول إعدادي',
  MIDDLE_2 = 'ثامن / ثاني إعدادي',
  MIDDLE_3 = 'تاسع / ثالث إعدادي',
  SECONDARY_1 = 'أول ثانوي',
  SECONDARY_2_SCI = 'ثاني ثانوي - علمي',
  SECONDARY_2_LIT = 'ثاني ثانوي - أدبي',
  SECONDARY_3_SCI = 'ثالث ثانوي - علمي',
  // Fix: changed from 'ثاني ثانوي - أدبي' to 'ثالث ثانوي - أدبي' to fix typo and enum collision
  SECONDARY_3_LIT = 'ثالث ثانوي - أدبي'
}

export type Subject = 
  | 'قرآن كريم' | 'تربية إسلامية' | 'علوم' | 'لغة عربية' | 'دراسات اجتماعية' | 'رياضيات'
  | 'جغرافيا' | 'تاريخ' | 'تربية وطنية' | 'لغة إنجليزية'
  | 'إيمان' | 'فقه وحديث' | 'سيرة' | 'نحو وصرف' | 'نصوص وبلاغة' | 'قراءة'
  | 'أحياء' | 'فيزياء' | 'كيمياء' | 'فلسفة ومنطق' | 'علم اجتماع';

export type SessionMode = 'learn' | 'test' | 'ministerial';

export interface PlanOffer {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  maxMessages: number;
  maxImages: number;
  maxWords: number;
  features: string[];
  color: string;
  isPopular?: boolean;
  description?: string;
  badge?: string; // ميزة جديدة: وسم مثل "عرض محدود"
}

export interface UserSubscription {
  planId: string;
  planName: string;
  startDate: number;
  expiryDate: number;
  messagesUsed: number;
  maxMessages: number;
  imagesUsed: number;
  maxImages: number;
  wordsUsed: number;
  maxWords: number;
}

export interface ActivationCard {
  code: string;
  isUsed: boolean;
  createdAt: number;
  planId: string;
  details: {
    name: string;
    durationDays: number;
    maxMessages: number;
    maxImages: number;
  }
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: Date;
  sources?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  subject: Subject;
  grade: GradeLevel;
  mode: SessionMode;
  lastUpdate: number;
  messageCount: number;
  imageCount: number;
}

export interface AppSettings {
  announcement: string;
  isMaintenance: boolean;
  supportNumber: string;
  showAds: boolean;
}
