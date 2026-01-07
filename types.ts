
export enum GradeLevel {
  PRIMARY_1 = 'أول ابتدائي',
  PRIMARY_2 = 'ثاني ابتدائي',
  PRIMARY_3 = 'ثالث ابتدائي',
  PRIMARY_4 = 'رابع ابتدائي',
  PRIMARY_5 = 'خامس ابتدائي',
  PRIMARY_6 = 'سادس ابتدائي',
  MIDDLE_1 = 'أول متوسط / إعدادي',
  MIDDLE_2 = 'ثاني متوسط / إعدادي',
  MIDDLE_3 = 'ثالث متوسط / إعدادي',
  SECONDARY_1 = 'أول ثانوي',
  SECONDARY_2_SCI = 'ثاني ثانوي - علمي',
  SECONDARY_2_LIT = 'ثاني ثانوي - أدبي',
  SECONDARY_3_SCI = 'ثالث ثانوي - علمي',
  SECONDARY_3_LIT = 'ثالث ثانوي - أدبي'
}

export type Subject = 'رياضيات' | 'علوم' | 'لغة عربية' | 'لغة إنجليزية' | 'دراسات اجتماعية' | 'فيزياء' | 'كيمياء' | 'أحياء' | 'تربية إسلامية' | 'قرآن كريم' | 'أخرى';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
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
  lastUpdate: number;
}
