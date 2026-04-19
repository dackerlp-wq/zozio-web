'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Article } from '@/types/database'

interface ArticleEditorProps {
  institutionId: string
  institutionType?: string
  mode: 'create' | 'edit'
  article?: Partial<Article> & { animal_id?: string }
  animals?: { id: string; name: string }[]
}

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36)
}

export function ArticleEditor({ institutionId, mode, article, animals = [] }: ArticleEditorProps) {
  const router    = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const coverRef  = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title:       article?.title       ?? '',
    perex:       article?.perex       ?? '',
    category:    article?.category    ?? 'story',
    author_name: article?.author_name ?? '',
    published:   article?.published   ?? false,
    animal_id:   article?.animal_id   ?? '',
  })
  const [coverUrl, setCoverUrl]             = useState<string>(article?.cover_url ?? '')
  const [content, setContent]               = useState<string>(article?.content ?? '')
  const [loading, setLoading]               = useState(false)
  const [uploading, setUploading]           = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [saved, setSaved]                   = useState(false)

  const update = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    editorRef.current?.focus()
    setContent(editorRef.current?.innerHTML ?? '')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `articles/${institutionId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('animal-photos')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('animal-photos').getPublicUrl(path)
      editorRef.current?.focus()
      document.execCommand('insertHTML', false,
        `<figure style="margin:1.5rem 0;"><img src="${publicUrl}" alt="" style="max-width:100%;border-radius:10px;display:block;" /></figure>`
      )
      setContent(editorRef.current?.innerHTML ?? '')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `articles/${institutionId}/cover-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('animal-photos').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('animal-photos').getPublicUrl(path)
      setCoverUrl(publicUrl)
    }
    setCoverUploading(false)
  }

  const handleSave = async (publish = false) => {
    if (!form.title) { setError('Zadej název článku'); return }
    setLoading(true)
    setError(null)

    const finalContent = editorRef.current?.innerHTML ?? content

    const payload = {
      institution_id:  institutionId,
      title:           form.title,
      slug:            article?.slug ?? slugify(form.title),
      perex:           form.perex          || null,
      content:         finalContent        || null,
      cover_url:       coverUrl            || null,
      category:        form.category,
      author_name:     form.author_name    || null,
      animal_id:       form.animal_id || null,
      published:       publish || form.published,
      published_at:    (publish || form.published) && !article?.published_at
                         ? new Date().toISOString()
                         : article?.published_at ?? null,
    }

    const url    = mode === 'create' ? '/api/articles' : `/api/articles/${article!.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()

    if (!res.ok) { setError(data.error ?? 'Chyba při ukládání'); setLoading(false); return }

    if (publish) {
      router.push('/admin/articles')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      if (mode === 'create' && data.id) router.replace(`/admin/articles/${data.id}`)
    }
    setLoading(false)
  }

  const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors w-full bg-white'

  const toolbarBtn = (label: string, action: () => void) => (
    <button key={label} onClick={action} title={label}
      className="px-2.5 py-1.5 rounded text-sm font-bold bg-gray-pale text-espresso hover:bg-gray-light transition-colors cursor-pointer border-none">
      {label}
    </button>
  )

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">

      {/* Editor — 2/3 */}
      <div className="lg:col-span-2 space-y-5">

        {/* Název + perex */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Název článku *</label>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Jak Max našel nový domov..."
              className={`${inputCls} font-display font-bold text-lg`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Perex (krátký popis, max 300 znaků)</label>
            <textarea
              value={form.perex}
              onChange={e => update('perex', e.target.value)}
              placeholder="Krátké shrnutí — zobrazí se v přehledu a na kartičce..."
              rows={2}
              maxLength={300}
              className={`${inputCls} resize-none`}
            />
            <span className="text-xs text-gray">{form.perex.length}/300 znaků</span>
          </div>
        </div>

        {/* Rich text editor */}
        <div className="bg-white rounded-lg border border-gray-pale shadow-sm overflow-hidden">
          <div className="flex flex-wrap gap-1.5 p-3 border-b border-gray-pale bg-sand/40">
            {toolbarBtn('B',       () => exec('bold'))}
            {toolbarBtn('I',       () => exec('italic'))}
            {toolbarBtn('U',       () => exec('underline'))}
            <div className="w-px bg-gray-pale mx-1" />
            {toolbarBtn('H2',      () => exec('formatBlock', 'h2'))}
            {toolbarBtn('H3',      () => exec('formatBlock', 'h3'))}
            {toolbarBtn('¶',       () => exec('formatBlock', 'p'))}
            <div className="w-px bg-gray-pale mx-1" />
            {toolbarBtn('• List',  () => exec('insertUnorderedList'))}
            {toolbarBtn('1. List', () => exec('insertOrderedList'))}
            {toolbarBtn('" ',      () => exec('formatBlock', 'blockquote'))}
            <div className="w-px bg-gray-pale mx-1" />
            <button
              onClick={() => { const url = prompt('URL odkazu:'); if (url) exec('createLink', url) }}
              className="px-2.5 py-1.5 rounded text-sm font-bold bg-gray-pale text-espresso hover:bg-gray-light transition-colors cursor-pointer border-none"
            >🔗</button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-2.5 py-1.5 rounded text-sm font-bold bg-coral-light text-coral-dark hover:bg-coral hover:text-white transition-colors cursor-pointer border-none disabled:opacity-50"
            >{uploading ? '⏳' : '🖼 Foto'}</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="w-px bg-gray-pale mx-1" />
            {toolbarBtn('⬅',      () => exec('justifyLeft'))}
            {toolbarBtn('☰',      () => exec('justifyFull'))}
            {toolbarBtn('⬛',     () => exec('justifyCenter'))}
            {toolbarBtn('➡',      () => exec('justifyRight'))}
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setContent(editorRef.current?.innerHTML ?? '')}
            dangerouslySetInnerHTML={{ __html: content }}
            className="min-h-[400px] p-5 md:p-6 font-body text-base text-espresso leading-relaxed outline-none"
            data-placeholder="Začni psát svůj příběh..."
          />
          <style>{`
            [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--text-muted); pointer-events: none; }
            [contenteditable] h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--espresso); margin: 1.5rem 0 0.5rem; }
            [contenteditable] h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--espresso); margin: 1.25rem 0 0.5rem; }
            [contenteditable] p { margin: 0.75rem 0; }
            [contenteditable] ul, [contenteditable] ol { margin: 0.75rem 0; padding-left: 1.5rem; }
            [contenteditable] blockquote { border-left: 4px solid var(--coral); padding: 0.5rem 1rem; margin: 1rem 0; background: var(--coral-light); border-radius: 0 8px 8px 0; font-style: italic; color: var(--brown); }
            [contenteditable] a { color: var(--coral); text-decoration: underline; }
            [contenteditable] img { max-width: 100%; border-radius: 10px; }
          `}</style>
        </div>
      </div>

      {/* Pravý panel */}
      <div className="space-y-5">

        {/* Cover foto */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-espresso mb-3">Náhledový obrázek</h3>
          {coverUrl ? (
            <div className="relative mb-3">
              <img src={coverUrl} alt="Cover" className="w-full h-40 object-cover rounded-md" />
              <button onClick={() => setCoverUrl('')}
                className="absolute top-2 right-2 w-7 h-7 bg-coral text-white rounded-full text-sm font-bold flex items-center justify-center cursor-pointer border-none">
                ×
              </button>
            </div>
          ) : (
            <div className="w-full h-32 bg-sand rounded-md flex items-center justify-center text-gray text-sm mb-3">
              Žádný obrázek
            </div>
          )}
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          <Button variant="sand" size="sm" className="w-full justify-center" loading={coverUploading}
            onClick={() => coverRef.current?.click()}>
            {coverUploading ? 'Nahrávám...' : '📷 Nahrát obrázek'}
          </Button>
        </div>

        {/* Meta + propojení */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm space-y-4">
          <h3 className="font-display font-extrabold text-lg text-espresso">Nastavení</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Kategorie</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} className={inputCls}>
              <option value="story">🐾 Příběh adopce</option>
              <option value="tips">💡 Tipy a rady</option>
              <option value="news">📰 Novinky</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Autor</label>
            <input value={form.author_name} onChange={e => update('author_name', e.target.value)}
              placeholder="Jana Nováková" className={inputCls} />
          </div>

          {/* Propojení se zvířetem */}
          <div className="pt-3 border-t border-gray-pale">
            <div className="text-xs font-bold text-brown uppercase tracking-wider mb-3">
              Propojit se zvířetem
            </div>
            <p className="text-xs text-gray mb-3">
              Na profilu zvířete se zobrazí odkaz na tento článek.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brown">Zvíře (volitelné)</label>
              <select value={form.animal_id} onChange={e => update('animal_id', e.target.value)} className={inputCls}>
                <option value="">— Nepropojovat —</option>
                {animals.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input type="checkbox" checked={form.published} onChange={e => update('published', e.target.checked)}
              className="w-4 h-4 accent-coral" />
            <span className="font-body text-sm font-semibold text-espresso">Publikováno</span>
          </label>
        </div>

        {/* Akce */}
        {error && (
          <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">⚠️ {error}</div>
        )}
        {saved && (
          <div className="bg-success-bg text-success text-sm font-semibold px-4 py-3 rounded-sm">✓ Uloženo jako koncept</div>
        )}

        <Button variant="sand" className="w-full justify-center" loading={loading} onClick={() => handleSave(false)}>
          Uložit koncept
        </Button>
        <Button variant="primary" className="w-full justify-center" loading={loading} onClick={() => handleSave(true)}>
          ✓ Publikovat článek
        </Button>

        {mode === 'edit' && (
          <button
            onClick={async () => {
              if (!confirm('Opravdu smazat článek?')) return
              await fetch(`/api/articles/${article!.id}`, { method: 'DELETE' })
              router.push('/admin/articles')
            }}
            className="w-full py-2.5 text-sm text-gray hover:text-coral transition-colors font-semibold cursor-pointer bg-transparent border-none"
          >
            🗑 Smazat článek
          </button>
        )}
      </div>
    </div>
  )
}
