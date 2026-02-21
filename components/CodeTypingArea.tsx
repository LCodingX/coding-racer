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
  const [charIndex, setCharIndex] = useState(0);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Reset state when code changes
  useEffect(() => {
    setCharIndex(0);
    setErrorIndex(null);
    setErrorCount(0);
    setCorrectChars(0);
    setStartTime(null);
  }, [code]);

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [charIndex]);

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, [code, disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

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

      if (!startTime) {
        setStartTime(Date.now());
      }

      if (e.key === "Backspace") {
        if (errorIndex !== null) {
          // Move back within error zone
          if (charIndex > errorIndex) {
            setCharIndex((prev) => prev - 1);
          } else {
            // Back at error origin, clear error state
            setErrorIndex(null);
          }
        }
        return;
      }

      // Don't advance if in error state (except backspace above)
      if (errorIndex !== null) {
        // Accumulate error — move forward in error zone
        if (charIndex < code.length) {
          setCharIndex((prev) => prev + 1);
        }
        return;
      }

      // Tab handling
      if (e.key === "Tab") {
        // Try to match upcoming spaces (code often uses 2 or 4 space indentation)
        const upcoming = code.slice(charIndex, charIndex + 4);
        const spaces = upcoming.match(/^ +/)?.[0].length || 0;
        if (spaces > 0) {
          setCorrectChars((prev) => prev + spaces);
          setCharIndex((prev) => prev + spaces);
          return;
        }
      }

      // Enter handling — match newline
      if (e.key === "Enter") {
        if (code[charIndex] === "\n") {
          setCorrectChars((prev) => prev + 1);
          const nextIndex = charIndex + 1;
          // Auto-skip leading whitespace on the next line
          let skipTo = nextIndex;
          while (skipTo < code.length && (code[skipTo] === " " || code[skipTo] === "\t")) {
            skipTo++;
          }
          setCorrectChars((prev) => prev + (skipTo - nextIndex));
          setCharIndex(skipTo);
        } else {
          setErrorIndex(charIndex);
          setErrorCount((prev) => prev + 1);
          setCharIndex((prev) => prev + 1);
        }
        return;
      }

      // Normal character
      if (e.key.length === 1) {
        if (charIndex >= code.length) return;

        if (e.key === code[charIndex]) {
          setCorrectChars((prev) => prev + 1);
          const newIndex = charIndex + 1;
          setCharIndex(newIndex);

          if (newIndex >= code.length) {
            const elapsed = (Date.now() - (startTime || Date.now())) / 60000;
            const cpm = elapsed > 0 ? Math.round((correctChars + 1) / elapsed) : 0;
            const accuracy =
              correctChars + 1 + errorCount > 0
                ? Math.round(((correctChars + 1) / (correctChars + 1 + errorCount)) * 100)
                : 100;
            onProgress({
              charIndex: newIndex,
              correctChars: correctChars + 1,
              totalChars: code.length,
              errors: errorCount,
              cpm,
              accuracy,
            });
            onComplete();
          }
        } else {
          setErrorIndex(charIndex);
          setErrorCount((prev) => prev + 1);
          setCharIndex((prev) => prev + 1);
        }
      }
    },
    [charIndex, code, correctChars, disabled, errorCount, errorIndex, onComplete, onProgress, startTime]
  );

  // Throttled progress reporting
  const lastReportRef = useRef(0);
  useEffect(() => {
    if (!startTime || disabled) return;
    const now = Date.now();
    if (now - lastReportRef.current < 200) return;
    lastReportRef.current = now;

    const elapsed = (now - startTime) / 60000;
    const cpm = elapsed > 0 ? Math.round(correctChars / elapsed) : 0;
    const total = correctChars + errorCount;
    const accuracy = total > 0 ? Math.round((correctChars / total) * 100) : 100;

    onProgress({
      charIndex,
      correctChars,
      totalChars: code.length,
      errors: errorCount,
      cpm,
      accuracy,
    });
  }, [charIndex, code.length, correctChars, disabled, errorCount, onProgress, startTime]);

  const renderCode = () => {
    const chars = code.split("");
    return chars.map((char, i) => {
      let className = "text-editor-comment"; // untyped
      const isCursor = i === charIndex && !disabled;

      if (errorIndex !== null && i >= errorIndex && i < charIndex) {
        // Error zone
        className = "bg-red-900/50 text-red-400";
      } else if (i < charIndex) {
        // Correctly typed
        className = "text-teal";
      }

      const displayChar = char === "\n" ? "\u21B5\n" : char === " " ? "\u00B7" : char;

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
          {charIndex}/{code.length} chars
        </span>
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="bg-editor-bg border border-navy-light rounded-b-lg p-4 font-mono text-sm leading-6 whitespace-pre-wrap outline-none focus:ring-2 focus:ring-orange/50 overflow-y-auto max-h-[60vh] cursor-text"
      >
        {renderCode()}
      </div>
    </div>
  );
}
