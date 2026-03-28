import * as React from 'react'

interface BaseLayoutProps {
  children: React.ReactNode
  previewText?: string
}

export function BaseLayout({ children, previewText }: BaseLayoutProps) {
  return (
    <html lang="cs">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {previewText && (
          <span
            style={{
              display: 'none',
              fontSize: '1px',
              color: '#fff',
              maxHeight: 0,
              overflow: 'hidden',
            }}
          >
            {previewText}
          </span>
        )}
      </head>
      <body
        style={{
          backgroundColor: '#E8E0D8',
          margin: 0,
          padding: '40px 20px',
          fontFamily: "'Nunito', 'Helvetica Neue', Arial, sans-serif",
          color: '#2C1810',
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ maxWidth: 620, margin: '0 auto' }}
        >
          <tbody>
            <tr>
              <td>{children}</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}
