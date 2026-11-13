import type { KeyboardEvent } from 'react'

export function trapDialogTab(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return

  const dialog = event.currentTarget.querySelector<HTMLElement>('[role="dialog"]')
  if (!dialog) return

  const focusable = dialog.querySelectorAll<HTMLElement>(
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )
  const first = focusable.item(0)
  const last = focusable.item(focusable.length - 1)

  if (!first || !last) {
    event.preventDefault()
    dialog.focus()
    return
  }

  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    first.focus()
  }
}
