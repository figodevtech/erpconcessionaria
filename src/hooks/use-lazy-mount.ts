"use client"

import { useState } from "react"

/**
 * Defers mounting a heavy dialog until the first time it is opened.
 *
 * Paired with `next/dynamic`, this keeps large dialog trees out of the chunks a
 * module downloads and evaluates just to render its list. Once opened the
 * component stays mounted so closing animations and internal state behave as
 * before.
 */
export function useLazyMount(open: boolean): boolean {
  const [everOpened, setEverOpened] = useState(open)

  // Adjusting state during render (instead of in an effect) keeps the dialog
  // available on the very same render that opens it, with no extra frame.
  if (open && !everOpened) {
    setEverOpened(true)
  }

  return everOpened || open
}
