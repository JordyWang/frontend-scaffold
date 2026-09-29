export function ThinkingIndicator() {
  return (
    <span
      className="inline-flex min-h-6 items-center gap-1"
      role="status"
      aria-label="AI 正在思考"
    >
      <span
        className="size-[0.4rem] rounded-full bg-current motion-safe:animate-bounce motion-reduce:opacity-70"
        aria-hidden="true"
      />
      <span
        className="size-[0.4rem] rounded-full bg-current motion-safe:animate-bounce motion-reduce:opacity-70 [animation-delay:120ms]"
        aria-hidden="true"
      />
      <span
        className="size-[0.4rem] rounded-full bg-current motion-safe:animate-bounce motion-reduce:opacity-70 [animation-delay:240ms]"
        aria-hidden="true"
      />
      <span className="sr-only">AI 正在思考</span>
    </span>
  )
}
