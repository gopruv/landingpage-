export type UserRole = 'student' | 'reviewer' | 'admin';

export type ApplicationStatus =
  | 'submitted'
  | 'payment_confirmed'
  | 'reviewer_assigned'
  | 'scheduled'
  | 'completed';

export type StudentDashboardState = 'new' | 'has_idea' | 'applied' | 'scheduled' | 'completed';

export interface User {
  id: string;
  email: string;
  account_type: UserRole;
  full_name: string;
  college?: string;
  graduation_year?: number;
  linkedin_url?: string;
  created_at: string;
}

export interface ProjectIdea {
  id: string;
  user_id: string;
  project_name: string;
  description: string;
  tech_stack: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  why_reviewable: string;
  key_architectural_decision: string;
  what_could_go_wrong: string;
  is_active: boolean;
  generated_at: string;
  source: 'public' | 'dashboard';
}

export interface Application {
  id: string;
  user_id: string;
  project_idea_id?: string;
  project_name: string;
  tech_stack: string;
  github_url: string;
  loom_url: string;
  build_decision_1: string;
  build_decision_2: string;
  build_decision_3: string;
  what_broke: string;
  ai_tools_used: string;
  availability: Record<string, string[]>;
  status: ApplicationStatus;
  payment_id?: string;
  payment_amount: number;
  payment_at?: string;
  submitted_at: string;
  recording_consent: boolean;
}

export interface Score {
  id: string;
  application_id: string;
  reviewer_id: string;
  technical_depth: number;
  communication: number;
  reproducibility: number;
  problem_solving: number;
  total_score: number;
  passed: boolean;
  feedback_td: string;
  feedback_comm: string;
  feedback_repro: string;
  feedback_ps: string;
  internal_notes?: string;
  submitted_at: string;
  is_borderline: boolean;
}

export interface Credential {
  id: string;
  application_id: string;
  user_id: string;
  credential_id: string;
  credential_url: string;
  issued_at: string;
  linkedin_added: boolean;
  hash: string;
  public_opt_in: boolean;
}
