import { type VideoSubtitle } from './player-machine'

export function CaptionTrack({
  src,
  srcLang,
  label,
  kind = 'subtitles',
  default: isDefault,
}: VideoSubtitle) {
  return (
    <track
      kind={kind}
      src={src}
      srcLang={srcLang}
      label={label}
      default={isDefault}
    />
  )
}
