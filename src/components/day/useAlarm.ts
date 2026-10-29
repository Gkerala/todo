"use client";

import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { playChime } from "@/lib/chime";
import type { DayItem } from "@/lib/dayItems";

const STORAGE_KEY = "alarm-sound";
const CHANGE_EVENT = "alarm-sound-change";

// ── 소리 켜기/끄기 설정: localStorage에 저장하고, 바뀌면 화면이 따라 바뀌게 한다 ──
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // 다른 탭에서 바꾼 경우
  window.addEventListener(CHANGE_EVENT, onChange); // 이 탭에서 바꾼 경우
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readSoundOn() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function writeSoundOn(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)는 이번 화면에서만 무시한다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 소리 장치(AudioContext)를 처음이면 만들고, 잠들어 있으면 깨운다. 클릭/터치 중에 불러야 한다. */
function unlockAudio(ref: RefObject<AudioContext | null>) {
  ref.current ??= new AudioContext();
  if (ref.current.state === "suspended") void ref.current.resume();
  return ref.current;
}

/**
 * 루틴 알람: 배너 상태 + 종소리.
 * 브라우저는 사용자가 클릭하기 전에는 소리를 못 내게 막으므로(자동재생 정책),
 * AudioContext는 버튼 클릭이나 화면 터치 때 만들거나 깨운다.
 */
export function useAlarm() {
  // 서버에는 localStorage가 없으니 서버 화면은 항상 "꺼짐"으로 그린다
  const soundOn = useSyncExternalStore(subscribe, readSoundOn, () => false);
  const [ringing, setRinging] = useState<DayItem | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  // 새로고침하면 소리 장치가 사라지므로, 켜져 있으면 첫 터치/클릭 때 다시 깨운다
  useEffect(() => {
    if (!soundOn) return;
    const onPointer = () => unlockAudio(ctxRef);
    window.addEventListener("pointerdown", onPointer, { once: true });
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [soundOn]);

  function toggleSound() {
    const next = !soundOn;
    if (next) playChime(unlockAudio(ctxRef)); // 켜자마자 한 번 울려서 소리가 나는지 확인시킨다
    writeSoundOn(next);
  }

  function ring(item: DayItem) {
    setRinging(item);
    const ctx = ctxRef.current;
    if (soundOn && ctx) playChime(ctx, item.mustDo ? 3 : 1);
  }

  return { soundOn, toggleSound, ringing, ring, dismiss: () => setRinging(null) };
}
