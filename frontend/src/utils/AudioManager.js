// Ses yönetimi ve efektleri
export default class AudioManager {
    constructor(scene) {
        this.scene = scene
        this.sounds = {}
        this.music = null
        this.musicVolume = 0.3
        this.sfxVolume = 0.7
        this.musicEnabled = true
        this.sfxEnabled = true
        
        // Placeholder ses verileri (gerçek ses dosyaları yerine)
        this.soundData = this.createPlaceholderSounds()
        
        console.log('🔊 AudioManager başlatıldı')
    }
    
    // Placeholder ses verileri oluştur (gerçek ses dosyaları olmadığında)
    createPlaceholderSounds() {
        return {
            // Kart sesleri
            cardDeal: { frequency: 440, duration: 0.1, type: 'square' },
            cardFlip: { frequency: 660, duration: 0.05, type: 'triangle' },
            cardSelect: { frequency: 880, duration: 0.08, type: 'sine' },
            cardPlay: { frequency: 550, duration: 0.15, type: 'sawtooth' },
            
            // Skor ve başarı sesleri
            scoreGain: { frequency: 330, duration: 0.2, type: 'sine' },
            bigScore: { frequency: 220, duration: 0.3, type: 'square' },
            blindComplete: { frequency: 440, duration: 0.5, type: 'triangle' },
            
            // Joker sesleri
            jokerTrigger: { frequency: 880, duration: 0.12, type: 'square' },
            jokerBuy: { frequency: 660, duration: 0.25, type: 'triangle' },
            
            // UI sesleri
            buttonClick: { frequency: 770, duration: 0.06, type: 'square' },
            buttonHover: { frequency: 990, duration: 0.04, type: 'sine' },
            shopOpen: { frequency: 440, duration: 0.3, type: 'triangle' },
            
            // Para sesleri
            moneyGain: { frequency: 523, duration: 0.18, type: 'sine' },
            moneySpend: { frequency: 349, duration: 0.15, type: 'triangle' },
            
            // Özel efektler
            sparkle: { frequency: 1320, duration: 0.1, type: 'sine' },
            magic: { frequency: 880, duration: 0.2, type: 'square' },
            success: { frequency: 523, duration: 0.4, type: 'triangle' }
        }
    }
    
    // Ses efekti çal
    playSFX(soundName, options = {}) {
        if (!this.sfxEnabled) return
        
        try {
            const soundConfig = this.soundData[soundName]
            if (!soundConfig) {
                console.warn(`Ses bulunamadı: ${soundName}`)
                return
            }
            
            // Web Audio API kullanarak basit ses oluştur
            this.createBeepSound(
                soundConfig.frequency, 
                soundConfig.duration, 
                soundConfig.type,
                options.volume || this.sfxVolume
            )
            
            console.log(`🔊 Ses çalındı: ${soundName}`)
            
        } catch (error) {
            console.warn('Ses çalma hatası:', error)
        }
    }
    
    // Web Audio API ile basit beep sesi oluştur
    createBeepSound(frequency, duration, type = 'sine', volume = 0.5) {
        try {
            const audioContext = this.getAudioContext()
            if (!audioContext) return
            
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
            oscillator.type = type
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + duration)
            
        } catch (error) {
            console.warn('Web Audio API hatası:', error)
        }
    }
    
    // AudioContext'i al veya oluştur
    getAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
            } catch (error) {
                console.warn('AudioContext oluşturulamadı:', error)
                return null
            }
        }
        return this.audioContext
    }
    
    // Müzik çal (placeholder)
    playMusic(musicName, loop = true) {
        if (!this.musicEnabled) return
        
        console.log(`🎵 Müzik başlatıldı: ${musicName}`)
        
        // Basit ambient müzik simülasyonu
        this.startAmbientMusic()
    }
    
    // Basit ambient müzik simülasyonu
    startAmbientMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval)
        }
        
        const playAmbientNote = () => {
            if (!this.musicEnabled) return
            
            const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88] // C major scale
            const randomNote = notes[Math.floor(Math.random() * notes.length)]
            
            this.createBeepSound(randomNote, 0.5, 'sine', this.musicVolume * 0.3)
        }
        
        // Her 3-5 saniyede bir nota çal
        this.musicInterval = setInterval(() => {
            if (Math.random() < 0.4) { // %40 şans
                playAmbientNote()
            }
        }, 3000 + Math.random() * 2000)
    }
    
    // Müziği durdur
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval)
            this.musicInterval = null
        }
        console.log('🎵 Müzik durduruldu')
    }
    
    // Ses seviyesi ayarları
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume))
        console.log(`🔊 SFX seviyesi: ${this.sfxVolume}`)
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume))
        console.log(`🎵 Müzik seviyesi: ${this.musicVolume}`)
    }
    
    // Ses açık/kapalı
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled
        console.log(`🔊 SFX: ${this.sfxEnabled ? 'Açık' : 'Kapalı'}`)
        return this.sfxEnabled
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled
        if (!this.musicEnabled) {
            this.stopMusic()
        } else {
            this.startAmbientMusic()
        }
        console.log(`🎵 Müzik: ${this.musicEnabled ? 'Açık' : 'Kapalı'}`)
        return this.musicEnabled
    }
    
    // Çoklu ses efekti (akor gibi)
    playChord(frequencies, duration = 0.3, type = 'sine') {
        if (!this.sfxEnabled) return
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createBeepSound(freq, duration, type, this.sfxVolume * 0.6)
            }, index * 50) // Hafif staggered
        })
    }
    
    // Özel efekt: Başarı fanfarı
    playSuccessFanfare() {
        const notes = [523.25, 659.25, 783.99, 1046.50] // C-E-G-C
        this.playChord(notes, 0.6, 'triangle')
    }
    
    // Özel efekt: Hata sesi
    playErrorSound() {
        this.createBeepSound(200, 0.3, 'sawtooth', this.sfxVolume)
        setTimeout(() => {
            this.createBeepSound(150, 0.2, 'sawtooth', this.sfxVolume)
        }, 150)
    }
    
    // Temizlik
    destroy() {
        this.stopMusic()
        if (this.audioContext) {
            this.audioContext.close()
        }
        console.log('🔊 AudioManager temizlendi')
    }
}

// Oyun genelinde kullanım için global instance
let globalAudioManager = null

export function getAudioManager() {
    return globalAudioManager
}

export function setAudioManager(audioManager) {
    globalAudioManager = audioManager
}