# Balatro Tarzı Web Kart Oyunu

Balatro'dan esinlenerek geliştirilmekte olan roguelike desteci kart oyunu.

## Teknoloji Yığını

### Frontend
- **Phaser 3.90.0** - 2D oyun motoru
- **Vite 6.x** - Hızlı geliştirme ve build aracı
- **JavaScript ES6+** - Modern JavaScript
- **HTML5 Canvas** - 2D rendering

### Backend (Gelecek fazlarda)
- **Go (Golang)** - Backend API
- **Gin** - Web framework
- **MongoDB** - Veritabanı

## Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Frontend'i Çalıştırma

```bash
# Proje dizinine git
cd frontend

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Oyun http://localhost:3000 adresinde açılacaktır.

### Build (Üretim)

```bash
cd frontend
npm run build
```

## Proje Yapısı

```
balatro/
├── frontend/           # Vite + Phaser frontend
│   ├── src/
│   │   ├── scenes/     # Phaser sahneleri
│   │   │   └── GameScene.js
│   │   ├── utils/      # Yardımcı fonksiyonlar
│   │   ├── assets/     # Görseller, sesler
│   │   └── main.js     # Ana entry dosyası
│   ├── public/         # Static dosyalar
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/            # Go + Gin backend (gelecekte)
└── README.md
```

## Oyun Özellikleri (Planlanmış)

### Faz 1: ✅ Tamamlandı
- [x] Temel Phaser + Vite kurulumu
- [x] Responsive canvas (960x540 temel çözünürlük)
- [x] Temel GameScene ve UI
- [x] Varlık yükleme sistemi

### Faz 2: ✅ Tamamlandı
- [x] 52'lik poker destesi veri yapısı (Card sınıfı)
- [x] Kart görselleri ve sprite sistem (CardSprite sınıfı)
- [x] 8 kart dağıtma ve el yönetimi
- [x] Kart seçimi ve etkileşimi (tıklama)
- [x] Poker eli algılama (10 farklı el türü)
- [x] Temel puanlama sistemi (çip + çarpan)
- [x] Enhancement sistemi (6 farklı tip)
- [x] Canlı el önizlemesi
- [x] Puan animasyonları

### Faz 3: ✅ Tamamlandı
- [x] Joker kartları veri yapısı (Joker sınıfı)
- [x] 6 farklı joker tipi (Red Card, Odd Todd, Greedy Joker, Fibonacci, Perfectionist, Juggler)
- [x] Joker sprite sistemi ve UI entegrasyonu
- [x] Joker efektlerinin puanlama sistemine entegrasyonu
- [x] Nadirlık sistemi (common, uncommon, rare, legendary)
- [x] Joker tetikleme koşulları ve otomatik efekt sistemi
- [x] Joker tıklama ile aktif/pasif durumu
- [x] Joker efekt animasyonları
- [x] İstatistik takibi (kaç kez tetiklendi)

### Faz 4: ✅ Tamamlandı
- [x] Go + Gin temel API sunucusu (main.go)
- [x] MongoDB Atlas bağlantı konfigürasyonu
- [x] Veri modelleri (PlayerState, Highscore, Card, Joker)
- [x] Oyun durumu API'leri (POST/GET/DELETE /game-state)
- [x] Yüksek skor API'leri (POST/GET /highscores)
- [x] CORS middleware ve logging
- [x] Sistem sağlık kontrolü (/health, /info)
- [x] Frontend API client'ı (APIClient.js)
- [x] Frontend-Backend entegrasyonu
- [x] API test fonksiyonları

### Faz 5: ✅ Tamamlandı (Tarot/Planet Kartları)
- [x] Planet kartları sistemi (poker eli seviye artırımı)
- [x] Tarot kartları sistemi (tek kullanımlık büyüler)
- [x] Consumable kartlar envanteri
- [x] Kart etkilerinin puanlama sistemine entegrasyonu

### Faz 6: ✅ Tamamlandı (Dükkan Sistemi)
- [x] ShopScene - dükkan arayüzü
- [x] PackOpenScene - paket açma mekaniği
- [x] Para birimi yönetimi
- [x] Joker, Tarot ve Planet kartları satın alma
- [x] Paket türleri ve rastgele içerik sistemi

### Faz 7: ✅ Tamamlandı (UI/UX İyileştirmeleri)
- [x] Glassmorphism tasarım sistemi
- [x] Gelişmiş kart seçim animasyonları ve glow efektleri
- [x] Responsive tasarım (mobil ve desktop uyumu)
- [x] Modern game state feedback display
- [x] Audio control toggle (mute/unmute)
- [x] Gelişmiş hover efektleri ve ses feedback
- [x] Card dealing slide-in animasyonları
- [x] Sparkle parçacık efektleri
- [x] Tooltip sistemi ve poker eli açıklamaları

### Faz 8: ✅ Tamamlandı (Visual Layout Düzenlemeleri)
- [x] Kart metin taşması düzeltmeleri (küçük font boyutları)
- [x] Modern buton grid layout sistemi (flex-wrap ile)
- [x] Duplicate audio toggle icon'ları kaldırıldı
- [x] Mobil responsive kart spacing ve positioning
- [x] Gelişmiş kart seçim görsel ipuçları (inner + outer glow)
- [x] Hover/click animasyonları optimizasyonu
- [x] Kompakt mobil layout için dinamik spacing

## Geliştirme Notları

- Oyun 960x540 temel çözünürlükte tasarlanmıştır
- Piksel art stili için antialiasing kapalı
- WebGL öncelikli rendering (Canvas fallback)
- ES6 modülleri ile modüler kod yapısı

## Test Etme

Oyunu çalıştırdıktan sonra:

### Temel Oynanış:
1. **Kart Seçimi:** Eldeki kartlara tıklayarak seçin (maksimum 5 kart)
2. **El Önizlemesi:** Seçili kartların poker elini canlı olarak görün
3. **Kart Oynama:** "Seçili Kartları Oyna" butonuyla kartları oynayın
4. **Puan Sistemi:** Çip × Çarpan = Toplam Puan formülünü gözlemleyin

### Test Butonları:
- **Yeni El Dağıt:** Rastgele 8 yeni kart dağıtır
- **+100 Skor:** Hızlı skor testi
- **Test Enhancement:** Rastgele kartlara özel özellikler ekler
- **Seçili Kartları Oyna:** Ana oynanış mekaniği
- **Rastgele Joker Ekle:** Nadirlığe göre rastgele joker ekler (maksimum 5)
- **API Test:** Backend API bağlantısını ve fonksiyonlarını test eder
- **Oyunu Kaydet:** Mevcut oyun durumunu MongoDB'ye kaydet
- **Oyunu Yükle:** Kaydedilen oyun durumunu yükle
- **Skor Kaydet:** Mevcut skoru yüksek skorlar tablosuna kaydet

### Joker Sistemi:
- **Joker Tıklama:** Jokerlere tıklayarak aktif/pasif durumlarını değiştirin
- **Hover Efekti:** Jokerler üzerine geldiğinizde açıklama görün
- **Otomatik Efektler:** Jokerler uygun koşullarda otomatik tetiklenir
- **Görsel Geri Bildirim:** Tetiklenen jokerler için parıltı animasyonları

### Faz 7 - Modern UI/UX:
- **Glassmorphism Kartlar:** Modern yarı saydam tasarım ve glow efektleri
- **Responsive Tasarım:** Mobil cihazlarda otomatik uyum
- **Gelişmiş Animasyonlar:** Kartlar desteden süzülerek gelir
- **Ses Kontrolü:** Sağ üst köşedeki 🔊 butonuyla ses açma/kapama
- **Modern Game State:** Glassmorphism feedback paneli
- **Hover Efektleri:** Kartlar ve butonlar üzerine gelince animasyon
- **Tooltip Sistemi:** Poker eli türlerini açıklayan ipuçları

### Faz 8 - Visual Layout Fixes:
- **Optimized Card Text:** Kart üzerindeki değer/tür metinleri artık taşmıyor
- **Modern Button Grid:** Alt kısımdaki butonlar düzenli grid layout'ta
- **Single Audio Toggle:** Sağ üst köşede tek audio control (duplicate kaldırıldı)
- **Mobile Card Fitting:** Mobil cihazlarda kartlar ekrana sığacak şekilde ayarlanır
- **Enhanced Glow Effects:** Seçili kartlarda çift glow efekti (inner + outer)
- **Responsive Spacing:** Ekran boyutuna göre dinamik kart arası mesafe

### Poker Elleri (Güçten Zayıfa):
1. **Royal Flush** (100 çip, x8) - 10-J-Q-K-A aynı renk
2. **Straight Flush** (100 çip, x8) - 5 ardışık kart aynı renk  
3. **Four of a Kind** (60 çip, x7) - 4 aynı değer
4. **Full House** (40 çip, x4) - 3+2 aynı değerler
5. **Flush** (35 çip, x4) - 5 aynı renk
6. **Straight** (30 çip, x4) - 5 ardışık kart
7. **Three of a Kind** (30 çip, x3) - 3 aynı değer
8. **Two Pair** (20 çip, x2) - 2 çift
9. **Pair** (10 çip, x2) - 1 çift  
10. **High Card** (5 çip, x1) - En yüksek kart

### Enhancement Türleri:
- **WILD:** Herhangi bir türe dönüşebilir
- **GLASS:** +2 çarpan, %50 yok olma riski
- **STEEL:** +1 çarpan (elde tutulduğunda)
- **GOLD:** Oynandığında ekstra para
- **BONUS_CHIP:** +1/+2/+4 ekstra çip
- **MULTIPLIER:** +1/+2 ekstra çarpan

### Joker Türleri:
1. **Red Card** [Common] - Her Kupa/Karo kartı +4 Çip
2. **Odd Todd** [Common] - Her tek sayılı kart +2 Çarpan
3. **Greedy Joker** [Uncommon] - Flush eli +20 Çip
4. **Fibonacci** [Rare] - Fibonacci sayısı kartlar (2,3,5,8) +3 Çarpan
5. **Perfectionist** [Legendary] - Can kaybetmezsen +5 Çarpan
6. **Juggler** [Common] - Oyun başında +1 Discard hakkı

### Nadirlık Seviyeleri:
- **Common** (Gri) - %60 şans, 2$ değer
- **Uncommon** (Yeşil) - %25 şans, 5$ değer
- **Rare** (Mavi) - %12 şans, 8$ değer
- **Legendary** (Turuncu) - %3 şans, 15$ değer

## Backend API Kurulumu

### Gereksinimler:
- **Go 1.21+** kurulu olmalı
- **MongoDB Atlas** hesabı (ücretsiz tier yeterli)

### Kurulum Adımları:

1. **Backend dizinine gidin:**
   ```bash
   cd backend
   ```

2. **Go modüllerini yükleyin:**
   ```bash
   go mod download
   ```

3. **Environment dosyasını ayarlayın:**
   ```bash
   cp .env.example .env
   # .env dosyasını düzenleyip MongoDB URI'sini girin
   ```

4. **API sunucusunu başlatın:**
   ```bash
   go run main.go
   ```

### API Endpoints:

**Sistem:**
- `GET /api/health` - Sağlık durumu
- `GET /api/info` - API bilgileri

**Oyun Durumu:**
- `POST /api/game-state` - Oyun durumu kaydet
- `GET /api/game-state/:userId` - Oyun durumu yükle
- `DELETE /api/game-state/:userId` - Oyun durumu sil

**Yüksek Skorlar:**
- `POST /api/highscores` - Yüksek skor kaydet
- `GET /api/highscores` - Yüksek skorları listele
- `GET /api/highscores/user/:userId` - Kullanıcının en yüksek skoru

### Frontend-Backend Test:

1. **Backend'i başlatın:** Port 8080'de çalışacak
2. **Frontend'i başlatın:** Port 3000+ çalışacak  
3. **API Test butonuna** tıklayarak bağlantıyı test edin
4. **Oyun oynayıp kaydet/yükle** butonlarını test edin

## Lisans

Bu proje eğitim ve geliştirme amaçlıdır.