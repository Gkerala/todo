/**
 * "딩-동" 종소리를 코드로 만든다 (소리 파일 없이 Web Audio API 사용).
 * 브라우저에서만 쓸 수 있다.
 */
export function playChime(ctx: AudioContext, repeat = 1) {
  const notes = [880, 660]; // 딩(A5) - 동(E5)
  let t = ctx.currentTime + 0.05;

  for (let r = 0; r < repeat; r++) {
    for (const freq of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      // 소리가 "툭" 끊기지 않게 커졌다가 서서히 작아지게 한다
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1);
      t += 0.45;
    }
    t += 0.6;
  }
}
