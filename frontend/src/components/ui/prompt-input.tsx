"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
// Context
/* ------------------------------------------------------------------ */

interface PromptInputContextType {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
}

const PromptInputContext = React.createContext<PromptInputContextType | undefined>(undefined)

function usePromptInput() {
  const context = React.useContext(PromptInputContext)
  if (!context) {
    throw new Error("PromptInput sub‑components must be used inside <PromptInput>")
  }
  return context
}

/* ------------------------------------------------------------------ */
// PromptInput
/* ------------------------------------------------------------------ */

export type PromptInputProps = {
  value?: string
  onValueChange?: (value: string) => void
  onSubmit?: () => void
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

function PromptInput({
  value: controlledValue,
  onValueChange,
  onSubmit,
  className,
  children,
  disabled = false,
}: PromptInputProps) {
  const [internalValue, setInternalValue] = React.useState("")

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  const setter = isControlled ? onValueChange! : setInternalValue

  const handleSubmit = React.useCallback(() => {
    if (!disabled) onSubmit?.()
  }, [disabled, onSubmit])

  return (
    <PromptInputContext.Provider
      value={{
        value,
        onValueChange: setter,
        onSubmit: handleSubmit,
        disabled,
      }}
    >
      <div className={cn("flex flex-col", className)}>{children}</div>
    </PromptInputContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
// PromptInputTextarea
/* ------------------------------------------------------------------ */

export type PromptInputTextareaProps = {
  placeholder?: string
  className?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>

function PromptInputTextarea({
  placeholder,
  className,
  ...props
}: PromptInputTextareaProps) {
  const { value, onValueChange, onSubmit, disabled } = usePromptInput()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
    props.onKeyDown?.(e)
  }

  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        "w-full resize-none border-0 bg-transparent p-3 text-sm shadow-none outline-none placeholder:text-muted-foreground",
        className
      )}
      rows={2}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
// PromptInputActions
/* ------------------------------------------------------------------ */

export type PromptInputActionsProps = {
  className?: string
  children: React.ReactNode
}

function PromptInputActions({ className, children }: PromptInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  )
}

export { PromptInput, PromptInputTextarea, PromptInputActions }
