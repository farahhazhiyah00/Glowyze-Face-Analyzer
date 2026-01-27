export enum SkinType {
  Oily = 'Oily',
  Dry = 'Dry',
  Combination = 'Combination',
  Normal = 'Normal',
  Sensitive = 'Sensitive'
}

export enum StressLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface UserProfile {
  email?: string; // Added for Auth
  name: string;
  age: string;
  gender: string;
  skinType: SkinType;
  allergies: string[];
  sleepHours: number;
  waterIntake: number; // Liters
  stressLevel: StressLevel;
  diet: 'Balanced' | 'High Carb' | 'High Protein' | 'Vegetarian';
  isOnboarded: boolean;
  profilePhoto?: string;
  language: 'en' | 'id';
  theme: 'light' | 'dark';
  customChecklist?: string[];
}

export interface ScanResult {
  id: string;
  date: string;
  overallScore: number;
  metrics: {
    acne: number; // 0-100 severity
    wrinkles: number;
    pigmentation: number;
    texture: number;
  };
  imageUri?: string;
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  lastModified: number; // Timestamp
  messages: ChatMessage[];
}

export interface ProductRecommendation {
  id: string;
  name: string;
  type: string;
  keyIngredients: string[];
  imageUrl: string;
  reason: string;
}