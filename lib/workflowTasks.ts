import { loadReviewProgress } from '@/lib/reviewFlow';

export type TaskStatus = 'new' | 'todo' | 'in_progress' | 'done' | 'cancelled' | 'under_review';

export interface WorkflowTask {
  id: string;
  task_key: string;
  title: string;
  status: TaskStatus;
  unlocked: boolean;
  is_custom: boolean;
  assignment_id: string;
  application_id: string;
  sort_order?: number;
  notes?: string | null;
}

const SYSTEM_KEYS = new Set([
  'review_submission',
  'accept_candidate',
  'propose_session',
  'conduct_session',
  'submit_score',
]);

const TASK_ORDER = [
  'review_submission',
  'accept_candidate',
  'propose_session',
  'conduct_session',
  'submit_score',
] as const;

export const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'rgba(15,13,12,0.55)', bg: 'rgba(15,13,12,0.06)' },
  todo: { label: 'To do', color: '#9a3b00', bg: 'rgba(235,69,17,0.1)' },
  in_progress: { label: 'In progress', color: '#005fa3', bg: 'rgba(0,95,163,0.1)' },
  under_review: { label: 'Under review', color: '#9a6500', bg: 'rgba(184,121,0,0.12)' },
  done: { label: 'Done', color: '#007a4a', bg: 'rgba(0,122,74,0.1)' },
  cancelled: { label: 'Cancelled', color: 'rgba(15,13,12,0.45)', bg: 'rgba(15,13,12,0.06)' },
};

export const MOVABLE_STATUSES: TaskStatus[] = [
  'new', 'todo', 'in_progress', 'under_review', 'done', 'cancelled',
];

export function isSystemTask(t: WorkflowTask): boolean {
  return !t.is_custom && (SYSTEM_KEYS.has(t.task_key) || t.id.startsWith('synthetic-'));
}

function localFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(key) === '1';
}

function stageAtLeast(stage: string, min: string): boolean {
  const order = [
    'assigned',
    'accepted',
    'session_proposed',
    'session_approved',
    'session_done',
    'score_submitted',
    'score_approved',
    'completed',
  ];
  const si = order.indexOf(stage);
  const mi = order.indexOf(min);
  if (si === -1 || mi === -1) return false;
  return si >= mi;
}

function deriveSystemTask(task: WorkflowTask, workflowStage: string): WorkflowTask {
  if (task.status === 'done' || task.status === 'cancelled') {
    return { ...task, unlocked: true, status: task.status };
  }

  const assignmentId = task.assignment_id;
  const progress = loadReviewProgress(assignmentId);
  const c = progress.completed;
  const reviewed =
    c.mark_reviewed
    || localFlag(`reviewer-reviewed-${assignmentId}`)
    || task.task_key === 'review_submission' && task.status === 'done';
  const accepted =
    localFlag(`reviewer-accepted-${assignmentId}`)
    || stageAtLeast(workflowStage, 'accepted');
  const sessionProposed = stageAtLeast(workflowStage, 'session_proposed');
  const sessionApproved =
    stageAtLeast(workflowStage, 'session_approved')
    || workflowStage === 'scheduled';
  const sessionDone = stageAtLeast(workflowStage, 'session_done');

  const orderIdx = TASK_ORDER.indexOf(task.task_key as typeof TASK_ORDER[number]);

  let unlocked = false;
  let status: TaskStatus = 'new';

  switch (task.task_key) {
    case 'review_submission':
      unlocked = true;
      if (reviewed) status = 'done';
      else if (c.read_answers || c.github || c.loom || c.select_time) status = 'in_progress';
      else status = 'todo';
      break;
    case 'accept_candidate':
      unlocked = reviewed;
      if (accepted) status = 'done';
      else if (unlocked) status = 'todo';
      else status = 'new';
      break;
    case 'propose_session':
      unlocked = accepted;
      if (sessionProposed) status = 'done';
      else if (unlocked) status = 'todo';
      else status = 'new';
      break;
    case 'conduct_session':
      unlocked = sessionApproved;
      if (sessionDone) status = 'done';
      else if (unlocked) status = 'todo';
      else status = 'new';
      break;
    case 'submit_score':
      unlocked = sessionDone;
      if (task.status === 'done') status = 'done';
      else if (unlocked) status = 'todo';
      else status = 'new';
      break;
    default:
      unlocked = orderIdx <= 0;
      status = task.status as TaskStatus;
  }

  return { ...task, unlocked, status };
}

export function enrichTasks(tasks: WorkflowTask[], workflowStage = 'assigned'): WorkflowTask[] {
  return tasks.map((t) => {
    if (!isSystemTask(t)) return t;
    return deriveSystemTask(t, workflowStage);
  });
}

export function tasksForAssignment(
  tasks: WorkflowTask[],
  assignmentId: string,
  workflowStage = 'assigned',
): WorkflowTask[] {
  return enrichTasks(
    tasks.filter((t) => t.assignment_id === assignmentId),
    workflowStage,
  ).sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
}

export function openTaskCount(tasks: WorkflowTask[]): number {
  return tasks.filter((t) => t.unlocked && t.status !== 'done' && t.status !== 'cancelled').length;
}
