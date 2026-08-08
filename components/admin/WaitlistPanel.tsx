'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

const BORDER = '1px solid rgba(15,13,12,0.1)';

export interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string;
  domain: string;
  degree: string;
  referral_source?: string | null;
  motivation: string;
  status: 'pending' | 'invited' | 'converted' | 'rejected';
  admin_notes?: string | null;
  created_at: string;
  invited_at?: string | null;
  last_emailed_at?: string | null;
  emails_sent_count?: number;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(154,101,0,0.12)', color: '#9a6500' },
  invited:   { bg: 'rgba(0,95,163,0.12)', color: '#005fa3' },
  converted: { bg: 'rgba(0,122,74,0.12)', color: '#007a4a' },
  rejected:  { bg: 'rgba(15,13,12,0.08)', color: 'rgba(15,13,12,0.45)' },
};

const DEFAULT_UPDATE_MESSAGE =
  'Quick update from the Orcred team — we are preparing for launch and wanted to check in.\n\n' +
  'We will email you again when your spot opens. Reply anytime if you have questions.';

type EmailTemplate = 'update' | 'launch';

export default function WaitlistPanel() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [selected, setSelected] = useState<WaitlistEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>('update');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState(DEFAULT_UPDATE_MESSAGE);
  const [emailTarget, setEmailTarget] = useState<'single' | 'filtered'>('filtered');
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchWaitlist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await api.admin.waitlist(params.toString()) as {
        data?: WaitlistEntry[];
        total?: number;
        migration_required?: boolean;
      };
      setEntries(res.data ?? []);
      setTotal(res.total ?? 0);
      setMigrationRequired(!!res.migration_required);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    void fetchWaitlist();
  }, [fetchWaitlist]);

  useEffect(() => {
    setNotes(selected?.admin_notes ?? '');
  }, [selected]);

  const updateStatus = async (id: string, status: WaitlistEntry['status']) => {
    setSaving(true);
    try {
      await api.admin.updateWaitlist(id, { status });
      await fetchWaitlist();
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.admin.updateWaitlist(selected.id, { admin_notes: notes });
      await fetchWaitlist();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const copyEmails = () => {
    const emails = entries.map((e) => e.email).join(', ');
    void navigator.clipboard.writeText(emails);
    setSuccess('Copied emails on this page to clipboard.');
  };

  const openEmailModal = (template: EmailTemplate, target: 'single' | 'filtered') => {
    setEmailTemplate(template);
    setEmailTarget(target);
    setEmailSubject('');
    setEmailMessage(template === 'update' ? DEFAULT_UPDATE_MESSAGE : '');
    setEmailOpen(true);
    setSuccess('');
    setError('');
  };

  const sendEmail = async () => {
    const isSingle = emailTarget === 'single' && selected;
    const filterLabel = statusFilter || 'all statuses';
    const countLabel = isSingle ? '1 person' : `${total} matching "${filterLabel}"`;

    if (
      !confirm(
        `Send ${emailTemplate === 'launch' ? 'launch invite' : 'update'} email to ${countLabel}?\n\n` +
          (emailTemplate === 'launch' ? 'Pending entries will be marked as invited.' : ''),
      )
    ) {
      return;
    }

    setSendingEmail(true);
    setError('');
    setSuccess('');
    try {
      const payload: Parameters<typeof api.admin.sendWaitlistEmail>[0] = {
        template: emailTemplate,
        mark_invited: emailTemplate === 'launch',
      };
      if (emailSubject.trim()) payload.subject = emailSubject.trim();
      if (emailMessage.trim()) payload.message = emailMessage.trim();
      if (isSingle && selected) {
        payload.entry_ids = [selected.id];
      } else if (statusFilter) {
        payload.status = statusFilter as WaitlistEntry['status'];
      } else if (emailTemplate === 'launch') {
        payload.status = 'pending';
      } else {
        payload.send_to_all = true;
      }

      const res = await api.admin.sendWaitlistEmail(payload) as {
        data?: { sent_count?: number; failed_count?: number };
      };
      const sent = res.data?.sent_count ?? 0;
      const failed = res.data?.failed_count ?? 0;
      setSuccess(`Sent ${sent} email${sent === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}.`);
      setEmailOpen(false);
      await fetchWaitlist();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Email send failed');
    } finally {
      setSendingEmail(false);
    }
  };

  const filterDescription = statusFilter
    ? `${total} ${statusFilter} signup${total === 1 ? '' : 's'}`
    : `${total} total signup${total === 1 ? '' : 's'}`;

  if (migrationRequired) {
    return (
      <div style={{ padding: 40, background: '#fff', border: BORDER, fontSize: 14, color: '#9a6500' }}>
        Run migrations <code>009_waitlist.sql</code> and <code>014_waitlist_email_tracking.sql</code>, then refresh.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
      <div style={{ background: '#fff', border: BORDER }}>
        <div style={{ padding: '16px 20px', borderBottom: BORDER }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#eb4511' }}>
                Pre-launch waitlist
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(15,13,12,0.5)' }}>
                {filterDescription} — separate from full applications
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <input
              type="search"
              placeholder="Search name, email, domain…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: 180, padding: '8px 12px', fontSize: 13, border: '1px solid rgba(15,13,12,0.15)' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid rgba(15,13,12,0.15)' }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="invited">Invited</option>
              <option value="converted">Converted</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              type="button"
              onClick={() => openEmailModal('update', 'filtered')}
              disabled={total === 0}
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, border: BORDER, background: '#fff', cursor: 'pointer' }}
            >
              Email filtered
            </button>
            <button
              type="button"
              onClick={() => openEmailModal('launch', 'filtered')}
              disabled={total === 0}
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Send launch invites
            </button>
            <button
              type="button"
              onClick={copyEmails}
              disabled={entries.length === 0}
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, border: BORDER, background: '#fff', cursor: 'pointer' }}
            >
              Copy emails
            </button>
          </div>
        </div>

        {error && (
          <p style={{ margin: 0, padding: '12px 20px', fontSize: 13, color: '#ba1a1a', borderBottom: BORDER }}>{error}</p>
        )}
        {success && (
          <p style={{ margin: 0, padding: '12px 20px', fontSize: 13, color: '#007a4a', borderBottom: BORDER }}>{success}</p>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(15,13,12,0.4)' }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(15,13,12,0.4)' }}>No waitlist signups yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: BORDER, textAlign: 'left', color: 'rgba(15,13,12,0.45)', fontSize: 11 }}>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Domain</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Degree</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Found via</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Last email</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => {
                const sc = STATUS_COLORS[row.status] ?? STATUS_COLORS.pending;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    style={{
                      borderBottom: BORDER,
                      cursor: 'pointer',
                      background: selected?.id === row.id ? 'rgba(235,69,17,0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{row.full_name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(15,13,12,0.45)' }}>{row.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{row.domain}</td>
                    <td style={{ padding: '12px 16px' }}>{row.degree}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(15,13,12,0.55)' }}>
                      {row.referral_source ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 3, background: sc.bg, color: sc.color }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(15,13,12,0.45)', fontSize: 12 }}>
                      {row.last_emailed_at
                        ? new Date(row.last_emailed_at).toLocaleDateString('en-IN')
                        : '—'}
                      {(row.emails_sent_count ?? 0) > 0 && (
                        <span style={{ marginLeft: 4, fontSize: 10 }}>({row.emails_sent_count})</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(15,13,12,0.45)', fontSize: 12 }}>
                      {new Date(row.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {total > 20 && (
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: BORDER }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Prev</button>
            <span style={{ fontSize: 12, lineHeight: '28px', color: 'rgba(15,13,12,0.45)' }}>Page {page}</span>
            <button type="button" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Next</button>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ background: '#fff', border: BORDER, padding: 20, position: 'sticky', top: 72 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#eb4511', margin: 0 }}>Waitlist</p>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0' }}>{selected.full_name}</h3>
              <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: '4px 0 0' }}>{selected.email}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: 'rgba(15,13,12,0.35)' }}>×</button>
          </div>

          <p style={{ fontSize: 12, margin: '0 0 4px', color: 'rgba(15,13,12,0.45)' }}><strong>Domain:</strong> {selected.domain}</p>
          <p style={{ fontSize: 12, margin: '0 0 4px', color: 'rgba(15,13,12,0.45)' }}><strong>Degree:</strong> {selected.degree}</p>
          <p style={{ fontSize: 12, margin: '0 0 12px', color: 'rgba(15,13,12,0.45)' }}><strong>Found us via:</strong> {selected.referral_source ?? '—'}</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', color: 'rgba(15,13,12,0.65)' }}>{selected.motivation}</p>

          {selected.last_emailed_at && (
            <p style={{ fontSize: 12, margin: '0 0 16px', color: 'rgba(15,13,12,0.45)' }}>
              Last emailed {new Date(selected.last_emailed_at).toLocaleString('en-IN')}
              {(selected.emails_sent_count ?? 0) > 0 ? ` · ${selected.emails_sent_count} total` : ''}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              disabled={selected.status === 'rejected'}
              onClick={() => openEmailModal('update', 'single')}
              style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, border: BORDER, background: '#fff', cursor: 'pointer' }}
            >
              Send update
            </button>
            <button
              type="button"
              disabled={selected.status === 'rejected'}
              onClick={() => openEmailModal('launch', 'single')}
              style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Send launch invite
            </button>
          </div>

          <p style={{ fontSize: 11, fontWeight: 600, margin: '0 0 8px', color: 'rgba(15,13,12,0.45)' }}>Status</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {(['pending', 'invited', 'converted', 'rejected'] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={saving}
                onClick={() => updateStatus(selected.id, s)}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: selected.status === s ? '1.5px solid #eb4511' : BORDER,
                  background: selected.status === s ? 'rgba(235,69,17,0.08)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, color: 'rgba(15,13,12,0.45)' }}>Admin notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            style={{ width: '100%', fontSize: 12, padding: 10, border: '1px solid rgba(15,13,12,0.15)', marginBottom: 10, fontFamily: 'inherit' }}
          />
          <button
            type="button"
            disabled={saving}
            onClick={saveNotes}
            style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Save notes
          </button>
        </div>
      )}

      {emailOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,13,12,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => !sendingEmail && setEmailOpen(false)}
        >
          <div
            style={{ background: '#fff', border: BORDER, width: '100%', maxWidth: 520, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
              {emailTemplate === 'launch' ? 'Send launch invite' : 'Send waitlist update'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(15,13,12,0.5)' }}>
              {emailTarget === 'single' && selected
                ? `To ${selected.full_name} (${selected.email})`
                : statusFilter
                  ? `To all ${total} "${statusFilter}" entries matching your filter`
                  : emailTemplate === 'launch'
                    ? `To all ${total} pending entries`
                    : `To all ${total} non-rejected entries`}
            </p>

            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, color: 'rgba(15,13,12,0.45)' }}>
              Subject (optional)
            </label>
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={emailTemplate === 'launch' ? 'Orcred is live — your spot is ready' : 'Update from Orcred'}
              style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid rgba(15,13,12,0.15)', marginBottom: 12 }}
            />

            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, color: 'rgba(15,13,12,0.45)' }}>
              Message {emailTemplate === 'update' ? '' : '(optional extra note)'}
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={8}
              style={{ width: '100%', fontSize: 13, padding: 10, border: '1px solid rgba(15,13,12,0.15)', marginBottom: 8, fontFamily: 'inherit' }}
            />
            <p style={{ margin: '0 0 16px', fontSize: 11, color: 'rgba(15,13,12,0.4)' }}>
              Personalize with {'{{first_name}}'}, {'{{name}}'}, {'{{domain}}'}, {'{{degree}}'}
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={sendingEmail}
                onClick={() => setEmailOpen(false)}
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, border: BORDER, background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingEmail || (emailTemplate === 'update' && !emailMessage.trim())}
                onClick={() => void sendEmail()}
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {sendingEmail ? 'Sending…' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
