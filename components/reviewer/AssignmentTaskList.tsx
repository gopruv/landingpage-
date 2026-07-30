'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  type WorkflowTask,
  type TaskStatus,
  STATUS_META,
  MOVABLE_STATUSES,
  isSystemTask,
  tasksForAssignment,
  openTaskCount,
} from '@/lib/workflowTasks';

const BORDER = '1px solid rgba(15,13,12,0.1)';

function TaskRow({
  task,
  onOpen,
  onMove,
}: {
  task: WorkflowTask;
  onOpen: () => void;
  onMove?: (status: TaskStatus) => void;
}) {
  const system = isSystemTask(task);
  const meta = STATUS_META[task.status] ?? STATUS_META.todo;

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        background: '#fff',
        border: BORDER,
        opacity: task.unlocked ? 1 : 0.45,
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={!task.unlocked}
        style={{
          flex: 1,
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: task.unlocked ? 'pointer' : 'not-allowed',
          minWidth: 0,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: task.unlocked ? 'rgba(15,13,12,0.85)' : 'rgba(15,13,12,0.4)' }}>
          {task.title.replace(/^\[[^\]]+\]\s*/, '')}
        </p>
        {task.notes && (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(15,13,12,0.45)', lineHeight: 1.4 }}>{task.notes}</p>
        )}
        {!task.unlocked && (
          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(15,13,12,0.35)' }}>Complete previous step first</p>
        )}
      </button>
      {task.unlocked && (
        system ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 3,
            background: meta.bg,
            color: meta.color,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {meta.label}
        </span>
        ) : (
        <select
          value={task.status}
          onChange={(e) => onMove?.(e.target.value as TaskStatus)}
          style={{ fontSize: 11, padding: '4px 6px', flexShrink: 0, maxWidth: 120 }}
        >
          {MOVABLE_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        )
      )}
      {system && task.unlocked && (
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(15,13,12,0.3)', flexShrink: 0, alignSelf: 'center' }}>
          AUTO
        </span>
      )}
    </li>
  );
}

export default function AssignmentTaskList({
  assignmentId,
  studentCode,
  workflowStage = 'assigned',
  tasks,
  onOpenApplication,
  onRefresh,
}: {
  assignmentId: string;
  studentCode?: string;
  workflowStage?: string;
  tasks: WorkflowTask[];
  onOpenApplication: () => void;
  onRefresh: () => void;
}) {
  const assignmentTasks = tasksForAssignment(tasks, assignmentId, workflowStage);
  const openCount = openTaskCount(assignmentTasks);
  const [expanded, setExpanded] = useState(openCount > 0);
  const [adding, setAdding] = useState(false);
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [loading, setLoading] = useState(false);

  const systemTasks = assignmentTasks.filter(isSystemTask);
  const customTasks = assignmentTasks.filter((t) => !isSystemTask(t));

  const addTask = async () => {
    if (!heading.trim()) return;
    setLoading(true);
    try {
      await api.reviewer.workflowAction({
        action: 'create_custom_task',
        assignment_id: assignmentId,
        title: heading.trim(),
        description: description.trim() || undefined,
        category: studentCode ? `student:${assignmentId}` : 'personal',
        status,
      });
      setHeading('');
      setDescription('');
      setAdding(false);
      setExpanded(true);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    if (taskId.startsWith('synthetic-')) return;
    api.reviewer.workflowAction({ action: 'update_task', task_id: taskId, status: newStatus })
      .then(onRefresh);
  };

  if (assignmentTasks.length === 0) return null;

  return (
    <div style={{ width: '100%', marginTop: 16, borderTop: BORDER, paddingTop: 14 }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '4px 0',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(15,13,12,0.55)',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 10, transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        Tasks
        {openCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', background: 'rgba(235,69,17,0.12)', color: '#eb4511', borderRadius: 10 }}>
            {openCount} open
          </span>
        )}
        <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.35)' }}>
          ({assignmentTasks.length} total)
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {systemTasks.length > 0 && (
            <div style={{ marginBottom: customTasks.length > 0 ? 14 : 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.35)', margin: '0 0 8px' }}>
                Workflow (automatic)
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {systemTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={onOpenApplication} />
                ))}
              </ul>
            </div>
          )}

          {customTasks.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.35)', margin: '0 0 8px' }}>
                Your tasks
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customTasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onOpen={onOpenApplication}
                    onMove={(s) => moveTask(t.id, s)}
                  />
                ))}
              </ul>
            </div>
          )}

          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              style={{ fontSize: 12, color: '#eb4511', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontWeight: 600 }}
            >
              + Add custom task
            </button>
          ) : (
            <div style={{ padding: 12, background: 'rgba(15,13,12,0.02)', border: BORDER, marginTop: 6 }}>
              <input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Task heading"
                style={{ width: '100%', padding: 8, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                style={{ width: '100%', padding: 8, fontSize: 13, minHeight: 52, marginBottom: 8, boxSizing: 'border-box' }}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                style={{ width: '100%', padding: 8, fontSize: 12, marginBottom: 8 }}
              >
                {MOVABLE_STATUSES.filter((s) => s !== 'cancelled').map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={loading || !heading.trim()}
                  onClick={addTask}
                  style={{ padding: '6px 14px', fontSize: 12, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {loading ? '…' : 'Add'}
                </button>
                <button type="button" onClick={() => setAdding(false)} style={{ padding: '6px 14px', fontSize: 12, border: BORDER, background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
