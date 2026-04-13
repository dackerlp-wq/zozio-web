'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: '#2C1810',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontWeight: 900,
        fontSize: '14px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      🖨️ Tisk / Uložit jako PDF
    </button>
  )
}
