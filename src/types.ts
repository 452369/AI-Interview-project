export type InterviewTrack = '技术面试' | '行为面试' | '系统设计' | '产品管理';
export type Difficulty = '初级' | '中级' | '高级' | '专家/架构师';

export interface InterviewConfig {
  role: string;
  track: InterviewTrack;
  difficulty: Difficulty;
  resumeText?: string;
  companyName?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface EvaluationResult {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}
