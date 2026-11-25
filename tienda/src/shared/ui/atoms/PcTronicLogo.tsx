export function PcTronicLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className={`pctronic-logo ${size === 'sm' ? 'pctronic-logo--sm' : ''}`}>
      <img
        src="/media/logo-pctronic.png"
        alt="PC TRONIC RIF J-41317926-1"
        className="pctronic-logo__img"
        width={120}
        height={44}
      />
    </span>
  );
}
