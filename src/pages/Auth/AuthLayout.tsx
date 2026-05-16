import React from 'react';
import { G } from '../../constants/styles';

export function AuthLayout({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: G.creme, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: G.blanc, borderRadius: 24, padding: '32px 24px', boxShadow: '0 8px 40px rgba(44,26,14,0.12)' }}>
        <div onClick={onBack} style={{ cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span style={{ fontSize: '0.85rem', color: '#555' }}>Retour</span>
        </div>
        {children}
      </div>
    </div>
  );
}
