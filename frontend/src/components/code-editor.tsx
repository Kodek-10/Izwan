import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/lib/editor-preferences";

type CodeEditorProps = {
  id?: string;
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
  minRows?: number;
  className?: string;
};

export function CodeEditor({
  id,
  value,
  onChange,
  language = "text",
  placeholder,
  readOnly = false,
  minRows = 12,
  className,
}: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { fontSize, tabSize, ligatures } = useEditorPreferences();
  // Numéros de ligne et code doivent partager fontSize/lineHeight pour rester alignés.
  const typography = {
    fontSize: `${fontSize}px`,
    lineHeight: `${Math.round(fontSize * 1.7)}px`,
    fontVariantLigatures: ligatures ? "normal" : ("none" as const),
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLPreElement>(null);
  const lineCount = Math.max(1, value.split("\n").length);
  const metrics = useMemo(
    () => ({
      lines: lineCount,
      chars: value.length,
    }),
    [lineCount, value.length],
  );

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, index) => index + 1).join("\n"),
    [lineCount],
  );

  const miniMapLines = useMemo(() => {
    const lines = value.split("\n");
    if (lines.length <= 80) return lines;
    const step = Math.ceil(lines.length / 80);
    return lines.filter((_, index) => index % step === 0);
  }, [value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-muted/40 shadow-inner",
        isFullscreen && "fixed inset-3 z-50 bg-background shadow-2xl",
        className,
      )}
    >
      <div className="flex h-9 items-center justify-between border-b border-border bg-card/80 px-3">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate font-medium uppercase tracking-wider">{language}</span>
          <span className="tabular-nums">{metrics.lines} lines</span>
          <span className="tabular-nums">{metrics.chars} chars</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsFullscreen((current) => !current)}
          aria-label={isFullscreen ? "Exit fullscreen editor" : "Open fullscreen editor"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <div
        className={cn(
          "grid grid-cols-[auto_1fr] overflow-hidden",
          isFullscreen ? "h-[calc(100vh-5.25rem)]" : "h-[400px]",
        )}
      >
        <pre
          ref={lineNumbersRef}
          aria-hidden="true"
          style={typography}
          className="select-none overflow-hidden h-full border-r border-border bg-background/40 px-2 py-3 text-right font-mono text-muted-foreground"
        >
          {lineNumbers}
        </pre>
        <div className="relative min-w-0">
          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            onScroll={handleScroll}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            style={{ ...typography, tabSize }}
            className={cn(
              "block w-full resize-none overflow-auto bg-transparent py-3 pl-3 pr-3 font-mono outline-none md:pr-24",
              "h-full",
              readOnly && "cursor-default",
            )}
          />
          <pre
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-3 hidden h-[calc(100%-1.5rem)] w-16 overflow-hidden rounded border border-border/60 bg-background/70 p-1 text-[2px] leading-[3px] text-muted-foreground/70 md:block"
          >
            {miniMapLines.join("\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}
