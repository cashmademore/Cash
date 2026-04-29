import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  isSpeaking = signal<boolean>(false);

  private get synth() {
      return typeof window !== 'undefined' ? window.speechSynthesis : null;
  }

  speak(text: string) {
    const s = this.synth;
    if (!s) return;

    if (s.speaking) {
      s.cancel();
    }
    
    const voices = s.getVoices();
    let voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Ava'));
    if (!voice) {
        voice = voices.find(v => v.lang === 'en-US');
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = 1.05;
    utterance.pitch = 1.1; 
    
    utterance.onstart = () => this.isSpeaking.set(true);
    utterance.onend = () => this.isSpeaking.set(false);
    utterance.onerror = () => this.isSpeaking.set(false);
    
    s.speak(utterance);
  }

  stop() {
    const s = this.synth;
    if (s) {
        s.cancel();
    }
    this.isSpeaking.set(false);
  }
}
