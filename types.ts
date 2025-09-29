import type { ReactNode } from 'react';

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
}

<<<<<<< HEAD
=======
export interface WebSource {
  title: string;
  url: string;
}

>>>>>>> 85593d0 (Initial commit - AI Studio export)
export interface Message {
  id: string;
  role: Role;
  content: ReactNode;
  isLoading?: boolean;
<<<<<<< HEAD
  source?: string | null;
=======
  pdfSource?: string | null;
  webSources?: WebSource[];
  pageConstraint?: string | null;
>>>>>>> 85593d0 (Initial commit - AI Studio export)
}

export interface Feature {
    icon: ReactNode;
    title: string;
    description: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface ProgressData {
  flashcardsTried: number;
  flashcardDecksCreated: number;
  flashcardRatings: {
    easy: number;
    medium: number;
    hard: number;
  };
  podcastSessions: number;
  summariesAccessed: number;
}

// Type for PDF.js library
export interface PdfjsLib {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument(src: any): { promise: Promise<any> };
}

// Type for Document Context
export interface DocContextType {
  fileName: string | null;
  fullText: string | null;
<<<<<<< HEAD
  chunks: string[] | null;
=======
  chunks: { text: string; pageStart: number; pageEnd: number }[] | null;
>>>>>>> 85593d0 (Initial commit - AI Studio export)
  isProcessing: boolean;
  setDoc: (file: File) => Promise<void>;
  clearDoc: () => void;
}
