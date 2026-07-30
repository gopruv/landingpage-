'use client';

import { CHECKLIST_ITEMS, type ChecklistKey } from '@/lib/reviewFlow';

const BORDER = '1px solid rgba(15,13,12,0.12)';

export default function ReviewChecklistSticker({
  completed,
}: {
  completed: Partial<Record<ChecklistKey, boolean>>;
}) {
  return (
    <aside
      style={{
        position: 'sticky',
        top: 24,
        width: 220,
        flexShrink: 0,
        background: 'linear-gradient(145deg, #fff9e6 0%, #fff 40%)',
        border: BORDER,
        borderRadius: 2,
        padding: '16px 14px',
        boxShadow: '2px 3px 0 rgba(15,13,12,0.06)',
        transform: 'rotate(0.5deg)',
      }}
    >
      <p
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(15,13,12,0.35)',
          margin: '0 0 12px',
        }}
      >
        Prep checklist
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {CHECKLIST_ITEMS.map((item, i) => {
          const done = !!completed[item.key];
          return (
            <li
              key={item.key}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                marginBottom: i < CHECKLIST_ITEMS.length - 1 ? 10 : 0,
                fontSize: 12,
                lineHeight: 1.45,
                color: done ? 'rgba(15,13,12,0.35)' : 'rgba(15,13,12,0.75)',
                textDecoration: done ? 'line-through' : 'none',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 2,
                  border: done ? 'none' : '1.5px solid rgba(15,13,12,0.25)',
                  background: done ? '#007a4a' : 'transparent',
                  color: '#fff',
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {done ? '✓' : ''}
              </span>
              {item.label}
            </li>
          );
        })}
      </ul>
      <p style={{ fontSize: 10, color: 'rgba(15,13,12,0.35)', margin: '14px 0 0', lineHeight: 1.5 }}>
        Items check off automatically as you move through the review.
      </p>
    </aside>
  );
}
