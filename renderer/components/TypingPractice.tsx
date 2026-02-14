'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import CodeDisplay from './CodeDisplay'
import { getPracticeHistory, savePracticeAttempt } from '../lib/storage'
import type { PracticeAttempt } from '../lib/types'

interface TypingPracticeProps {
  templateId: string
  targetCode: string
}

function setTitle(title: string) {
  if (typeof window !== 'undefined' && window.electron?.setWindowTitle) {
    window.electron.setWindowTitle(title)
  }
}

function HistoryChart({ attempts }: { attempts: PracticeAttempt[] }) {
  if (attempts.length === 0) return null

  const cpms = attempts.map((a) => a.cpm)
  const accs = attempts.map((a) => a.accuracy)

  const width = 560
  const height = 220
  const padLeft = 50
  const padRight = 50
  const padTop = 20
  const padBottom = 35
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  // CPM axis (left)
  const cpmMin = Math.max(0, Math.min(...cpms) - 20)
  const cpmMax = Math.max(...cpms, 1) + 20

  // Accuracy axis (right) — 0 to 100
  const accMin = 0
  const accMax = 100

  const xPos = (i: number) =>
    padLeft + (cpms.length === 1 ? chartW / 2 : (i / (cpms.length - 1)) * chartW)

  const cpmPoints = cpms.map((cpm, i) => ({
    x: xPos(i),
    y: padTop + chartH - ((cpm - cpmMin) / (cpmMax - cpmMin)) * chartH,
    val: cpm,
  }))

  const accPoints = accs.map((acc, i) => ({
    x: xPos(i),
    y: padTop + chartH - ((acc - accMin) / (accMax - accMin)) * chartH,
    val: acc,
  }))

  const cpmPath = cpmPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const accPath = accPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Y-axis ticks
  const ticks = 4
  const cpmTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round(cpmMin + (i / ticks) * (cpmMax - cpmMin)))
  const accTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round(accMin + (i / ticks) * (accMax - accMin)))

  return (
    <svg width={width} height={height} className="mx-auto">
      {/* Grid lines */}
      {cpmTicks.map((val) => {
        const y = padTop + chartH - ((val - cpmMin) / (cpmMax - cpmMin)) * chartH
        return <line key={val} x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#f3f4f6" strokeWidth={1} />
      })}

      {/* Axes */}
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#e5e7eb" strokeWidth={1} />
      <line x1={padLeft + chartW} y1={padTop} x2={padLeft + chartW} y2={padTop + chartH} stroke="#e5e7eb" strokeWidth={1} />
      <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#e5e7eb" strokeWidth={1} />

      {/* Left Y-axis labels (CPM) */}
      {cpmTicks.map((val) => {
        const y = padTop + chartH - ((val - cpmMin) / (cpmMax - cpmMin)) * chartH
        return (
          <text key={val} x={padLeft - 8} y={y + 4} textAnchor="end" style={{ fontSize: 10, fill: '#3b82f6' }}>{val}</text>
        )
      })}

      {/* Right Y-axis labels (Accuracy %) */}
      {accTicks.map((val) => {
        const y = padTop + chartH - ((val - accMin) / (accMax - accMin)) * chartH
        return (
          <text key={val} x={padLeft + chartW + 8} y={y + 4} textAnchor="start" style={{ fontSize: 10, fill: '#10b981' }}>{val}%</text>
        )
      })}

      {/* X-axis labels */}
      {cpmPoints.map((p, i) => (
        <text key={i} x={p.x} y={padTop + chartH + 18} textAnchor="middle" style={{ fontSize: 10, fill: '#9ca3af' }}>{i + 1}</text>
      ))}

      {/* Axis titles */}
      <text x={padLeft + chartW / 2} y={height - 2} textAnchor="middle" style={{ fontSize: 11, fill: '#6b7280' }}>Attempt</text>
      <text x={14} y={padTop + chartH / 2} textAnchor="middle" style={{ fontSize: 11, fill: '#3b82f6' }} transform={`rotate(-90 14 ${padTop + chartH / 2})`}>CPM</text>
      <text x={width - 14} y={padTop + chartH / 2} textAnchor="middle" style={{ fontSize: 11, fill: '#10b981' }} transform={`rotate(90 ${width - 14} ${padTop + chartH / 2})`}>Accuracy</text>

      {/* CPM line */}
      {cpmPoints.length > 1 && <path d={cpmPath} fill="none" stroke="#3b82f6" strokeWidth={2} />}
      {cpmPoints.map((p, i) => (
        <circle key={`c${i}`} cx={p.x} cy={p.y} r={3.5} fill="#3b82f6" />
      ))}

      {/* Accuracy line */}
      {accPoints.length > 1 && <path d={accPath} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" />}
      {accPoints.map((p, i) => (
        <circle key={`a${i}`} cx={p.x} cy={p.y} r={3.5} fill="#10b981" />
      ))}

      {/* Legend */}
      <line x1={padLeft + 10} y1={padTop + 6} x2={padLeft + 26} y2={padTop + 6} stroke="#3b82f6" strokeWidth={2} />
      <text x={padLeft + 30} y={padTop + 10} style={{ fontSize: 10, fill: '#3b82f6' }}>CPM</text>
      <line x1={padLeft + 62} y1={padTop + 6} x2={padLeft + 78} y2={padTop + 6} stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" />
      <text x={padLeft + 82} y={padTop + 10} style={{ fontSize: 10, fill: '#10b981' }}>Accuracy</text>
    </svg>
  )
}

export default function TypingPractice({ templateId, targetCode }: TypingPracticeProps) {
  const [typedText, setTypedText] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [errorIndex, setErrorIndex] = useState<number | null>(null)
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0)
  const [totalMeaningfulKeystrokes, setTotalMeaningfulKeystrokes] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  const [allAttempts, setAllAttempts] = useState<PracticeAttempt[]>([])
  const [displayCpm, setDisplayCpm] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Refs for the 1s interval to read latest values without re-creating the interval
  const typedTextRef = useRef('')
  const startTimeRef = useRef<number | null>(null)
  const correctKeystrokesRef = useRef(0)
  const totalMeaningfulKeystrokesRef = useRef(0)

  const isComplete = typedText.length === targetCode.length && errorIndex === null
  const currentIndex = typedText.length

  const accuracy = totalMeaningfulKeystrokes > 0
    ? Math.round((correctKeystrokes / totalMeaningfulKeystrokes) * 100)
    : 100

  // Keep refs in sync
  useEffect(() => { typedTextRef.current = typedText }, [typedText])
  useEffect(() => { startTimeRef.current = startTime }, [startTime])
  useEffect(() => { correctKeystrokesRef.current = correctKeystrokes }, [correctKeystrokes])
  useEffect(() => { totalMeaningfulKeystrokesRef.current = totalMeaningfulKeystrokes }, [totalMeaningfulKeystrokes])

  // Update window title every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      const st = startTimeRef.current
      if (st && !endTime) {
        const elapsed = (Date.now() - st) / 60000
        const cpm = elapsed > 0 ? Math.round(typedTextRef.current.length / elapsed) : 0
        const total = totalMeaningfulKeystrokesRef.current
        const correct = correctKeystrokesRef.current
        const acc = total > 0 ? Math.round((correct / total) * 100) : 100
        setDisplayCpm(cpm)
        setTitle(`Coding Racer | cpm ${cpm} | accuracy ${acc}%`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  // Set default title on mount
  useEffect(() => {
    setTitle('Coding Racer')
    return () => { setTitle('Coding Racer') }
  }, [])

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getPracticeHistory(templateId)
      setAllAttempts(history)
    }
    loadHistory()
  }, [templateId])

  useEffect(() => {
    if (isComplete && !endTime) {
      const now = Date.now()
      setEndTime(now)
      if (startTime) {
        const finalElapsed = (now - startTime) / 60000
        const finalCpm = finalElapsed > 0 ? Math.round(targetCode.length / finalElapsed) : 0
        const finalAcc = totalMeaningfulKeystrokes > 0
          ? Math.round((correctKeystrokes / totalMeaningfulKeystrokes) * 100)
          : 100
        setDisplayCpm(finalCpm)
        setTitle(`Coding Racer | cpm ${finalCpm} | accuracy ${finalAcc}%`)
      }
      const saveAndShow = async () => {
        const finalElapsedMs = startTime ? now - startTime : 0
        const finalElapsedMin = finalElapsedMs / 60000
        const finalCpm = finalElapsedMin > 0 ? Math.round(targetCode.length / finalElapsedMin) : 0
        const finalWpm = finalElapsedMin > 0 ? Math.round((targetCode.length / 5) / finalElapsedMin) : 0
        const finalAccuracy = totalMeaningfulKeystrokes > 0
          ? Math.round((correctKeystrokes / totalMeaningfulKeystrokes) * 100)
          : 100

        const attempt: PracticeAttempt = {
          timestamp: new Date().toISOString(),
          wpm: finalWpm,
          cpm: finalCpm,
          accuracy: finalAccuracy,
          errors: totalMeaningfulKeystrokes - correctKeystrokes,
          totalChars: targetCode.length,
          timeMs: finalElapsedMs,
        }
        await savePracticeAttempt(templateId, attempt)
        const history = await getPracticeHistory(templateId)
        setAllAttempts(history)
        setShowCompletion(true)
      }
      saveAndShow()
    }
  }, [isComplete, endTime, startTime, targetCode, templateId, correctKeystrokes, totalMeaningfulKeystrokes])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isComplete) return
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'].includes(e.key)) return

      e.preventDefault()

      if (!startTime) {
        setStartTime(Date.now())
      }

      if (e.key === 'Backspace') {
        setTypedText((prev) => {
          if (prev.length === 0) return prev
          const newText = prev.slice(0, -1)
          // Clear error if we backspaced to or before the error position
          setErrorIndex((errIdx) => {
            if (errIdx !== null && newText.length <= errIdx) return null
            return errIdx
          })
          return newText
        })
        return
      }

      // Don't allow typing past the end of the target
      if (currentIndex >= targetCode.length) return

      if (e.key === 'Tab') {
        // Skip — tabs are auto-inserted with Enter
        return
      } else if (e.key === 'Enter') {
        // Auto-advance past newline + leading whitespace on next line
        if (errorIndex !== null) {
          // In error state, just type the newline as wrong
          setTypedText((prev) => prev + '\n')
          setTotalMeaningfulKeystrokes((prev) => prev + 1)
          return
        }
        const expected = targetCode[currentIndex]
        if (expected !== '\n') {
          // Not expecting a newline — treat as error
          setErrorIndex(currentIndex)
          setTypedText((prev) => prev + '\n')
          setTotalMeaningfulKeystrokes((prev) => prev + 1)
          return
        }
        // Consume the newline + all leading whitespace on the next line
        let autoChars = '\n'
        let pos = currentIndex + 1
        while (pos < targetCode.length && (targetCode[pos] === '\t' || targetCode[pos] === ' ')) {
          autoChars += targetCode[pos]
          pos++
        }
        setTypedText((prev) => prev + autoChars)
        setCorrectKeystrokes((prev) => prev + 1) // Only the Enter press counts
        setTotalMeaningfulKeystrokes((prev) => prev + 1)
        return
      }

      let inputChar: string | null = null

      if (e.key.length === 1) {
        inputChar = e.key
      }

      if (inputChar === null) return

      const expected = targetCode[currentIndex]
      const inErrorState = errorIndex !== null

      if (!inErrorState && inputChar === expected) {
        setTypedText((prev) => prev + inputChar)
        setCorrectKeystrokes((prev) => prev + 1)
        setTotalMeaningfulKeystrokes((prev) => prev + 1)
      } else {
        if (!inErrorState) {
          setErrorIndex(currentIndex)
        }
        setTypedText((prev) => prev + inputChar)
        setTotalMeaningfulKeystrokes((prev) => prev + 1)
      }
    },
    [isComplete, startTime, currentIndex, targetCode, errorIndex]
  )

  useEffect(() => {
    const el = containerRef.current
    if (el) el.focus()
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const reset = () => {
    setTypedText('')
    setStartTime(null)
    setEndTime(null)
    setErrorIndex(null)
    setCorrectKeystrokes(0)
    setTotalMeaningfulKeystrokes(0)
    setShowCompletion(false)
    setDisplayCpm(0)
    setTitle('Coding Racer')
  }

  return (
    <div ref={containerRef} tabIndex={0} className="outline-none max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${(typedText.length / targetCode.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-mono tabular-nums">
          {typedText.length}/{targetCode.length}
        </span>
        <button
          onClick={reset}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Code display */}
      {!showCompletion && (
        <>
          <CodeDisplay
            targetCode={targetCode}
            typedText={typedText}
            currentIndex={currentIndex}
            errorIndex={errorIndex}
          />

          {!startTime && !isComplete && (
            <p className="text-center text-gray-400 mt-4 text-sm">
              Start typing to begin...
            </p>
          )}
        </>
      )}

      {/* Completion screen */}
      {showCompletion && (
        <div className="mt-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Complete!</h3>
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <div>
              <span className="text-gray-400">CPM:</span>{' '}
              <span className="text-blue-600 font-mono text-lg font-bold">{displayCpm}</span>
            </div>
            <div>
              <span className="text-gray-400">Accuracy:</span>{' '}
              <span className="text-gray-900 font-mono text-lg">{accuracy}%</span>
            </div>
          </div>

          {allAttempts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">History</h4>
              <HistoryChart attempts={allAttempts} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
