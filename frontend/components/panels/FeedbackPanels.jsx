'use client';
import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { tok, useFetch, Pill, PHead, Empty, Spin, Err, Btn, TTable, TD, MsgBox } from './shared';

export function FeedbackInboxPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getFeedback(tok(), 'general'));
  const [items, setItems] = useState([]);
  useEffect(() => { if (data?.feedback) setItems(data.feedback); }, [data]);

  async function updateStatus(id, status) {
    try {
      const res = await api.updateFeedbackStatus(tok(), id, status);
      setItems(prev => prev.map(f => f.id === id ? { ...f, ...res.feedback } : f));
    } catch (err) { alert(err.message); }
  }

  return (
    <article className="actualPanel">
      <PHead title="Feedback Inbox" count={items.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : items.length === 0 ? <Empty msg="No general feedback yet" /> : (
        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 10 }}>
          {items.map(f => (
            <div key={f.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{f.message}</p>
                <Pill v={f.status || 'open'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <small style={{ color: '#94a3b8', fontSize: 12 }}>
                  {f.device_id ? `Device: ${f.device_id}` : ''}
                  {f.node_name ? ` · ${f.node_name}` : ''}
                  {f.created_at ? ` · ${new Date(f.created_at).toLocaleDateString()}` : ''}
                </small>
                {f.status !== 'resolved' && (
                  <Btn variant="secondary" onClick={() => updateStatus(f.id, 'resolved')}>Mark Resolved</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export function RouteIssuesPanel() {
  const { data: issueData, loading: iLoad, error: iErr, reload: iReload } = useFetch(() => api.getFeedback(tok(), 'route_issue'));
  const { data: ratingData, loading: rLoad } = useFetch(() => api.getRatings(tok()));
  const issues = issueData?.feedback || [];
  const ratings = ratingData?.feedback || [];

  function Stars({ n }) {
    return <span style={{ color: '#f59e0b', letterSpacing: 2 }}>{'★'.repeat(n || 0)}{'☆'.repeat(5 - (n || 0))}</span>;
  }

  return (
    <>
      <article className="actualPanel">
        <PHead title="Route Issues" count={issues.length} />
        {iLoad ? <Spin /> : iErr ? <Err msg={iErr} reload={iReload} /> : issues.length === 0 ? <Empty msg="No route issues reported" /> : (
          <TTable
            heads={['Message', 'Node', 'Session', 'Date', 'Status']}
            rows={issues}
            renderRow={f => (<>
              <TD><b style={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.message}</b></TD>
              <TD muted>{f.node_name || '–'}</TD>
              <TD muted>{f.session_id || '–'}</TD>
              <TD muted>{f.created_at ? new Date(f.created_at).toLocaleDateString() : '–'}</TD>
              <TD><Pill v={f.status} /></TD>
            </>)}
          />
        )}
      </article>
      <article className="actualPanel">
        <PHead title="Navigation Ratings" count={ratings.length} />
        {rLoad ? <Spin /> : ratings.length === 0 ? <Empty msg="No ratings submitted" /> : (
          <TTable
            heads={['Rating', 'Message', 'Node', 'Date']}
            rows={ratings}
            renderRow={f => (<>
              <TD><Stars n={f.rating} /></TD>
              <TD muted>{f.message || '–'}</TD>
              <TD muted>{f.node_name || '–'}</TD>
              <TD muted>{f.created_at ? new Date(f.created_at).toLocaleDateString() : '–'}</TD>
            </>)}
          />
        )}
      </article>
    </>
  );
}
