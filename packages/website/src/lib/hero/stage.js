// Shared plumbing for hero variants: one anime.js timeline per variant, started once fonts are in (text is measured and
// typed), seekable, holding its last frame. Procedural bits derive from the timeline's current time via onUpdate.
import { createTimeline, createTimer } from 'animejs'

export const hash = n => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (a, b, t) => a + (b - a) * t
export const out3 = p => 1 - (1 - p) ** 3
export const io3 = p => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)
/** Eased progress of `now` through [start, start + dur]. */
export const span = (now, start, dur, ease = out3) => ease(clamp01((now - start) / dur))
/** `text` as typed from `start`, one character every `per` ms. */
export const typeOut = (text, now, start, per = 45) => text.slice(0, Math.max(0, Math.floor((now - start) / per)))
/** When typeOut(text, …, start, per) finishes. */
export const typedAt = (text, start, per = 45) => start + text.length * per
export const fmt = (n, digits = 0) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/**
 * Builds and runs a variant's timeline. `build(tl, { one, all })` adds tweens and returns the end time.
 * Returns the cleanup for onMount.
 */
export function play(root, build, { still = false, onend, onUpdate, onReady } = {}) {
  let tl
  let gone = false
  document.fonts.ready.then(() => {
    if (gone) return
    tl = createTimeline({
      autoplay: false,
      defaults: { ease: 'outCubic', duration: 400 },
      onUpdate: self => onUpdate?.(self.currentTime),
      onComplete: () => onend?.(),
    })
    const one = sel => root.querySelector(sel)
    const all = sel => [...root.querySelectorAll(sel)]
    const end = build(tl, { one, all })
    tl.call(() => {}, end)
    onReady?.()
    if (still) {
      tl.seek(end)
      onUpdate?.(end)
      onend?.()
    } else tl.play()
  })
  return () => {
    gone = true
    tl?.revert()
  }
}

/**
 * For looping variants: a clock that never ends. Calls onUpdate(ms) every frame; with `still`, renders `at` once.
 * Returns the cleanup for onMount.
 */
export function loop(onUpdate, { still = false, at = 6000, onReady } = {}) {
  let timer
  let gone = false
  document.fonts.ready.then(() => {
    if (gone) return
    onReady?.()
    if (still) return onUpdate(at)
    timer = createTimer({ duration: 1e9, onUpdate: self => onUpdate(self.currentTime) })
  })
  return () => {
    gone = true
    timer?.revert()
  }
}
