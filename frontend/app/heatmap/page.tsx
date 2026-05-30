import type { Metadata } from 'next';
import HeatmapClient from './HeatmapClient';

export const metadata: Metadata = {
  title: 'Heatmap Analytics | AASTU NavAR',
  description: 'Real-time campus traffic density and session analytics dashboard',
};

// Server Component: just exports metadata and delegates rendering to client wrapper
export default function HeatmapPage() {
  return <HeatmapClient />;
}
