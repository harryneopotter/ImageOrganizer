
export interface AnalysisResult {
  id: string;
  fileName: string;
  url: string;
  fileType: string;
  category: string;
  description: string;
  tags: string[];
  confidence: number;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface Stats {
  total: number;
  processed: number;
  errors: number;
  categoryDistribution: Record<string, number>;
}

export enum ProcessingMode {
  AUTO = 'auto',
  SPECIFIC = 'specific'
}
