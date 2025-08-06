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
  audioType?: 'generated' | 'files'; // Use generated tones or audio files
}

export class PianoAnimation {
  private container: HTMLElement;
  private keyElements: HTMLElement[] = [];
  private currentKeyIndex = 0;
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
      animationSpeed: options.animationSpeed || 100,
      glowColor: options.glowColor || "rgba(255, 215, 0, 0.6)",
      enableAudio: options.enableAudio !== undefined ? options.enableAudio : true,
      audioVolume: options.audioVolume || 0.3,
      audioType: options.audioType || 'generated',
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
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Handle audio context state for user interaction requirements
      if (this.audioContext.state === 'suspended') {
        // Try to resume immediately (works in Electron)
        await this.audioContext.resume();
        
        // If still suspended, set up user interaction listener
        if (this.audioContext.state === 'suspended') {
          const resumeAudio = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
              await this.audioContext.resume();
              console.log('Piano audio context resumed after user interaction');
            }
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
          };
          
          document.addEventListener('click', resumeAudio, { once: true });
          document.addEventListener('keydown', resumeAudio, { once: true });
        }
      }
      
      console.log('Piano audio initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize piano audio:', error);
      this.options.enableAudio = false;
    }
  }

  private generatePianoTone(frequency: number, duration: number = 0.3): void {
    if (!this.audioContext || !this.options.enableAudio) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Connect oscillator to gain to output
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set oscillator properties for piano-like sound
      oscillator.type = 'triangle'; // More piano-like than sine
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      // Create ADSR envelope for piano-like sound
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.options.audioVolume, now + 0.01); // Attack
      gainNode.gain.exponentialRampToValueAtTime(this.options.audioVolume * 0.7, now + 0.1); // Decay
      gainNode.gain.setValueAtTime(this.options.audioVolume * 0.5, now + 0.1); // Sustain
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
      
      // Start and stop the oscillator
      oscillator.start(now);
      oscillator.stop(now + duration);
      
    } catch (error) {
      console.warn('Failed to generate piano tone:', error);
    }
  }

  private getKeyFrequency(keyIndex: number): number {
    // Piano key frequencies starting from C4 (middle C = 261.63 Hz)
    // This creates a pentatonic scale for more pleasant loading sounds
    const baseFrequencies = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50, // C6
      1174.66, // D6
      1318.51, // E6
      1567.98, // G6
      1760.00, // A6
    ];
    
    return baseFrequencies[keyIndex % baseFrequencies.length];
  }

  private playKeySound(keyIndex: number): void {
    if (!this.options.enableAudio) return;
    
    const frequency = this.getKeyFrequency(keyIndex);
    const isBlackKey = this.keyElements[keyIndex]?.getAttribute("data-key-type") === "black";
    
    // Black keys have slightly shorter duration and different timbre
    const duration = isBlackKey ? 0.25 : 0.3;
    
    this.generatePianoTone(frequency, duration);
  }

  public playKey(index: number): void {
    if (index < 0 || index >= this.keyElements.length) return;

    const key = this.keyElements[index];
    const isBlack = key.getAttribute("data-key-type") === "black";

    // Play piano sound
    this.playKeySound(index);

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
    }, 250);
  }

  public startProgressAnimation(
    onProgress?: (progress: number) => void,
    onComplete?: () => void
  ): void {
    this.currentKeyIndex = 0;
    let progress = 0;
    const totalProgress = 100;

    this.progressInterval = setInterval(() => {
      // Simulate realistic loading progress
      const increment = Math.random() * 15 + 5;
      progress = Math.min(progress + increment, totalProgress);

      // Calculate which key should be playing based on progress
      const targetKeyIndex = Math.floor(
        (progress / totalProgress) * this.keyElements.length
      );

      // Play keys sequentially as we progress
      if (
        targetKeyIndex > this.currentKeyIndex &&
        this.currentKeyIndex < this.keyElements.length
      ) {
        this.playKey(this.currentKeyIndex);
        this.currentKeyIndex++;
      }

      // Call progress callback
      if (onProgress) {
        onProgress(progress);
      }

      // Check if complete
      if (progress >= totalProgress) {
        this.completeAnimation(onComplete);
      }
    }, this.options.animationSpeed);
  }

  private completeAnimation(onComplete?: () => void): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Play remaining keys in rapid succession for finale
    const finalKeys = setInterval(() => {
      if (this.currentKeyIndex < this.keyElements.length) {
        this.playKey(this.currentKeyIndex);
        this.currentKeyIndex++;
      } else {
        clearInterval(finalKeys);

        // Grand finale - play all keys together for a chord
        setTimeout(() => {
          this.playAllKeys();

          // Call completion callback after finale
          setTimeout(() => {
            if (onComplete) {
              onComplete();
            }
          }, 500);
        }, 200);
      }
    }, 50); // Faster succession for finale
  }

  private playAllKeys(): void {
    this.keyElements.forEach((key, index) => {
      setTimeout(() => {
        this.playKey(index);
      }, Math.random() * 100); // Slight randomization for natural chord effect
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
  }

  public reset(): void {
    this.stop();
    this.currentKeyIndex = 0;
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
    return (this.currentKeyIndex / this.keyElements.length) * 100;
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

// Audio-enabled factory function with default audio settings
export function createPianoAnimationWithAudio(
  container: HTMLElement,
  options?: Omit<PianoAnimationOptions, 'enableAudio'>
): PianoAnimation {
  return new PianoAnimation(container, {
    ...options,
    enableAudio: true,
    audioVolume: options?.audioVolume || 0.3,
    audioType: options?.audioType || 'generated',
  });
}

// Utility functions for piano key management
export const PianoUtils = {
  // Convert key index to note name (simplified)
  getNoteName(keyIndex: number): string {
    const notes = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    return notes[keyIndex % 12];
  },

  // Check if key index represents a black key
  isBlackKey(keyIndex: number): boolean {
    const blackKeys = [1, 3, 6, 8, 10];
    return blackKeys.includes(keyIndex % 12);
  },

  // Generate a pleasing key sequence for loading
  generateKeySequence(totalKeys: number): number[] {
    const sequence: number[] = [];
    for (let i = 0; i < totalKeys; i++) {
      sequence.push(i);
    }
    return sequence;
  },

  // Audio utility functions
  getOptimalVolume(environmentType: 'loading' | 'interactive' = 'loading'): number {
    return environmentType === 'loading' ? 0.2 : 0.4;
  },

  // Create pleasant chord progressions for loading
  generateChordProgression(baseKeyIndex: number = 0): number[] {
    // Generate a pleasant I-V-vi-IV progression
    const progression = [0, 4, 5, 3]; // Relative to base key
    return progression.map(offset => (baseKeyIndex + offset) % 12);
  },
};
