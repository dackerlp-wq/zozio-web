'use client'

export function PrintControls() {
  return (
    <div
      id="print-controls"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#2C1810',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 700, flex: 1 }}>
        📄 Náhled dokumentu — pro tisk zvolte <strong style={{ color: 'white' }}>Ctrl+P</strong> nebo níže
      </span>
      <button
        onClick={() => window.print()}
        style={{
          background: '#E8634A',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 18px',
          fontWeight: 900,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        🖨️ Tisk / Uložit jako PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{
          background: '#554030',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 14px',
          fontWeight: 900,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        ✕ Zavřít
      </button>
    </div>
  )
}
