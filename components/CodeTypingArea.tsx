"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CodeTypingAreaProps {
  code: string;
  filename: string;
  onProgress: (data: {
    charIndex: number;
    correctChars: number;
    totalChars: number;
    errors: number;
    cpm: number;
    accuracy: number;
  }) => void;
  onComplete: () => void;
  disabled?: boolean;
}

export default function CodeTypingArea({
  code,
  filename,
  onProgress,
  onComplete,
  disabled = false,
}: CodeTypingAreaProps) {
  // Use refs as source of truth for typing state to avoid stale closures
  const charIndexRef = useRef(0);
  const errorIndexRef = useRef<number | null>(null);
  const errorCountRef = useRef(0);
  const correctCharsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // State only for triggering re-renders
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  // Reset state when code changes
  useEffect(() => {
    charIndexRef.current = 0;
    errorIndexRef.current = null;
    errorCountRef.current = 0;
    correctCharsRef.current = 0;
    startTimeRef.current = null;
    completedRef.current = false;
    rerender();
  }, [code]);

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, [code, disabled]);

  const reportProgress = useCallback(() => {
    const st = startTimeRef.current;
    if (!st) return;
    const elapsed = (Date.now() - st) / 60000;
    const cc = correctCharsRef.current;
    const ec = errorCountRef.current;
    const cpm = elapsed > 0 ? Math.round(cc / elapsed) : 0;
    const total = cc + ec;
    const accuracy = total > 0 ? Math.round((cc / total) * 100) : 100;

    onProgressRef.current({
      charIndex: charIndexRef.current,
      correctChars: cc,
      totalChars: code.length,
      errors: ec,
      cpm,
      accuracy,
    });
  }, [code.length]);

  // Throttled progress reporting
  const lastReportRef = useRef(0);
  useEffect(() => {
    if (!startTimeRef.current || disabled) return;
    const now = Date.now();
    if (now - lastReportRef.current < 200) return;
    lastReportRef.current = now;
    reportProgress();
  });

  const checkComplete = useCallback(() => {
    if (charIndexRef.current >= code.length && !completedRef.current) {
      completedRef.current = true;
      console.log("[CodeTypingArea] File complete! charIndex:", charIndexRef.current, "code.length:", code.length);
      reportProgress();
      onCompleteRef.current();
    }
  }, [code.length, reportProgress]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || completedRef.current) return;

      // Ignore modifier keys alone
      if (
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key === "CapsLock"
      ) {
        return;
      }

      e.preventDefault();

      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      const ci = charIndexRef.current;
      const ei = errorIndexRef.current;

      if (e.key === "Backspace") {
        if (ei !== null && ci > ei) {
          charIndexRef.current = ci - 1;
          if (ci - 1 === ei) {
            errorIndexRef.current = null;
          }
        }
        rerender();
        return;
      }

      // In error state — accumulate errors, only backspace can fix
      if (ei !== null) {
        if (ci < code.length) {
          charIndexRef.current = ci + 1;
        }
        rerender();
        return;
      }

      // Tab handling
      if (e.key === "Tab") {
        const upcoming = code.slice(ci, ci + 4);
        const spaces = upcoming.match(/^ +/)?.[0].length || 0;
        if (spaces > 0) {
          correctCharsRef.current += spaces;
          charIndexRef.current = ci + spaces;
          checkComplete();
          rerender();
          return;
        }
      }

      // Enter handling — match newline
      if (e.key === "Enter") {
        if (code[ci] === "\n") {
          correctCharsRef.current += 1;
          let skipTo = ci + 1;
          while (skipTo < code.length && (code[skipTo] === " " || code[skipTo] === "\t")) {
            skipTo++;
          }
          correctCharsRef.current += skipTo - (ci + 1);
          charIndexRef.current = skipTo;
          checkComplete();
        } else {
          errorIndexRef.current = ci;
          errorCountRef.current += 1;
          charIndexRef.current = ci + 1;
        }
        rerender();
        return;
      }

      // Normal character
      if (e.key.length === 1) {
        if (ci >= code.length) return;

        if (e.key === code[ci]) {
          correctCharsRef.current += 1;
          charIndexRef.current = ci + 1;
          checkComplete();
        } else {
          errorIndexRef.current = ci;
          errorCountRef.current += 1;
          charIndexRef.current = ci + 1;
        }
        rerender();
      }
    },
    [code, disabled, reportProgress, checkComplete]
  );

  const isLeadingWhitespace = (index: number): boolean => {
    if (code[index] !== " " && code[index] !== "\t") return false;
    for (let j = index - 1; j >= 0; j--) {
      if (code[j] === "\n") return true;
      if (code[j] !== " " && code[j] !== "\t") return false;
    }
    return true;
  };

  const renderCode = () => {
    const ci = charIndexRef.current;
    const ei = errorIndexRef.current;
    const chars = code.split("");
    return chars.map((char, i) => {
      let className = "text-editor-comment"; // untyped
      const isCursor = i === ci && !disabled;

      if (ei !== null && i >= ei && i < ci) {
        className = "bg-red-900/50 text-red-400";
      } else if (i < ci) {
        className = "text-teal";
      }

      const displayChar =
        char === "\n"
          ? "\u21B5\n"
          : char === " "
          ? isLeadingWhitespace(i)
            ? "\u00B7"
            : " "
          : char;

      return (
        <span
          key={i}
          ref={isCursor ? cursorRef : undefined}
          className={`${className} ${
            isCursor ? "border-l-2 border-orange animate-pulse" : ""
          }`}
        >
          {displayChar}
        </span>
      );
    });
  };

  return (
    <div className="w-full">
      <div className="bg-navy/50 px-4 py-2 rounded-t-lg flex items-center justify-between">
        <span className="text-sm text-editor-comment">{filename}</span>
        <span className="text-xs text-editor-comment">
          {charIndexRef.current}/{code.length} chars
        </span>
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ fontVariantLigatures: "none" }}
        className="bg-editor-bg border border-navy-light rounded-b-lg p-4 font-mono text-sm leading-6 whitespace-pre-wrap outline-none focus:ring-2 focus:ring-orange/50 overflow-y-auto max-h-[60vh] cursor-text"
      >
        {renderCode()}
      </div>
    </div>
  );
}
