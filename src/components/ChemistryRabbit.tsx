import { useEffect, useState } from 'react';

const encouragements = [
  'You and chemistry have great potential. Keep going!',
  'Every attempt builds a stronger bond with what you know.',
  'Take it one reaction at a time. You’re making progress!',
  'Even a tricky mechanism starts with one small step.',
  'Stay curious! Your next “aha!” moment could be one reaction away.',
  'You bring the energy. Practice is the catalyst!',
  'Pause, breathe, and follow the electrons. You’ve got this!',
  'Learning takes activation energy. Your effort counts!',
];

export default function ChemistryRabbit() {
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let previous = -1;
    function schedule(first = false) {
      timer = setTimeout(() => {
        // Skip hidden tabs so a visit only happens while the app is in use.
        if (!document.hidden) {
          const index = (previous + 1 + Math.floor(Math.random() * (encouragements.length - 1))) % encouragements.length;
          previous = index;
          setMessage(encouragements[index]);
        }
        schedule();
      }, first ? 15000 + Math.random() * 15000 : 60000 + Math.random() * 60000);
    }
    schedule(true);
    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 12000);
    return () => clearTimeout(timer);
  }, [message]);

  return <>
    <div className="rabbit-preference"><button className="text-button" aria-pressed={enabled} onClick={() => {
      setEnabled(value => !value);
      setMessage(null);
    }}>Pip’s encouragement: {enabled ? 'on' : 'off'}</button></div>
    <div className="rabbit-announcement" aria-live="polite" aria-atomic="true">
      {enabled && message && <aside className="rabbit-visit" aria-label="Encouragement from Pip the chemistry rabbit">
        <button className="rabbit-dismiss" aria-label="Dismiss Pip’s encouragement" onClick={() => setMessage(null)}>×</button>
        <div className="rabbit-bubble"><strong>Pip, your lab buddy</strong><p>{message}</p></div>
        <svg className="rabbit-character" viewBox="0 0 160 190" aria-hidden="true">
          <ellipse cx="80" cy="181" rx="49" ry="6" fill="#483653" opacity=".12" />
          <g stroke="#705382" strokeWidth="3" strokeLinejoin="round">
            <ellipse cx="57" cy="44" rx="15" ry="36" fill="#fffaf5" transform="rotate(-13 57 44)" />
            <ellipse cx="100" cy="42" rx="15" ry="37" fill="#fffaf5" transform="rotate(12 100 42)" />
            <path d="M55 62Q43 18 54 17Q65 24 62 62M95 60Q97 16 106 17Q114 23 103 62" fill="#f1c2d3" stroke="none" />
            <ellipse cx="80" cy="145" rx="37" ry="34" fill="#fffaf5" />
            <ellipse cx="57" cy="176" rx="20" ry="9" fill="#fffaf5" />
            <ellipse cx="103" cy="176" rx="20" ry="9" fill="#fffaf5" />
            <path d="M58 118L43 165Q80 178 117 165L102 118" fill="white" />
            <path d="M64 120L80 140L95 120M80 140V170" fill="none" />
            <path d="M97 144V156H109V144Z" fill="#e5d8ef" />
            <ellipse cx="80" cy="91" rx="45" ry="36" fill="#fffaf5" />
            <path d="M40 85H120" fill="none" />
            <rect x="47" y="77" width="28" height="22" rx="9" fill="#e5f5f5" />
            <rect x="85" y="77" width="28" height="22" rx="9" fill="#e5f5f5" />
            <path d="M75 85Q80 81 85 85" fill="none" />
            <path d="M61 85V89M99 85V89" strokeLinecap="round" />
            <ellipse cx="49" cy="103" rx="8" ry="5" fill="#f1c2d3" stroke="none" />
            <ellipse cx="111" cy="103" rx="8" ry="5" fill="#f1c2d3" stroke="none" />
            <path d="M75 103Q80 99 85 103L80 108Z" fill="#d991aa" stroke="none" />
            <path d="M80 108Q74 116 69 109M80 108Q86 116 91 109" fill="none" strokeLinecap="round" />
            <ellipse cx="43" cy="141" rx="10" ry="15" fill="#fffaf5" transform="rotate(25 43 141)" />
            <ellipse cx="120" cy="133" rx="10" ry="15" fill="#fffaf5" transform="rotate(-30 120 133)" />
          </g>
        </svg>
      </aside>}
    </div>
  </>;
}
