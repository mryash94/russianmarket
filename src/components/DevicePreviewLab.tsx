import { useEffect, useMemo, useState } from 'react'
import { Icon } from './Icon'

type Preset = {
  id: string
  label: string
  width: number
  height: number
  island?: boolean
}

const presets: Preset[] = [
  { id: 'iphone-18-pro', label: 'iPhone 18 Pro — Concept Preview', width: 402, height: 874, island: true },
  { id: 'iphone-18-pro-max', label: 'iPhone 18 Pro Max — Concept Preview', width: 440, height: 956, island: true },
  { id: 'iphone-18', label: 'iPhone 18 — Custom Preset', width: 402, height: 874, island: true },
  { id: 'iphone-17-pro', label: 'iPhone 17 Pro', width: 402, height: 874, island: true },
  { id: 'iphone-17-pro-max', label: 'iPhone 17 Pro Max', width: 440, height: 956, island: true },
  { id: 'iphone-16-pro', label: 'iPhone 16 Pro', width: 402, height: 874, island: true },
  { id: 'iphone-16-pro-max', label: 'iPhone 16 Pro Max', width: 440, height: 956, island: true },
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667 },
  { id: 'pixel-8', label: 'Pixel 8', width: 412, height: 915 },
  { id: 'pixel-9', label: 'Pixel 9', width: 412, height: 915 },
  { id: 'samsung-galaxy-s', label: 'Samsung Galaxy S series', width: 384, height: 854 },
  { id: 'ipad-mini', label: 'iPad Mini', width: 768, height: 1024 },
  { id: 'ipad-pro', label: 'iPad Pro', width: 1024, height: 1366 },
]

export function DevicePreviewLab() {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(presets[0].id)
  const [custom, setCustom] = useState(false)
  const [customWidth, setCustomWidth] = useState(390)
  const [customHeight, setCustomHeight] = useState(844)
  const [islandExpanded, setIslandExpanded] = useState(false)

  const selectedPreset = presets.find((preset) => preset.id === selectedId) ?? presets[0]
  const width = custom ? customWidth : selectedPreset.width
  const height = custom ? customHeight : selectedPreset.height
  const showIsland = !custom && Boolean(selectedPreset.island)
  const previewUrl = useMemo(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('bxDevicePreview', '1')
    if (showIsland) url.searchParams.set('bxDynamicIsland', '1')
    else url.searchParams.delete('bxDynamicIsland')
    return `${url.pathname}${url.search}`
  }, [showIsland])

  useEffect(() => {
    if (!open) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="topbar-icon-button device-preview-trigger"
        aria-label="Open device preview lab"
        onClick={() => setOpen(true)}
      >
        <Icon name="monitor-smartphone" size={18} strokeWidth={1.7} aria-hidden="true" />
      </button>
      {open && (
        <div className="device-preview-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}>
          <section className="device-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="device-preview-title">
            <header className="device-preview-heading">
              <div>
                <span className="section-kicker">RESPONSIVE PREVIEW</span>
                <h2 id="device-preview-title">Device lab</h2>
                <p>Viewport presets are CSS preview dimensions, not verified hardware specifications.</p>
              </div>
              <button type="button" className="dialog-close" aria-label="Close device preview" onClick={() => setOpen(false)}>
                <Icon name="x" size={18} />
              </button>
            </header>
            <div className="device-preview-controls">
              <label>
                <span>Device preset</span>
                <select
                  value={custom ? 'custom' : selectedId}
                  onChange={(event) => {
                    if (event.target.value === 'custom') {
                      setCustom(true)
                      return
                    }
                    setCustom(false)
                    setSelectedId(event.target.value)
                    setIslandExpanded(false)
                  }}
                >
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Custom viewport</option>
                </select>
              </label>
              {custom ? (
                <div className="custom-viewport-fields">
                  <label>
                    <span>Width (px)</span>
                    <input type="number" min="320" max="1600" value={customWidth} onChange={(event) => setCustomWidth(Math.min(1600, Math.max(320, Number(event.target.value) || 320)))} />
                  </label>
                  <label>
                    <span>Height (px)</span>
                    <input type="number" min="480" max="2000" value={customHeight} onChange={(event) => setCustomHeight(Math.min(2000, Math.max(480, Number(event.target.value) || 480)))} />
                  </label>
                </div>
              ) : (
                <p className="device-preview-dimensions">CSS viewport · {width} × {height}</p>
              )}
            </div>
            <div className="device-preview-stage">
              <div className={`device-preview-frame${width < 500 ? ' device-preview-frame--phone' : ' device-preview-frame--tablet'}`} style={{ width, height }}>
                <iframe title={`BLACK X preview at ${width} by ${height} CSS pixels`} src={previewUrl} />
                {showIsland && (
                  <button
                    type="button"
                    className={`dynamic-island${islandExpanded ? ' is-expanded' : ''}`}
                    aria-label={`Dynamic Island browser simulation${islandExpanded ? ', expanded' : ''}`}
                    aria-expanded={islandExpanded}
                    onClick={() => setIslandExpanded((value) => !value)}
                  >
                    <span className="dynamic-island-sensor" aria-hidden="true" />
                    {islandExpanded && <span className="dynamic-island-label">Browser preview simulation</span>}
                  </button>
                )}
              </div>
            </div>
            <p className="device-preview-disclaimer">
              {showIsland
                ? 'Dynamic Island is a CSS-only visual simulation in this preview; it is not native iOS functionality.'
                : 'The site runs in an isolated frame; changing this preview does not resize the application window.'}
            </p>
          </section>
        </div>
      )}
    </>
  )
}
