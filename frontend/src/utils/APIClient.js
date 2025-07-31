// Backend API ile iletişim için client fonksiyonları

// API base URL - geliştirme ortamı için
const API_BASE_URL = 'http://localhost:8080/api'

// HTTP helper fonksiyonu
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    }
    
    const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    }
    
    try {
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
        
        const response = await fetch(url, requestOptions)
        const data = await response.json()
        
        if (!response.ok) {
            throw new Error(data.error || data.message || `HTTP ${response.status}`)
        }
        
        console.log(`✅ API Response:`, data)
        return data
    } catch (error) {
        console.error(`❌ API Error: ${options.method || 'GET'} ${url}`, error)
        throw error
    }
}

// Oyun durumu API fonksiyonları
export const GameStateAPI = {
    // Oyun durumunu kaydet
    async save(userId, gameState) {
        const requestData = {
            userId: userId,
            currentScore: gameState.currentScore || 0,
            currentBlind: gameState.currentBlind || 1,
            money: gameState.money || 50,
            lives: gameState.lives || 3,
            discardsLeft: gameState.discardsLeft || 3,
            handsLeft: gameState.handsLeft || 4,
            deckCards: gameState.deckCards || [],
            handCards: gameState.handCards || [],
            jokers: gameState.jokers || [],
            planetLevels: gameState.planetLevels || {}
        }
        
        return await apiRequest('/game-state', {
            method: 'POST',
            body: JSON.stringify(requestData)
        })
    },
    
    // Oyun durumunu yükle
    async load(userId) {
        return await apiRequest(`/game-state/${userId}`)
    },
    
    // Oyun durumunu sil
    async delete(userId) {
        return await apiRequest(`/game-state/${userId}`, {
            method: 'DELETE'
        })
    }
}

// Yüksek skor API fonksiyonları
export const HighscoreAPI = {
    // Yüksek skor kaydet
    async save(userId, playerName, score, finalBlind, jokersUsed = [], seed = '') {
        const requestData = {
            userId: userId,
            playerName: playerName,
            score: score,
            finalBlind: finalBlind,
            jokersUsed: jokersUsed,
            seed: seed
        }
        
        return await apiRequest('/highscores', {
            method: 'POST',
            body: JSON.stringify(requestData)
        })
    },
    
    // Yüksek skorları listele
    async getList(limit = 10, offset = 0, userId = null) {
        let endpoint = `/highscores?limit=${limit}&offset=${offset}`
        if (userId) {
            endpoint += `&userId=${userId}`
        }
        
        return await apiRequest(endpoint)
    },
    
    // Kullanıcının en yüksek skorunu al
    async getUserBest(userId) {
        return await apiRequest(`/highscores/user/${userId}`)
    }
}

// Sistem API fonksiyonları
export const SystemAPI = {
    // Sistem sağlık durumunu kontrol et
    async health() {
        return await apiRequest('/health')
    },
    
    // API bilgilerini al
    async info() {
        return await apiRequest('/info')
    }
}

// Yardımcı fonksiyonlar
export const APIUtils = {
    // Hata mesajını kullanıcı dostu formata çevir
    formatError(error) {
        if (error.message) {
            return error.message
        }
        if (typeof error === 'string') {
            return error
        }
        return 'Bilinmeyen bir hata oluştu'
    },
    
    // API yanıtının başarılı olup olmadığını kontrol et
    isSuccess(response) {
        return response && response.success === true
    },
    
    // API yanıtından veriyi çıkar
    getData(response) {
        return response && response.data ? response.data : null
    },
    
    // Rastgele kullanıcı ID'si oluştur (test için)
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9)
    }
}

// Test fonksiyonları (geliştirme için)
export const APITest = {
    // API bağlantısını test et
    async testConnection() {
        try {
            const response = await SystemAPI.health()
            console.log('🟢 API bağlantısı başarılı:', response)
            return true
        } catch (error) {
            console.error('🔴 API bağlantısı başarısız:', error)
            return false
        }
    },
    
    // Oyun durumu kaydetme/yükleme testi
    async testGameState() {
        const testUserId = APIUtils.generateUserId()
        const testGameState = {
            currentScore: 12345,
            currentBlind: 3,
            money: 50,
            lives: 2,
            discardsLeft: 1,
            handsLeft: 3,
            deckCards: [],
            handCards: [],
            jokers: [{id: 'red_card', level: 1, is_active: true, stats: {}}],
            planetLevels: {flush: 1}
        }
        
        try {
            // Kaydet
            const saveResponse = await GameStateAPI.save(testUserId, testGameState)
            console.log('🟢 Oyun durumu kaydedildi:', saveResponse)
            
            // Yükle
            const loadResponse = await GameStateAPI.load(testUserId)
            console.log('🟢 Oyun durumu yüklendi:', loadResponse)
            
            return true
        } catch (error) {
            console.error('🔴 Oyun durumu testi başarısız:', error)
            return false
        }
    },
    
    // Yüksek skor testi
    async testHighscore() {
        const testUserId = APIUtils.generateUserId()
        
        try {
            // Kaydet
            const saveResponse = await HighscoreAPI.save(
                testUserId, 
                'Test Player', 
                98765, 
                5, 
                ['red_card', 'odd_todd']
            )
            console.log('🟢 Yüksek skor kaydedildi:', saveResponse)
            
            // Listele
            const listResponse = await HighscoreAPI.getList(5)
            console.log('🟢 Yüksek skorlar listelendi:', listResponse)
            
            return true
        } catch (error) {
            console.error('🔴 Yüksek skor testi başarısız:', error)
            return false
        }
    }
}