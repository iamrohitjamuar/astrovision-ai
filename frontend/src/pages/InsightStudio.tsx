import { useEffect, useMemo, useRef, useState } from 'react'
import { createReading, deleteReading, getAiStatus, getHealth, getReading, getReadings } from '../services/api'
import type { AiStatus, Kind, Reading } from '../types/reading'
import { Activity, ArrowDownRight, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Compass, Download, Eye, FileClock, Fingerprint, Heart, History, ImagePlus, LoaderCircle, MoonStar, Sparkles, Stars, Sun, Trash2, Upload, WandSparkles, X } from 'lucide-react'

const types: { id: Kind; title: string; sub: string; icon: typeof Fingerprint }[] = [
  { id: 'PALM', title: 'Palm reading', sub: 'Traditional palmistry', icon: Fingerprint },
  { id: 'FACE', title: 'Face reading', sub: 'Cultural interpretation', icon: Eye },
  { id: 'HOROSCOPE', title: 'Horoscope', sub: 'Sun-sign reflection', icon: MoonStar },
  { id: 'COMBINED', title: 'Combined reading', sub: 'Image + birth details', icon: Sparkles },
]

function App() {
  const [active, setActive] = useState<Kind>('PALM')
  const [name, setName] = useState('Riya Sharma')
  const [birthDate, setBirthDate] = useState('1996-08-14')
  const [birthTime, setBirthTime] = useState('08:30')
  const [birthPlace, setBirthPlace] = useState('Mumbai, India')
  const [image, setImage] = useState<{ data: string; mime: string; name: string; preview: string } | null>(null)
  const [current, setCurrent] = useState<Reading | null>(null)
  const [history, setHistory] = useState<Reading[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [health, setHealth] = useState<'checking' | 'online' | 'offline'>('checking')
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const requiresImage = active !== 'HOROSCOPE'
  const requiresBasicDetails = active === 'HOROSCOPE' || active === 'COMBINED'
  const activeType = types.find(t => t.id === active)!
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()), [])

  async function refreshHistory() {
    try {
      setHistory(await getReadings())
      setHealth('online')
    } catch { setHealth('offline') }
  }
  async function refreshAiStatus() {
    try { setAiStatus(await getAiStatus()) }
    catch { setAiStatus({ reachable: false, message: 'Could not read local LLM status.' }) }
  }
  useEffect(() => { void refreshHistory(); void refreshAiStatus(); getHealth().then(() => setHealth('online')).catch(() => setHealth('offline')) }, [])

  function onFile(file?: File) {
    setError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Please choose a JPG, PNG, or WEBP image.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be 5 MB or smaller.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setImage({ data: dataUrl.split(',')[1] || '', mime: file.type, name: file.name, preview: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (requiresBasicDetails && !name.trim()) { setError('Please enter a name.'); return }
    if (requiresImage && !image) { setError('Upload an image to continue with this reading.'); return }
    if ((active === 'HOROSCOPE' || active === 'COMBINED') && !birthDate) { setError('Enter your birth date for a horoscope reading.'); return }
    setBusy(true)
    try {
      const payload = { name: requiresBasicDetails ? name.trim() : '', readingType: active, birthDate: requiresBasicDetails ? birthDate : '', birthTime: requiresBasicDetails ? birthTime : '', birthPlace: requiresBasicDetails ? birthPlace : '', imageName: image?.name, imageMimeType: image?.mime, imageData: image?.data }
      const data = await createReading(payload)
      setCurrent(data); await refreshHistory()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unexpected error. Check that the backend is running.') }
    finally { setBusy(false) }
  }

  async function openReading(id: string) {
    setError('')
    try { const data = await getReading(id); setCurrent(data); setActive(data.readingType as Kind); setName(data.name); setBirthDate(data.birthDate || ''); setBirthTime(data.birthTime || ''); setBirthPlace(data.birthPlace || '') }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not open reading') }
  }
  async function removeReading(id: string) {
    if (!confirm('Delete this saved reading?')) return
    try { await deleteReading(id); if (current?.id === id) setCurrent(null); await refreshHistory() }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete reading') }
  }
  function exportReport() {
    if (!current) return
    const text = `${current.title}\nName: ${current.name}\nType: ${current.readingType}\nSun sign: ${current.zodiacSign || 'Not provided'}\n\n${current.summary}\n\n${current.insights.map(i => `${i.area}: ${i.headline}\n${i.detail}`).join('\n\n')}\n\nReflection prompts:\n${current.recommendations.map(r => `- ${r}`).join('\n')}\n\nMode: ${current.mode}\nCreated: ${current.createdAt}\n\nDisclaimer: For cultural/entertainment reflection only; not a scientific assessment or guaranteed prediction.`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `astrovision-${current.id}.txt`; a.click(); URL.revokeObjectURL(url)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Stars size={22}/></div><div><strong>astrovision<span>.ai</span></strong><small>PERSONAL INSIGHT STUDIO</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="nav-item selected" onClick={() => setCurrent(null)}><Compass size={17}/> Insight studio <span className="nav-dot"/></button>
      <button className="nav-item" onClick={() => document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })}><History size={17}/> Reading history</button>
      <div className="sidebar-card"><div className="orbit-icon"><MoonStar size={22}/></div><div className="side-card-title">A moment for you</div><p>Use ancient traditions as prompts for modern self-reflection.</p><div className="side-card-foot"><span className="live-dot"/> LOCAL LLM MODE</div></div>
      <div className="sidebar-bottom"><div className="avatar">AV</div><div className="profile-copy"><strong>Demo workspace</strong><small>Local environment</small></div><ChevronDown size={15} className="muted"/></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{current ? 'Reading report' : 'Insight studio'}</strong></div><div className="topbar-right"><span className={`connection ${health}`}><i/>{health === 'online' ? 'API connected' : health === 'offline' ? 'API unavailable' : 'Connecting'}</span><span className={`connection ${aiStatus?.reachable && aiStatus?.modelAvailable ? 'online' : aiStatus ? 'offline' : 'checking'}`} title={aiStatus?.message || 'Checking Ollama'}><i/>{aiStatus?.reachable && aiStatus?.modelAvailable ? `Ollama · ${aiStatus.configuredModel}` : aiStatus?.mode === 'local-demo' ? 'AI demo mode' : aiStatus ? 'Ollama unavailable' : 'Checking AI'}</span><div className="top-date"><CalendarDays size={15}/>{dateLabel}</div></div></header>
      <div className="content-wrap">
        <section className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={13}/> YOUR PERSONAL INSIGHT STUDIO</div><h1>Find a little more <em>perspective.</em></h1><p>Explore traditional palmistry, face-reading culture, and horoscope themes in one thoughtful space.</p><div className="hero-trust"><span><Check size={13}/> Private local demo</span><span><Check size={13}/> Your reports, saved</span><span><Check size={13}/> You stay in control</span></div></div><div className="hero-art"><div className="art-glow"/><div className="planet planet-one"/><div className="planet planet-two"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-center"><MoonStar size={52} strokeWidth={1}/></div><span className="star s1">✦</span><span className="star s2">✧</span><span className="star s3">✦</span><span className="art-caption">A NEW PERSPECTIVE</span></div></section>

        {error && <div className="error-banner"><CircleHelp size={17}/><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={16}/></button></div>}

        <div className="section-heading"><div><div className="eyebrow muted-eyebrow">CHOOSE YOUR PATH</div><h2>What would you like to explore?</h2></div><span className="step-label">01 <span>/</span> 02</span></div>
        <div className="reading-types">{types.map(t => { const Icon = t.icon; return <button key={t.id} className={`type-card ${active === t.id ? 'active' : ''}`} onClick={() => { setActive(t.id); setCurrent(null); setError('') }}><div className="type-icon"><Icon size={20}/></div><div className="type-text"><strong>{t.title}</strong><small>{t.sub}</small></div><span className="radio-dot">{active === t.id && <span/>}</span></button> })}</div>

        <div className="builder-grid">
          <section className="panel form-panel"><div className="panel-header"><div className="panel-icon"><WandSparkles size={18}/></div><div><h3>{requiresBasicDetails ? 'Personalize your reading' : 'Upload your image'}</h3><p>{requiresBasicDetails ? 'Basic details are used for horoscope-based insights.' : 'No personal details needed for this reading.'}</p></div>{requiresBasicDetails && <span className="required-note">* Required</span>}</div>
            <form onSubmit={generate}>
              {requiresBasicDetails && <><div className="field"><label htmlFor="name">Your name <span>*</span></label><input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required maxLength={80}/></div>
              <div className="field-row"><div className="field"><label htmlFor="birthDate">Date of birth <span>*</span></label><input id="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required={requiresBasicDetails}/></div><div className="field"><label htmlFor="birthTime">Birth time <small>Optional</small></label><input id="birthTime" type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}/></div></div>
              <div className="field"><label htmlFor="birthPlace">Place of birth <small>Optional</small></label><div className="input-icon"><Compass size={16}/><input id="birthPlace" value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="City, country" maxLength={120}/></div></div></>}
              {requiresImage && <div className="field"><div className="upload-label"><label>Upload {active === 'FACE' ? 'a face' : active === 'COMBINED' ? 'a palm or face' : 'your palm'} image <span>*</span></label><small>JPG, PNG, WEBP · Max 5 MB</small></div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" onChange={e => onFile(e.target.files?.[0])}/>{image ? <div className="selected-image"><img src={image.preview} alt="Selected upload preview"/><div className="selected-image-copy"><strong>{image.name}</strong><small>Ready to submit</small></div><button type="button" className="icon-button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = '' }} aria-label="Remove image"><X size={16}/></button></div> : <button type="button" className="upload-zone" onClick={() => fileRef.current?.click()}><div className="upload-icon"><ImagePlus size={21}/></div><strong>Choose an image to upload</strong><span>or drag and drop a file here</span><small>Use a clear, well-lit photo for the demo</small></button>}</div>}
              <div className="privacy-note"><span><Activity size={15}/></span><p><strong>Local demo & privacy</strong><br/>Your image is sent to the local backend and stored with the report in MongoDB. Delete the report to remove it from the demo database.</p></div>
              <button className="primary-button" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={17} className="spin"/> Creating your report…</> : <><Sparkles size={17}/> Generate my reading <ArrowRight size={17}/></>}</button>
              <div className="form-footnote"><Clock3 size={13}/> Local model response time depends on your hardware</div>
            </form>
          </section>

          <section className="panel preview-panel"><div className="panel-header preview-header"><div className="panel-icon gold"><BookOpen size={18}/></div><div><h3>{current ? 'Your reading report' : 'Your report preview'}</h3><p>{current ? 'Saved to your local reading history' : 'A glimpse of what you will receive'}</p></div>{current && <button className="icon-button" onClick={exportReport} title="Export report"><Download size={16}/></button>}</div>
            {current ? <div className="report-content"><div className="report-kicker"><span className="report-spark"><Sparkles size={14}/></span> PERSONAL REFLECTION REPORT <span className="report-line"/></div><h2>{current.title}</h2><div className="report-meta">{(current.readingType === 'HOROSCOPE' || current.readingType === 'COMBINED') && <>Prepared for <strong>{current.name}</strong><span>·</span></>}{new Date(current.createdAt).toLocaleDateString()}</div>{current.zodiacSign && current.zodiacSign !== 'Not provided' && <div className="zodiac-chip"><Sun size={17}/><span><small>SUN SIGN</small><strong>{current.zodiacSign}</strong></span></div>}<p className="report-summary">{current.summary}</p><div className="insight-list">{current.insights.map((i, idx) => <div className="insight-item" key={`${i.area}-${idx}`}><div className="insight-number">0{idx + 1}</div><div><span className="insight-area">{i.area}{i.confidence !== 'Not applicable' && <small>{i.confidence}</small>}</span><h4>{i.headline}</h4><p>{i.detail}</p></div></div>)}</div><div className="recommendation-box"><div className="recommendation-title"><Heart size={15}/> TAKE THIS WITH YOU</div>{current.recommendations.map((r, i) => <p key={i}><span>✦</span>{r}</p>)}</div><div className="mode-label"><span className="live-dot"/> {current.mode.replaceAll('_', ' ')} <span>·</span> Saved in MongoDB</div></div> : <div className="preview-empty"><div className="preview-illustration"><div className="preview-orbit"/><div className="preview-moon"><MoonStar size={37} strokeWidth={1.2}/></div><span className="preview-star ps1">✧</span><span className="preview-star ps2">✦</span><span className="preview-star ps3">✧</span><div className="preview-arc"/></div><h3>Your story starts here</h3><p>Choose a reading type and add your details. Your report will appear here and be saved to your local history.</p><div className="preview-checks"><span><Check size={14}/> Personalized report</span><span><Check size={14}/> Saved reading history</span><span><Check size={14}/> Downloadable summary</span></div><div className="preview-disclaimer"><CircleHelp size={15}/><p>Astrology and palmistry are traditional belief systems, not scientifically validated methods for predicting personality or future events.</p></div></div>}
          </section>
        </div>

        <section id="history" className="history-section"><div className="history-heading"><div><div className="eyebrow muted-eyebrow">YOUR JOURNEY</div><h2>Recent readings <span className="count-pill">{history.length}</span></h2></div><button className="text-button" onClick={() => void refreshHistory()}><Activity size={15}/> Refresh history</button></div>{history.length === 0 ? <div className="history-empty"><FileClock size={21}/><div><strong>No readings yet</strong><p>Your saved reports will appear here after your first reading.</p></div></div> : <div className="history-list">{history.map((r) => { const t = types.find(x => x.id === r.readingType); const Icon = t?.icon || BookOpen; return <div className="history-row" key={r.id}><div className="history-type-icon"><Icon size={18}/></div><div className="history-info"><strong>{r.title}</strong><small>{r.name} · {r.readingType.toLowerCase()} · {new Date(r.createdAt).toLocaleString()}</small></div>{r.zodiacSign && r.zodiacSign !== 'Not provided' && <span className="history-zodiac">{r.zodiacSign}</span>}<button className="history-open" onClick={() => void openReading(r.id)}>Open <ArrowDownRight size={14}/></button><button className="icon-button danger-hover" onClick={() => void removeReading(r.id)} title="Delete report"><Trash2 size={15}/></button></div> })}</div>}</section>
        <footer className="footer"><div className="footer-brand"><Stars size={15}/> astrovision.ai</div><span>Made for reflection, not prediction.</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button></footer>
      </div>
    </main>
  </div>
}
export default App
