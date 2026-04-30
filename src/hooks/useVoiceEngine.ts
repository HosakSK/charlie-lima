/**
 * Voice Engine Hook - Complete port of the Web Speech API logic from script.js
 * Uses useRef for mutable state to avoid re-render issues with SpeechRecognition
 */
'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useChecklistStore } from '@/hooks/store/useChecklistStore';
import { useSettingsStore } from '@/hooks/store/useSettingsStore';
import { useBriefingStore } from '@/hooks/store/useBriefingStore';
import { spellAbbreviations } from '@/utils/textToSpeech';
import { getBriefingValidSentences, parseVariables } from '@/utils/briefingParser';

interface VoiceCallbacks {
  onListeningChange: (v: boolean) => void;
  onSpeakingChange: (v: boolean) => void;
  onEqualizerState: (state: 'active' | 'success' | 'error' | 'idle') => void;
  onAutoNext: () => void;
  onAutoCheck: (itemIdx: number) => void;
  scrollToItem: (idx: number) => void;
  startTimer: (label: string, seconds: number, onComplete: () => void, continuous: boolean, warning?: string) => void;
}

// SpeechRecognition type for browsers
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : unknown;

export function useVoiceEngine(callbacks: VoiceCallbacks) {
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const hasStartedReadingRef = useRef(false);
  const processedMatchesCountRef = useRef(0);
  const processedStopCountRef = useRef(0);
  const processedRepeatCountRef = useRef(0);
  const lastTranscriptLengthRef = useRef(0);
  const lastCheckedTimeRef = useRef(0);
  const isTimerActivePauseRef = useRef(false);
  const readCLOnlyChecklistPhaseActiveRef = useRef(false);
  const currentPlayingBriefingIndexRef = useRef(-1);
  const sessionRef = useRef(0);
  const activeTimerWarningRef = useRef<string | null>(null);

  const getSelectedVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    const isMaleVoice = useSettingsStore.getState().isMaleVoice;
    if (isMaleVoice) {
      return voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('James')) || voices.find(v => v.lang.startsWith('en')) || null;
    }
    return voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira')) || voices.find(v => v.lang.startsWith('en')) || null;
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    const { isMuted, isMaleVoice } = useSettingsStore.getState();
    if (isMuted) {
      setTimeout(() => onEnd?.(), 100);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = isMaleVoice ? 1.28 : 1.09;
    utterance.voice = getSelectedVoice();
    if (onEnd) utterance.onend = () => onEnd();
    window.speechSynthesis.speak(utterance);
  }, [getSelectedVoice]);

  const isItemVisible = useCallback((item: { type: string; ifturnaround?: string; subtype?: string }) => {
    const { isTurnaround } = useChecklistStore.getState();
    const { isChecklistOnly, showBriefing, hideTests, isSimplified } = useSettingsStore.getState();

    if (item.subtype === 'subtitle') return true;
    if (isTurnaround && item.ifturnaround === 'no') return false;
    if (!isTurnaround && item.ifturnaround === 'yes') return false;
    if (isChecklistOnly && item.type !== 'checklist item' && item.subtype !== 'subtitle') return false;
    if (!showBriefing && item.type === 'briefing') return false;
    if (hideTests && item.subtype === 'test') return false;
    if (isSimplified && item.subtype === 'simplify-hide') return false;
    return true;
  }, []);

  const getParsedAction = useCallback((item: { action: string; name: string }, forSpeech = false) => {
    const briefState = useBriefingStore.getState();
    return parseVariables(item.action, briefState as unknown as Record<string, string>, forSpeech);
  }, []);

  const speakCurrentItem = useCallback(() => {
    if (!isListeningRef.current || !hasStartedReadingRef.current) return;
    const { data, currentPageIndex } = useChecklistStore.getState();
    const { isReadCLOnly, isMuted, isMaleVoice, isTimerDisabled } = useSettingsStore.getState();
    const items = data[currentPageIndex]?.items || [];
    const nextItem = items.find(i => !i.checked && isItemVisible(i));

    window.speechSynthesis.cancel();

    if (nextItem) {
      const nextItemIdx = items.indexOf(nextItem);
      callbacks.scrollToItem(nextItemIdx);

      // Read CL Only: Flow/Briefing items - pause
      if (isReadCLOnly && (nextItem.type === 'flow' || nextItem.type === 'briefing')) {
        if (readCLOnlyChecklistPhaseActiveRef.current) {
          readCLOnlyChecklistPhaseActiveRef.current = false;
          const pageTitle = data[currentPageIndex].title;
          const completeText = spellAbbreviations(pageTitle, true) + " Checklist completed.";
          isSpeakingRef.current = true;
          callbacks.onSpeakingChange(true);
          speak(completeText, () => {
            isSpeakingRef.current = false;
            hasStartedReadingRef.current = false;
            callbacks.onSpeakingChange(false);
            if (isListeningRef.current) restartRecognition();
          });
          return;
        }
        hasStartedReadingRef.current = false;
        isSpeakingRef.current = false;
        callbacks.onSpeakingChange(false);
        if (isListeningRef.current) restartRecognition();
        return;
      }

      // Read CL Only: Wait for "checklist" command at checklist items
      if (isReadCLOnly && nextItem.type === 'checklist item' && !readCLOnlyChecklistPhaseActiveRef.current) {
        hasStartedReadingRef.current = false;
        isSpeakingRef.current = false;
        callbacks.onSpeakingChange(false);
        if (isListeningRef.current) restartRecognition();
        return;
      }

      // Mid-page transition text
      let transitionText = "";
      if (!isReadCLOnly) {
        let lastCheckedItem = null;
        for (let i = nextItemIdx - 1; i >= 0; i--) {
          if (items[i] && isItemVisible(items[i]) && items[i].checked) {
            lastCheckedItem = items[i];
            break;
          }
        }
        if (lastCheckedItem) {
          if (lastCheckedItem.type !== 'checklist item' && nextItem.type === 'checklist item') {
            transitionText = `${data[currentPageIndex].title} Checklist. `;
          } else if (lastCheckedItem.type === 'checklist item' && nextItem.type !== 'checklist item') {
            transitionText = `${data[currentPageIndex].title} Checklist complete. `;
          }
        }
      }

      let textToRead = '';
      if (nextItem.type === 'briefing') {
        const briefState = useBriefingStore.getState();
        currentPlayingBriefingIndexRef.current = nextItemIdx;
        textToRead = getBriefingValidSentences(nextItem, briefState as unknown as Record<string, string>, data, true).join(' ');
      } else {
        textToRead = `${nextItem.name}. ${getParsedAction(nextItem, true)}`;
      }
      textToRead = transitionText + textToRead;

      // Timer warning check
      if (activeTimerWarningRef.current) {
        const searchTarget = parseVariables(activeTimerWarningRef.current, useBriefingStore.getState() as unknown as Record<string, string>).toLowerCase();
        const matchedName = parseVariables(nextItem.name, useBriefingStore.getState() as unknown as Record<string, string>).toLowerCase();
        if (matchedName.includes(searchTarget)) {
          isSpeakingRef.current = true;
          isTimerActivePauseRef.current = true;
          callbacks.onSpeakingChange(true);
          try { recognitionRef.current?.abort(); } catch {}
          speak("Wait for timer.");
          return;
        }
      }

      const spokenText = spellAbbreviations(parseVariables(textToRead, useBriefingStore.getState() as unknown as Record<string, string>, true));
      isSpeakingRef.current = true;
      callbacks.onSpeakingChange(true);
      try { recognitionRef.current?.abort(); } catch {}

      sessionRef.current++;
      const thisSession = sessionRef.current;

      if (!isMuted) {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = 'en-US';
        utterance.rate = isMaleVoice ? 1.28 : 1.09;
        utterance.voice = getSelectedVoice();
        utterance.onstart = () => { isSpeakingRef.current = true; callbacks.onSpeakingChange(true); };
        utterance.onend = () => {
          if (sessionRef.current !== thisSession) return;
          setTimeout(() => {
            if (sessionRef.current !== thisSession) return;
            if (isTimerActivePauseRef.current) return;
            isSpeakingRef.current = false;
            callbacks.onSpeakingChange(false);
            if (isListeningRef.current) restartRecognition();
          }, 175);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          if (sessionRef.current !== thisSession) return;
          isSpeakingRef.current = false;
          callbacks.onSpeakingChange(false);
          if (isListeningRef.current) restartRecognition();
        }, 175);
      }
    } else {
      // All items checked - page complete
      const page = data[currentPageIndex];
      const pageTitle = page.title;
      const isLastPage = currentPageIndex === data.length - 1;
      const visibleItems = page.items.filter(i => isItemVisible(i));
      const lastItem = visibleItems.length > 0 ? visibleItems[visibleItems.length - 1] : null;
      const hadChecklistItems = visibleItems.some(i => i.type === 'checklist item');

      sessionRef.current++;
      const thisSession = sessionRef.current;

      let completeText: string;
      if (lastItem?.type === 'checklist item' || hadChecklistItems) {
        completeText = spellAbbreviations(pageTitle, true) + " Checklist completed.";
      } else {
        completeText = spellAbbreviations(pageTitle, true) + " flow complete.";
      }
      if (isLastPage) completeText += ' And we can go home.';

      isSpeakingRef.current = true;
      callbacks.onSpeakingChange(true);
      try { recognitionRef.current?.abort(); } catch {}

      const onDone = () => {
        if (sessionRef.current !== thisSession) return;
        setTimeout(() => {
          if (sessionRef.current !== thisSession) return;
          if (isTimerActivePauseRef.current) return;
          isSpeakingRef.current = false;
          callbacks.onSpeakingChange(false);
          if (isListeningRef.current) restartRecognition();
        }, 175);
        // Auto-next
        callbacks.onAutoNext();
      };

      speak(completeText, onDone);
    }
  }, [callbacks, getSelectedVoice, getParsedAction, isItemVisible, speak]);

  const simulateCheckAction = useCallback(() => {
    if (!isListeningRef.current || !hasStartedReadingRef.current) return;
    const { data, currentPageIndex } = useChecklistStore.getState();
    const { isTimerDisabled } = useSettingsStore.getState();
    const items = data[currentPageIndex].items;
    const nextItemIdx = items.findIndex(i => !i.checked && isItemVisible(i));

    if (nextItemIdx !== -1) {
      callbacks.onAutoCheck(nextItemIdx);
      callbacks.onEqualizerState('success');
      setTimeout(() => {
        if (isListeningRef.current) callbacks.onEqualizerState('active');
      }, 1500);

      const activatedItem = items[nextItemIdx];
      if (activatedItem?.timer && !isTimerDisabled) {
        processTimerItem(activatedItem);
      } else {
        setTimeout(() => speakCurrentItem(), 1120);
      }
    } else {
      callbacks.onAutoNext();
    }
  }, [callbacks, isItemVisible, speakCurrentItem]);

  const processTimerItem = useCallback((activatedItem: {
    timer?: string; timerContinuous?: string; timerLabel?: string;
    timerAnnouncement?: string; timerWarning?: string; name: string;
  }) => {
    const timerSecs = parseInt(activatedItem.timer || '0');
    const isContinuous = activatedItem.timerContinuous === 'yes';
    if (!isContinuous) isTimerActivePauseRef.current = true;

    isSpeakingRef.current = true;
    callbacks.onSpeakingChange(true);
    try { recognitionRef.current?.abort(); } catch {}

    if (activatedItem.timerWarning) activeTimerWarningRef.current = activatedItem.timerWarning;

    const briefState = useBriefingStore.getState();
    const label = parseVariables(activatedItem.timerLabel || activatedItem.name, briefState as unknown as Record<string, string>);

    const onComplete = () => {
      if (!isContinuous) {
        const { isMuted, isMaleVoice } = useSettingsStore.getState();
        speak('Timer complete. We may continue.', () => {
          isTimerActivePauseRef.current = false;
          activeTimerWarningRef.current = null;
          setTimeout(() => speakCurrentItem(), 560);
        });
      } else {
        if (isTimerActivePauseRef.current) {
          isTimerActivePauseRef.current = false;
          activeTimerWarningRef.current = null;
          speakCurrentItem();
        }
      }
    };

    setTimeout(() => {
      callbacks.startTimer(label, timerSecs, onComplete, isContinuous, activatedItem.timerWarning);

      if (activatedItem.timerAnnouncement) {
        const announcementText = spellAbbreviations(parseVariables(activatedItem.timerAnnouncement, briefState as unknown as Record<string, string>, true));
        speak(announcementText, () => {
          if (isContinuous) setTimeout(() => speakCurrentItem(), 560);
        });
      } else if (isContinuous) {
        setTimeout(() => speakCurrentItem(), 840);
      }
    }, 840);
  }, [callbacks, speak, speakCurrentItem]);

  const prepareChecklistReading = useCallback(() => {
    hasStartedReadingRef.current = true;
    const { isMuted } = useSettingsStore.getState();
    if (!isMuted) window.speechSynthesis.cancel();

    const { data, currentPageIndex } = useChecklistStore.getState();
    const { isReadCLOnly } = useSettingsStore.getState();
    const page = data[currentPageIndex];
    if (!page) return;

    if (isReadCLOnly) {
      const visibleItems = page.items.filter(i => isItemVisible(i));
      const hasOnlyFlow = visibleItems.every(i => i.type === 'flow');
      if (hasOnlyFlow) {
        hasStartedReadingRef.current = false;
        isSpeakingRef.current = false;
        callbacks.onSpeakingChange(false);
        if (isListeningRef.current) restartRecognition();
        return;
      }
    }

    const firstVisibleItem = page.items.find(i => isItemVisible(i));
    let titleSuffix = " Checklist.";
    if (firstVisibleItem && firstVisibleItem.type !== 'checklist item' && !isReadCLOnly) {
      titleSuffix = ".";
    }

    isSpeakingRef.current = true;
    callbacks.onSpeakingChange(true);
    try { recognitionRef.current?.abort(); } catch {}

    speak(spellAbbreviations(page.title, true) + titleSuffix, () => {
      speakCurrentItem();
    });
  }, [callbacks, isItemVisible, speak, speakCurrentItem]);

  const restartRecognition = useCallback(() => {
    try { recognitionRef.current?.start(); } catch {}
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (isListeningRef.current) {
      // Stop
      isListeningRef.current = false;
      callbacks.onListeningChange(false);
      try { recognitionRef.current?.stop(); } catch {}
      readCLOnlyChecklistPhaseActiveRef.current = false;
      return;
    }

    hasStartedReadingRef.current = false;
    readCLOnlyChecklistPhaseActiveRef.current = false;

    if (!recognitionRef.current) {
      const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
      const recognition = new (SpeechRecognition as new () => SpeechRecognition)();
      (recognition as unknown as Record<string, unknown>).lang = 'en-US';
      (recognition as unknown as Record<string, unknown>).continuous = true;
      (recognition as unknown as Record<string, unknown>).interimResults = true;

      (recognition as unknown as Record<string, unknown>).onstart = () => {
        isListeningRef.current = true;
        processedMatchesCountRef.current = 0;
        processedStopCountRef.current = 0;
        processedRepeatCountRef.current = 0;
        lastTranscriptLengthRef.current = 0;
        callbacks.onListeningChange(true);
        callbacks.onEqualizerState('active');
      };

      (recognition as unknown as Record<string, unknown>).onend = () => {
        if (!isListeningRef.current) {
          callbacks.onListeningChange(false);
          callbacks.onEqualizerState('idle');
          window.speechSynthesis.cancel();
        } else if (!isSpeakingRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && !isSpeakingRef.current) restartRecognition();
          }, 100);
        }
      };

      (recognition as unknown as Record<string, unknown>).onerror = (event: { error: string }) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return;
        if (event.error === 'not-allowed') isListeningRef.current = false;
        callbacks.onEqualizerState('error');
      };

      (recognition as unknown as Record<string, unknown>).onresult = (event: { results: SpeechRecognitionResultList }) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const transcript = fullTranscript.toLowerCase().trim();
        if (!transcript) return;

        // Chrome memory reset protection
        if (transcript.length < lastTranscriptLengthRef.current - 20) {
          processedMatchesCountRef.current = 0;
          processedStopCountRef.current = 0;
          processedRepeatCountRef.current = 0;
        }
        lastTranscriptLengthRef.current = transcript.length;
        callbacks.onEqualizerState('active');

        const actionWordPattern = /(check|set|call|reset|start|steady|announcement|revoke|continuous|retract|auto|open|down|green|\bon\b|\boff\b|\bup\b|\barm\b|completed)/gi;
        const stopWordPattern = /(stop|cancel)/gi;
        const repeatWordPattern = /(repeat|again)/gi;

        // Trigger: Checklist start
        if (!hasStartedReadingRef.current && (transcript.includes('checklist') || transcript.includes('craigslist'))) {
          const { isReadCLOnly } = useSettingsStore.getState();
          if (isReadCLOnly) {
            const { data, currentPageIndex } = useChecklistStore.getState();
            const currentItems = data[currentPageIndex]?.items || [];
            const nextVisible = currentItems.find(i => !i.checked && isItemVisible(i));
            if (nextVisible && (nextVisible.type === 'flow' || nextVisible.type === 'briefing')) return;
            readCLOnlyChecklistPhaseActiveRef.current = true;
          }
          hasStartedReadingRef.current = true;
          const initialMatches = transcript.match(actionWordPattern);
          if (initialMatches) processedMatchesCountRef.current = initialMatches.length;
          const initialRepeat = transcript.match(repeatWordPattern);
          if (initialRepeat) processedRepeatCountRef.current = initialRepeat.length;
          prepareChecklistReading();
          return;
        }

        if (!hasStartedReadingRef.current) return;

        // Stop command
        const stopMatches = transcript.match(stopWordPattern);
        const currentStopCount = stopMatches ? stopMatches.length : 0;
        if (currentStopCount > processedStopCountRef.current) {
          processedStopCountRef.current = currentStopCount;
          isListeningRef.current = false;
          callbacks.onListeningChange(false);
          try { recognitionRef.current?.stop(); } catch {}
          return;
        }

        // Repeat command
        const repeatMatches = transcript.match(repeatWordPattern);
        const currentRepeatCount = repeatMatches ? repeatMatches.length : 0;
        if (currentRepeatCount > processedRepeatCountRef.current) {
          processedRepeatCountRef.current = currentRepeatCount;
          speakCurrentItem();
          return;
        }

        // Check/Set action
        const matches = transcript.match(actionWordPattern);
        const currentMatchesCount = matches ? matches.length : 0;
        if (currentMatchesCount > processedMatchesCountRef.current) {
          if (isSpeakingRef.current) {
            processedMatchesCountRef.current = currentMatchesCount;
          } else {
            const now = Date.now();
            if (now - lastCheckedTimeRef.current < 800) {
              processedMatchesCountRef.current = currentMatchesCount;
              return;
            }
            lastCheckedTimeRef.current = now;
            processedMatchesCountRef.current = currentMatchesCount;

            const { data, currentPageIndex } = useChecklistStore.getState();
            const { isTimerDisabled } = useSettingsStore.getState();
            const items = data[currentPageIndex].items;
            const nextItemIdx = items.findIndex(i => !i.checked && isItemVisible(i));

            if (nextItemIdx !== -1) {
              const activatedItem = items[nextItemIdx];
              setTimeout(() => callbacks.onAutoCheck(nextItemIdx), 700);
              callbacks.onEqualizerState('success');
              setTimeout(() => {
                if (isListeningRef.current) callbacks.onEqualizerState('active');
              }, 1500);

              if (activatedItem?.timer && !isTimerDisabled) {
                processTimerItem(activatedItem);
              } else {
                setTimeout(() => speakCurrentItem(), 1120);
              }
              try { recognitionRef.current?.stop(); } catch {}
            }
          }
        }
      };

      recognitionRef.current = recognition as unknown as InstanceType<SpeechRecognitionType>;
    }

    try {
      (recognitionRef.current as unknown as { start(): void }).start();
    } catch (e) {
      alert("Mic error: " + (e as Error).message);
    }
  }, [callbacks, isItemVisible, prepareChecklistReading, restartRecognition, speakCurrentItem, processTimerItem]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    hasStartedReadingRef.current = false;
    readCLOnlyChecklistPhaseActiveRef.current = false;
    isTimerActivePauseRef.current = false;
    callbacks.onListeningChange(false);
    callbacks.onEqualizerState('idle');
    window.speechSynthesis.cancel();
    try { recognitionRef.current?.abort(); } catch {}
  }, [callbacks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch {}
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    startListening,
    stopListening,
    isListening: () => isListeningRef.current,
    isSpeaking: () => isSpeakingRef.current,
  };
}
