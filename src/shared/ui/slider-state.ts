export type SliderScale = {
  min: number
  max: number
  step: number | null
  marks: number[]
}

const clean = (value: number) => Number(value.toPrecision(15)) || 0
const close = (left: number, right: number) =>
  Math.abs(left - right) <=
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right)) *
    Number.EPSILON *
    32

export function createSliderScale(
  min = 0,
  max = 100,
  step: number | null = 1,
  marks: number[] = [],
): SliderScale {
  const lower = Number.isFinite(min) ? min : 0
  const upper = Number.isFinite(max) ? Math.max(lower, max) : lower
  const safeUpper = Number.isFinite(upper - lower) ? upper : lower
  return {
    min: lower,
    max: safeUpper,
    step: step === null ? null : Number.isFinite(step) && step > 0 ? step : 1,
    marks: [...new Set(marks)]
      .filter(
        (value) =>
          Number.isFinite(value) && value >= lower && value <= safeUpper,
      )
      .sort((left, right) => left - right),
  }
}

function nearest(values: number[], desired: number) {
  return values.reduce((best, value) => {
    const distance = Math.abs(value - desired)
    const bestDistance = Math.abs(best - desired)
    return distance < bestDistance ||
      (close(distance, bestDistance) && value < best)
      ? value
      : best
  })
}

export function snapSliderValue(raw: number, scale: SliderScale) {
  const { min, max, step, marks } = scale
  const value = Number.isFinite(raw) ? Math.max(min, Math.min(max, raw)) : min
  const candidates = [min, max, ...marks]
  if (step !== null) {
    const index = (value - min) / step
    for (const tick of [Math.floor(index), Math.ceil(index)]) {
      const candidate = clean(min + tick * step)
      if (Number.isFinite(candidate) && candidate >= min && candidate <= max)
        candidates.push(candidate)
    }
  }
  return nearest(candidates, value)
}

export function normalizeSliderValues(
  raw: number | number[] | undefined,
  range: boolean,
  scale: SliderScale,
) {
  const values = range
    ? Array.isArray(raw) && raw.length >= 2
      ? raw
      : [scale.min, scale.min]
    : [typeof raw === 'number' ? raw : scale.min]
  return values
    .map((value) => snapSliderValue(value, scale))
    .sort((a, b) => a - b)
}

export function nextSliderValue(
  value: number,
  offset: number,
  scale: SliderScale,
  min = scale.min,
  max = scale.max,
) {
  let next = value
  const direction = Math.sign(offset)
  for (let count = 0; count < Math.abs(offset); count++) {
    const candidates = [scale.min, scale.max, ...scale.marks]
    if (scale.step !== null) {
      const index = (next - scale.min) / scale.step
      const tick =
        direction > 0
          ? Math.floor(index + 1e-10) + 1
          : Math.ceil(index - 1e-10) - 1
      candidates.push(clean(scale.min + tick * scale.step))
    }
    const available = candidates.filter(
      (candidate) =>
        candidate >= min &&
        candidate <= max &&
        (direction > 0
          ? candidate > next && !close(candidate, next)
          : candidate < next && !close(candidate, next)),
    )
    if (!available.length) break
    next = direction > 0 ? Math.min(...available) : Math.max(...available)
  }
  return next
}

export function moveSliderThumb(
  values: number[],
  index: number,
  desired: number,
  scale: SliderScale,
) {
  const next = [...values]
  const min = values[index - 1] ?? scale.min
  const max = values[index + 1] ?? scale.max
  next[index] = Math.max(min, Math.min(max, snapSliderValue(desired, scale)))
  return next
}

/** Shift only to offsets for which every handle is still on a selectable value. */
export function shiftSliderRange(
  values: number[],
  rawOffset: number,
  scale: SliderScale,
) {
  const lower = scale.min - values[0]
  const upper = scale.max - values[values.length - 1]
  const desired = Math.max(lower, Math.min(upper, rawOffset))
  const offsets = [0, lower, upper]
  for (const value of values)
    for (const candidate of [scale.min, scale.max, ...scale.marks])
      offsets.push(clean(candidate - value))
  if (scale.step !== null) {
    const index = (values[0] + desired - scale.min) / scale.step
    for (const tick of [Math.floor(index), Math.ceil(index)])
      offsets.push(clean(scale.min + tick * scale.step - values[0]))
  }
  const available = offsets.filter(
    (offset) =>
      offset >= lower &&
      offset <= upper &&
      values.every((value) =>
        close(
          snapSliderValue(clean(value + offset), scale),
          clean(value + offset),
        ),
      ),
  )
  const offset = nearest(available, desired)
  return values.map((value) => clean(value + offset))
}

export function sliderCoordinateReversed(
  orientation: 'horizontal' | 'vertical',
  reverse: boolean,
  direction: 'ltr' | 'rtl',
) {
  return orientation === 'horizontal'
    ? (direction === 'rtl') !== reverse
    : !reverse
}

export function sliderPercent(
  value: number,
  scale: SliderScale,
  reversed: boolean,
) {
  const ratio =
    scale.max === scale.min ? 0 : (value - scale.min) / (scale.max - scale.min)
  return (reversed ? 1 - ratio : ratio) * 100
}

/** Decorative dots are sampled for very dense scales; value snapping is unchanged. */
export function sliderDots(scale: SliderScale, dots: boolean) {
  if (!dots && !scale.marks.length) return []
  const values = [scale.min, scale.max, ...scale.marks]
  if (dots && scale.step !== null) {
    const count = Math.floor((scale.max - scale.min) / scale.step)
    const stride = Math.max(1, Math.ceil(count / 500))
    if (Number.isFinite(count))
      for (let tick = 0; tick <= count; tick += stride)
        values.push(clean(scale.min + tick * scale.step))
  }
  return [...new Set(values)].sort((a, b) => a - b)
}

export function sameSliderValues(left: number[], right: number[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}
