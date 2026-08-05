import { Wrench } from 'lucide-react';

export function StatusIcon({ status }: { status: string }) {
  if (status === 'En Curso') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M8 5v14l11-7z"/>
      </svg>
    );
  }
  if (status === 'En desarrollo') {
    return <Wrench size={14} />;
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
