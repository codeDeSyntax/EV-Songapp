// Piano Animation Module for Splash Screen
// Handles animated piano keys that play during loading
// Features:
// - Visual piano key animations with realistic top-down grand piano design
// - Audio feedback using Web Audio API with generated piano tones
// - Customizable volume, speed, and visual appearance
// - User interaction-aware audio initialization for browser compatibility

export interface PianoAnimationOptions {
  totalKeys?: number;
  keyWidth?: number;
  keyHeight?: number;
  blackKeyHeight?: number;
  animationSpeed?: number;
  glowColor?: string;
  enableAudio?: boolean;
  audioVolume?: number;
  audioType?: "generated" | "files"; // Use generated tones or audio files
}

export class PianoAnimation {
  private container: HTMLElement;
  private keyElements: HTMLElement[] = [];
  private currentKeyIndex = 0;
  private currentMelodyIndex = 0;
  private options: Required<PianoAnimationOptions>;
  private progressInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffers: { [key: string]: AudioBuffer } = {};

  constructor(container: HTMLElement, options: PianoAnimationOptions = {}) {
    this.container = container;
    this.options = {
      totalKeys: options.totalKeys || 15,
      keyWidth: options.keyWidth || 16,
      keyHeight: options.keyHeight || 60,
      blackKeyHeight: options.blackKeyHeight || 35,
      animationSpeed: options.animationSpeed || 800, // Much slower for quality chromatic scale
      glowColor: options.glowColor || "rgba(255, 215, 0, 0.6)",
      enableAudio:
        options.enableAudio !== undefined ? options.enableAudio : true,
      audioVolume: options.audioVolume || 0.25, // Softer volume for church atmosphere
      audioType: options.audioType || "generated",
    };

    this.initializePiano();
    if (this.options.enableAudio) {
      this.initializeAudio();
    }
  }

  private initializePiano(): void {
    // Clear container
    this.container.innerHTML = "";
    this.keyElements = [];

    // Create grand piano container styling - exact top-down view like the image
    this.container.style.cssText = `
      position: relative;
      width: 360px;
      height: 360px;
      margin: 30px auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    `;

    this.createGrandPianoBodyShape();
    this.createKeyboardSection();
    this.addPianoGlow();
    this.addKeyAnimationStyles();
  }

  private createGrandPianoBodyShape(): void {
    // Create the main curved body exactly like the image
    const pianoBody = document.createElement("div");
    pianoBody.style.cssText = `
      position: absolute;
      width: 340px;
      height: 280px;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(145deg, #1a0f08 0%, #2c1810 50%, #1a0f08 100%);
      border-radius: 170px 170px 0 0;
      box-shadow: 
        0 8px 25px rgba(0, 0, 0, 0.6),
        inset 0 2px 10px rgba(255, 255, 255, 0.1),
        inset 0 -5px 15px rgba(0, 0, 0, 0.3);
      z-index: 1;
    `;

    // Add elegant "EVSONGAPP" text on the piano body
    const pianoText = document.createElement("div");
    pianoText.textContent = "EVSONGAPP";
    pianoText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      color: rgba(139, 69, 19, 0.6);
      font-family: 'Georgia', serif;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 3px;
      text-shadow: 
        0 1px 2px rgba(0, 0, 0, 0.1),
        0 0 8px rgba(139, 69, 19, 0.2);
      pointer-events: none;
      z-index: 3;
      background: linear-gradient(45deg, 
        rgba(139, 69, 19, 0.7) 0%, 
        rgba(160, 82, 45, 0.8) 50%, 
        rgba(139, 69, 19, 0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `;

    this.container.appendChild(pianoBody);
    this.container.appendChild(pianoText);
  }

  private createKeyboardSection(): void {
    // Create the keyboard container at the bottom (like in the image)
    const keyboardContainer = document.createElement("div");
    keyboardContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 280px;
      height: 60px;
      background: linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%);
      border-radius: 8px;
      border: 2px solid #333;
      box-shadow: 
        0 4px 15px rgba(0, 0, 0, 0.6),
        inset 0 2px 5px rgba(255, 255, 255, 0.1);
      z-index: 10;
      overflow: hidden;
    `;

    // Create the white and black keys
    this.createPianoKeys(keyboardContainer);
    this.container.appendChild(keyboardContainer);
  }

  private createPianoKeys(keyboardContainer: HTMLElement): void {
    const { totalKeys } = this.options;

    // Create white keys first
    for (let i = 0; i < totalKeys; i++) {
      const whiteKey = document.createElement("div");
      whiteKey.style.cssText = `
        position: absolute;
        left: ${i * (280 / totalKeys)}px;
        bottom: 0;
        width: ${280 / totalKeys - 1}px;
        height: 50px;
        background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
        border: 1px solid #ccc;
        border-radius: 0 0 3px 3px;
        cursor: pointer;
        transition: all 0.1s ease;
        z-index: 1;
      `;

      whiteKey.setAttribute("data-key-index", i.toString());
      whiteKey.setAttribute("data-key-type", "white");
      this.keyElements.push(whiteKey);
      keyboardContainer.appendChild(whiteKey);
    }

    // Create black keys (between white keys)
    const blackKeyPositions = [
      0.7, 1.7, 3.7, 4.7, 5.7, 7.7, 8.7, 10.7, 11.7, 12.7,
    ];
    blackKeyPositions
      .slice(0, Math.floor(totalKeys * 0.6))
      .forEach((position, index) => {
        const blackKey = document.createElement("div");
        blackKey.style.cssText = `
        position: absolute;
        left: ${position * (280 / totalKeys)}px;
        bottom: 25px;
        width: ${(280 / totalKeys) * 0.6}px;
        height: 25px;
        background: linear-gradient(180deg, #2a2a2a 0%, #000000 100%);
        border: 1px solid #000;
        border-radius: 0 0 2px 2px;
        cursor: pointer;
        transition: all 0.1s ease;
        z-index: 2;
      `;

        blackKey.setAttribute("data-key-index", (totalKeys + index).toString());
        blackKey.setAttribute("data-key-type", "black");
        this.keyElements.push(blackKey);
        keyboardContainer.appendChild(blackKey);
      });
  }

  private addPianoGlow(): void {
    const pianoGlow = document.createElement("div");
    pianoGlow.style.cssText = `
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 40px;
      background: radial-gradient(ellipse, rgba(154, 103, 74, 0.4) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(15px);
      z-index: 0;
    `;
    this.container.appendChild(pianoGlow);
  }

  private addKeyAnimationStyles(): void {
    const styleId = "piano-animation-styles";

    // Remove existing styles if they exist
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }

    const animationStyles = document.createElement("style");
    animationStyles.id = styleId;
    animationStyles.textContent = `
      .piano-key-pressed {
        transform: scale(0.95) !important;
        transition: all 0.1s ease-out !important;
      }
      
      .piano-key-white-glow {
        background: linear-gradient(180deg, #fff5b3 0%, #ffe066 50%, #ffcc00 100%) !important;
        box-shadow: 
          0 0 8px ${this.options.glowColor}, 
          inset 0 0 5px rgba(255, 215, 0, 0.3),
          0 0 15px ${this.options.glowColor} !important;
        filter: brightness(1.2) !important;
      }
      
      .piano-key-black-glow {
        background: linear-gradient(180deg, #4a4a4a 0%, #333333 50%, #1a1a1a 100%) !important;
        box-shadow: 
          0 0 6px ${this.options.glowColor}, 
          inset 0 0 3px rgba(255, 215, 0, 0.4),
          0 0 12px ${this.options.glowColor} !important;
        filter: brightness(1.4) !important;
      }

      @keyframes piano-key-ripple {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(1.3);
          opacity: 0;
        }
      }

      .piano-key-ripple::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 15px;
        height: 15px;
        background: ${this.options.glowColor};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: piano-key-ripple 0.3s ease-out;
        pointer-events: none;
        z-index: 10;
      }
    `;

    document.head.appendChild(animationStyles);
  }

  // Audio initialization and management
  private async initializeAudio(): Promise<void> {
    try {
      // Create AudioContext for generating piano sounds
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Handle audio context state for user interaction requirements
      if (this.audioContext.state === "suspended") {
        // Try to resume immediately (works in Electron)
        await this.audioContext.resume();

        // If still suspended, set up user interaction listener
        if (this.audioContext.state === "suspended") {
          const resumeAudio = async () => {
            if (this.audioContext && this.audioContext.state === "suspended") {
              await this.audioContext.resume();
              console.log("Piano audio context resumed after user interaction");
            }
            document.removeEventListener("click", resumeAudio);
            document.removeEventListener("keydown", resumeAudio);
          };

          document.addEventListener("click", resumeAudio, { once: true });
          document.addEventListener("keydown", resumeAudio, { once: true });
        }
      }

      console.log("Piano audio initialized successfully");
    } catch (error) {
      console.warn("Failed to initialize piano audio:", error);
      this.options.enableAudio = false;
    }
  }

  private generateGrandPianoTone(
    frequency: number,
    duration: number = 1.5
  ): void {
    if (!this.audioContext || !this.options.enableAudio) return;

    try {
      const now = this.audioContext.currentTime;

      // Create multiple oscillators for rich grand piano harmonics
      const fundamentalOsc = this.audioContext.createOscillator();
      const harmonicOsc1 = this.audioContext.createOscillator(); // Octave
      const harmonicOsc2 = this.audioContext.createOscillator(); // Perfect fifth
      const harmonicOsc3 = this.audioContext.createOscillator(); // Major third
      const subOsc = this.audioContext.createOscillator(); // Sub-octave for depth

      // Create gain nodes for each oscillator
      const fundamentalGain = this.audioContext.createGain();
      const harmonicGain1 = this.audioContext.createGain();
      const harmonicGain2 = this.audioContext.createGain();
      const harmonicGain3 = this.audioContext.createGain();
      const subGain = this.audioContext.createGain();
      const masterGain = this.audioContext.createGain();

      // Create reverb effect for concert hall acoustics
      const convolver = this.audioContext.createConvolver();
      const reverbGain = this.audioContext.createGain();

      // Create impulse response for grand piano hall reverb
      const length = this.audioContext.sampleRate * 2; // 2 second reverb
      const impulse = this.audioContext.createBuffer(
        2,
        length,
        this.audioContext.sampleRate
      );

      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          channelData[i] =
            (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
      }
      convolver.buffer = impulse;

      // Set oscillator types for rich grand piano sound
      fundamentalOsc.type = "triangle"; // Warm fundamental
      harmonicOsc1.type = "sine"; // Pure octave
      harmonicOsc2.type = "triangle"; // Rich fifth
      harmonicOsc3.type = "sine"; // Bright third
      subOsc.type = "sine"; // Deep sub-octave

      // Set frequencies - grand piano harmonic series
      fundamentalOsc.frequency.setValueAtTime(frequency, now);
      harmonicOsc1.frequency.setValueAtTime(frequency * 2, now); // Octave
      harmonicOsc2.frequency.setValueAtTime(frequency * 1.498, now); // Perfect fifth (slightly detuned)
      harmonicOsc3.frequency.setValueAtTime(frequency * 1.259, now); // Major third
      subOsc.frequency.setValueAtTime(frequency * 0.5, now); // Sub-octave

      // Set gain levels for balanced grand piano sound
      fundamentalGain.gain.setValueAtTime(this.options.audioVolume * 0.8, now);
      harmonicGain1.gain.setValueAtTime(this.options.audioVolume * 0.4, now);
      harmonicGain2.gain.setValueAtTime(this.options.audioVolume * 0.3, now);
      harmonicGain3.gain.setValueAtTime(this.options.audioVolume * 0.2, now);
      subGain.gain.setValueAtTime(this.options.audioVolume * 0.3, now);

      // Connect oscillators to their gain nodes
      fundamentalOsc.connect(fundamentalGain);
      harmonicOsc1.connect(harmonicGain1);
      harmonicOsc2.connect(harmonicGain2);
      harmonicOsc3.connect(harmonicGain3);
      subOsc.connect(subGain);

      // Connect gain nodes to master gain
      fundamentalGain.connect(masterGain);
      harmonicGain1.connect(masterGain);
      harmonicGain2.connect(masterGain);
      harmonicGain3.connect(masterGain);
      subGain.connect(masterGain);

      // Set up reverb for concert hall acoustics
      reverbGain.gain.setValueAtTime(0.4, now);
      masterGain.connect(convolver);
      convolver.connect(reverbGain);

      // Connect to output (dry + wet signal)
      masterGain.connect(this.audioContext.destination);
      reverbGain.connect(this.audioContext.destination);

      // Create realistic grand piano envelope
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(
        this.options.audioVolume,
        now + 0.05
      ); // Quick attack
      masterGain.gain.exponentialRampToValueAtTime(
        this.options.audioVolume * 0.7,
        now + 0.3
      ); // Decay
      masterGain.gain.setValueAtTime(this.options.audioVolume * 0.6, now + 0.5); // Sustain
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

      // Start all oscillators
      fundamentalOsc.start(now);
      harmonicOsc1.start(now);
      harmonicOsc2.start(now);
      harmonicOsc3.start(now);
      subOsc.start(now);

      // Stop all oscillators
      fundamentalOsc.stop(now + duration);
      harmonicOsc1.stop(now + duration);
      harmonicOsc2.stop(now + duration);
      harmonicOsc3.stop(now + duration);
      subOsc.stop(now + duration);
    } catch (error) {
      console.warn("Failed to generate grand piano tone:", error);
    }
  }

  private getChromaticScaleFrequency(noteIndex: number): number {
    // Simple chromatic scale starting from C4 (middle C)
    // Each semitone increases by the 12th root of 2 (approximately 1.05946)
    const baseFrequency = 261.63; // C4 - Middle C
    const semitonesPerOctave = 12;

    // Calculate the frequency for the current note in the chromatic scale
    const semitoneOffset = noteIndex % (semitonesPerOctave * 2); // Two octaves for variety
    const frequency =
      baseFrequency * Math.pow(2, semitoneOffset / semitonesPerOctave);

    return frequency;
  }

  private mapChromaticToKeyIndex(noteIndex: number): number {
    // Map to specific visual keys for a clean chromatic progression
    // Use every other key for better visual spacing and clarity
    const keyMapping = [0, 1, 2, 3, 4, 5, 6, 7]; // First 8 keys for clean progression
    return keyMapping[noteIndex % keyMapping.length];
  }

  private playKeySound(noteIndex: number): void {
    if (!this.options.enableAudio) return;

    const frequency = this.getChromaticScaleFrequency(noteIndex);

    // Longer duration for each note to let it breathe and be heard clearly
    const duration = 2.0; // Much longer sustain for quality sound

    this.generateGrandPianoTone(frequency, duration);
  }

  public playKey(index: number): void {
    if (index < 0 || index >= this.keyElements.length) return;

    const key = this.keyElements[index];
    const isBlack = key.getAttribute("data-key-type") === "black";

    // Add pressed state with top-view appropriate animations
    key.classList.add("piano-key-pressed");
    key.classList.add(
      isBlack ? "piano-key-black-glow" : "piano-key-white-glow"
    );
    key.classList.add("piano-key-ripple");

    // Add subtle bounce effect for top-view
    let bounceCount = 0;
    const bounceInterval = setInterval(() => {
      if (bounceCount >= 2) {
        clearInterval(bounceInterval);
        return;
      }

      key.style.transform = `scale(0.92) rotate(${Math.random() * 1 - 0.5}deg)`;
      setTimeout(() => {
        key.style.transform = "scale(0.95)";
      }, 30);

      bounceCount++;
    }, 50);

    // Reset key after animation
    setTimeout(() => {
      key.classList.remove(
        "piano-key-pressed",
        "piano-key-white-glow",
        "piano-key-black-glow",
        "piano-key-ripple"
      );
      key.style.transform = "";
      key.style.filter = "";
      key.style.background = "";
      key.style.boxShadow = "";
    }, 400);
  }

  public startProgressAnimation(
    onProgress?: (progress: number) => void,
    onComplete?: () => void
  ): void {
    this.currentMelodyIndex = 0;
    let progress = 0;
    const totalProgress = 100;
    const totalNotes = 8; // Just 8 notes for a clean, quality chromatic scale (one octave)

    this.progressInterval = setInterval(() => {
      // Play a select few chromatic notes for quality over quantity
      const keyIndex = this.mapChromaticToKeyIndex(this.currentMelodyIndex);

      // Play the sound for this chromatic note
      this.playKeySound(this.currentMelodyIndex);

      // Light up the corresponding visual key
      this.playKey(keyIndex);

      // Increment melody and progress
      this.currentMelodyIndex++;
      progress = Math.min(progress + 100 / totalNotes, totalProgress);

      // Call progress callback
      if (onProgress) {
        onProgress(progress);
      }

      // Check if complete
      if (progress >= totalProgress || this.currentMelodyIndex >= totalNotes) {
        this.completeAnimation(onComplete);
      }
    }, this.options.animationSpeed);
  }

  private completeAnimation(onComplete?: () => void): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Grand finale - play a beautiful ascending chord
    setTimeout(() => {
      this.playChromaticFinaleChord();

      // Call completion callback after finale
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    }, 200);
  }

  private playChromaticFinaleChord(): void {
    // Play a beautiful C major chord to end the chromatic scale (C-E-G)
    const chordNotes = [0, 2, 4]; // First few keys for a nice visual effect

    chordNotes.forEach((keyIndex, index) => {
      setTimeout(() => {
        if (keyIndex < this.keyElements.length) {
          this.playKey(keyIndex);

          // Play the chord tones - C major chord
          if (this.options.enableAudio) {
            const frequencies = [261.63, 329.63, 392.0]; // C4, E4, G4
            this.generateGrandPianoTone(frequencies[index], 2.5); // Long sustain for finale
          }
        }
      }, index * 150); // Gentle arpeggiation for beautiful effect
    });
  }

  public stop(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Reset all keys
    this.keyElements.forEach((key) => {
      key.classList.remove(
        "piano-key-pressed",
        "piano-key-white-glow",
        "piano-key-black-glow",
        "piano-key-ripple"
      );
      key.style.transform = "";
      key.style.filter = "";
      key.style.boxShadow = "";
    });

    this.currentKeyIndex = 0;
    this.currentMelodyIndex = 0;
  }

  public reset(): void {
    this.stop();
    this.currentKeyIndex = 0;
    this.currentMelodyIndex = 0;
  }

  public destroy(): void {
    this.stop();

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Remove styles
    const styles = document.getElementById("piano-animation-styles");
    if (styles) {
      styles.remove();
    }

    // Clear container
    this.container.innerHTML = "";
    this.keyElements = [];
  }

  // Getter for accessing key elements (for advanced customization)
  public getKeys(): HTMLElement[] {
    return [...this.keyElements];
  }

  // Get current progress as percentage
  public getCurrentProgress(): number {
    const totalNotes = 8; // Just 8 quality notes
    return (this.currentMelodyIndex / totalNotes) * 100;
  }

  // Audio control methods
  public setAudioEnabled(enabled: boolean): void {
    this.options.enableAudio = enabled;
    if (enabled && !this.audioContext) {
      this.initializeAudio();
    }
  }

  public setAudioVolume(volume: number): void {
    this.options.audioVolume = Math.max(0, Math.min(1, volume));
  }

  public getAudioEnabled(): boolean {
    return this.options.enableAudio;
  }

  public getAudioVolume(): number {
    return this.options.audioVolume;
  }
}

// Factory function for easy creation
export function createPianoAnimation(
  container: HTMLElement,
  options?: PianoAnimationOptions
): PianoAnimation {
  return new PianoAnimation(container, options);
}

// Audio-enabled factory function with church-appropriate audio settings
export function createPianoAnimationWithAudio(
  container: HTMLElement,
  options?: Omit<PianoAnimationOptions, "enableAudio">
): PianoAnimation {
  return new PianoAnimation(container, {
    ...options,
    enableAudio: true,
    audioVolume: options?.audioVolume || 0.25, // Softer, more reverent
    audioType: options?.audioType || "generated",
    animationSpeed: options?.animationSpeed || 800, // Slower for quality chromatic scale
  });
}

// Utility functions for piano key management
export const PianoUtils = {
  // Convert key index to note name (simplified)
  getNoteName(keyIndex: number): string {
    const notes = [
      "G",
      "G#",
      "A",
      "A#",
      "B",
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "E#",
      "F#",
    ];
    return notes[keyIndex % 12];
  },

  // Check if key index represents a black key
  isBlackKey(keyIndex: number): boolean {
    const blackKeys = [1, 3, 6, 8, 10];
    return blackKeys.includes(keyIndex % 12);
  },

  // Generate chromatic scale sequence for loading
  generateChromaticKeySequence(totalKeys: number): number[] {
    const sequence: number[] = [];
    for (let i = 0; i < totalKeys * 2; i++) {
      // Two full cycles
      sequence.push(i % totalKeys);
    }
    return sequence;
  },

  // Audio utility functions
  getOptimalVolumeForGrandPiano(
    environmentType: "loading" | "interactive" = "loading"
  ): number {
    return environmentType === "loading" ? 0.2 : 0.3; // Slightly higher for grand piano richness
  },

  // Create simple chromatic chord progressions
  generateChromaticChordProgression(baseKeyIndex: number = 0): number[] {
    // Simple ascending chromatic progression
    const progression = [0, 1, 2, 3, 4]; // Five consecutive semitones
    return progression.map((offset) => (baseKeyIndex + offset) % 12);
  },

  // Generate chromatic scale frequencies
  generateChromaticFrequencies(
    startNote: number = 261.63,
    octaves: number = 2
  ): number[] {
    const frequencies: number[] = [];
    const totalSemitones = 12 * octaves;

    for (let i = 0; i < totalSemitones; i++) {
      const frequency = startNote * Math.pow(2, i / 12);
      frequencies.push(frequency);
    }

    return frequencies;
  },

  // Generate passing chord sequence for smooth voice leading
  generatePassingChordSequence(startKey: number, endKey: number): number[] {
    const sequence: number[] = [];
    const step = startKey < endKey ? 1 : -1;

    for (let i = startKey; i !== endKey; i += step) {
      sequence.push(i);
    }
    sequence.push(endKey);

    return sequence;
  },

  // Get grand piano harmonic intervals for rich sound
  getGrandPianoHarmony(fundamentalKey: number): number[] {
    return [
      fundamentalKey, // Root
      fundamentalKey + 4, // Major third
      fundamentalKey + 7, // Perfect fifth
      fundamentalKey + 12, // Octave
    ];
  },

  // Convert Amazing Grace scale degrees to frequencies
  scaleDegreesToFrequencies(scaleDegrees: number[]): number[] {
    const gMajorScale = {
      1: 391.995, // G4 - Tonic
      2: 440.0, // A4 - Supertonic
      3: 493.883, // B4 - Mediant
      4: 523.251, // C5 - Subdominant
      5: 587.33, // D5 - Dominant
      6: 659.255, // E5 - Submediant
      7: 698.456, // F#5 - Leading tone
      8: 783.991, // G5 - Octave
    };

    return scaleDegrees.map(
      (degree) =>
        gMajorScale[degree as keyof typeof gMajorScale] || gMajorScale[1]
    );
  },

  // Get the tempo marking for Amazing Grace (traditional hymn tempo)
  getAmazingGraceTempo(): { bpm: number; description: string } {
    return {
      bpm: 75,
      description: "Andante - walking pace, reverent and contemplative",
    };
  },

  // Calculate note duration based on hymn tempo
  calculateNoteDuration(bpm: number = 75): number {
    // Quarter note duration in milliseconds
    return (60 / bpm) * 1000;
  },
};
