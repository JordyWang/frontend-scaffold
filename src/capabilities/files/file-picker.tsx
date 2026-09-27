import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import {
  validateFile,
  type FileValidationResult,
  type FileValidationRules,
} from './validation'

export type FilePickerProps = {
  label?: string
  description?: string
  rules?: FileValidationRules
  multiple?: boolean
  disabled?: boolean
  onFiles: (files: File[]) => void
  onRejected?: (results: FileValidationResult[]) => void
  className?: string
}

type InternalProps = FilePickerProps & { dropzone?: boolean }

export function FilePicker({
  label = '选择文件',
  description,
  rules = {},
  multiple = false,
  disabled,
  onFiles,
  onRejected,
  className,
  dropzone = false,
}: InternalProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const validationRef = useRef<AbortController | null>(null)
  const [checking, setChecking] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(
    () => () => {
      validationRef.current?.abort()
      validationRef.current = null
    },
    [],
  )

  async function processFiles(incoming: FileList | File[]) {
    if (disabled || checking) return
    const files = Array.from(incoming).slice(0, multiple ? undefined : 1)
    if (files.length === 0) return
    validationRef.current?.abort()
    const controller = new AbortController()
    validationRef.current = controller
    setChecking(true)
    try {
      const results = await Promise.all(
        files.map((file) => validateFile(file, rules, controller.signal)),
      )
      if (controller.signal.aborted) return
      const accepted = results
        .filter((result) => result.valid)
        .map((result) => result.file)
      const rejected = results.filter((result) => !result.valid)
      if (accepted.length) onFiles(accepted)
      if (rejected.length) onRejected?.(rejected)
    } catch (error) {
      if (!controller.signal.aborted) throw error
    } finally {
      if (validationRef.current === controller) {
        validationRef.current = null
        setChecking(false)
      }
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void processFiles(event.target.files)
    event.target.value = ''
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (!dropzone || disabled || checking) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    if (!dropzone) return
    event.preventDefault()
    setDragging(false)
    if (!disabled && !checking) void processFiles(event.dataTransfer.files)
  }

  return (
    <div
      className={cn(
        dropzone ? 'ui-file-dropzone' : 'ui-file-picker',
        dragging && 'ui-file-dropzone--dragging',
        className,
      )}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      aria-busy={checking || undefined}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        hidden
        accept={rules.accept?.join(',')}
        multiple={multiple}
        disabled={disabled || checking}
        onChange={onInputChange}
      />
      <Button
        variant="outline"
        disabled={disabled}
        loading={checking}
        onClick={() => inputRef.current?.click()}
      >
        {checking ? '正在校验…' : label}
      </Button>
      {dropzone && <p className="ui-file-dropzone__hint">或将文件拖放到这里</p>}
      {description && <p className="ui-file-dropzone__hint">{description}</p>}
    </div>
  )
}

export function FileDropzone(props: FilePickerProps) {
  return (
    <FilePicker {...props} label={props.label ?? '选择或拖放文件'} dropzone />
  )
}
