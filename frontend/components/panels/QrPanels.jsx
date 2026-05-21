'use client';
import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { tok, useFetch, Pill, PHead, Empty, Spin, Err, Btn, Input, Sel, FGrid, TTable, TD, MsgBox } from './shared';

export function QrRegistryPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getMarkers(tok()));
  const markers = data?.markers || [];
  return (
    <article className="actualPanel">
      <PHead title="QR Anchor Registry" count={markers.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : markers.length === 0 ? <Empty /> : (
        <TTable
          heads={['Marker Name', 'Linked Node', 'Status', 'Model Path']}
          rows={markers}
          renderRow={m => (<>
            <TD><b>{m.marker_name}</b></TD>
            <TD muted>{m.linked_node_name || (m.linked_node ? `Node #${m.linked_node}` : '–')}</TD>
            <TD><Pill v={m.status || 'active'} /></TD>
            <TD muted mono>{m.model_path || '–'}</TD>
          </>)}
        />
      )}
    </article>
  );
}


export function ScanHistoryPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getQrScans(tok()));
  const scans = data?.scans || [];
  return (
    <article className="actualPanel">
      <PHead title="QR Scan History" count={scans.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : scans.length === 0 ? <Empty /> : (
        <TTable
          heads={['QR Code', 'Device', 'Resolved Node', 'Scan Time']}
          rows={scans}
          renderRow={s => (<>
            <TD mono><b>{s.qr_code}</b></TD>
            <TD muted>{s.device_id || '–'}</TD>
            <TD muted>{s.node_name || s.resolved_node_id || '–'}</TD>
            <TD muted>{s.scan_time ? new Date(s.scan_time).toLocaleString() : '–'}</TD>
          </>)}
        />
      )}
    </article>
  );
}
