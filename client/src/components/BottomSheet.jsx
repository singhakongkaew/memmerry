import { useEffect, useRef, useState } from 'react'

export default function BottomSheet({ open, onClose, title = 'Quick menu', children }) {
  const [closing, setClosing] = useState(false)
  const [dragX, setDragX] = useState(0)
  const startX = useRef(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => { if (event.key === 'Escape') closeSheet() }
    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => sheetRef.current?.focus())
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeyDown) }
  }, [open])

  function closeSheet(afterClose) {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => { setClosing(false); setDragX(0); onClose(); afterClose?.() }, 240)
  }

  function handleTouchStart(event) { startX.current = event.touches[0].clientX }
  function handleTouchMove(event) {
    if (startX.current === null) return
    const distance = event.touches[0].clientX - startX.current
    if (distance > 0) { event.preventDefault(); setDragX(distance) }
  }
  function handleTouchEnd() {
    if (dragX > 80) closeSheet()
    else setDragX(0)
    startX.current = null
  }

  if (!open && !closing) return null
  return <div className={`sheet-layer ${closing ? 'is-closing' : ''}`} role="presentation">
    <button className="sheet-backdrop" aria-label="Close menu" onClick={() => closeSheet()} />
    <section ref={sheetRef} className="bottom-sheet" style={dragX ? { transform: `translateX(${dragX}px)` } : undefined} role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabIndex="-1" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-heading"><h2 id="sheet-title">{title}</h2><button className="sheet-close" onClick={() => closeSheet()} aria-label="Close menu">×</button></div>
      {children(closeSheet)}
    </section>
  </div>
}
