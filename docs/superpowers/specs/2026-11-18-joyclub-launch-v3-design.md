# Joy Club — Video Launching 16:9, versi 3 (design)

Tarikh: 18 Nov 2026 · Status: draf design, menunggu kelulusan Nas
Folder kod: `joyclub-launch-16x9/` (repo nazgram/REMOTION, branch `claude/project-thread-ljjwrj`)

## 1. Tujuan

Video reveal koleksi **Joy Club** (NAFESA) yang ditayang **sekali** di **skrin LED besar Full HD**. Ia menggantikan draf 1 dan draf 2, dan guna raw baru yang sudah di-grade.
Rasa yang Nas mahu: **smooth, ikut beat, bersih** macam katalog Joy Club. Potongan laju dibenarkan, tapi mesti hard cut yang bersih.

Video dikira berjaya kalau penonton di dewan:
1. nampak kelima-lima design dengan jelas, berserta nama setiap satu;
2. rasa video tu mengalir dengan lagu, tanpa efek yang murah;
3. habis dengan logo JOY CLUB, kemudian logo NAFESA.

## 2. Matlamat, bukan matlamat, anti-matlamat

**Matlamat**
- 1920x1080, maksimum 45 saat, lagu Snap Back.
- Isi utama ialah footage **vertical** dalam grid 2 atau 3 panel yang **penuh skrin**.
- Footage **landscape** dipakai sesekali untuk close-up detail.
- Elemen **bulatan gaya katalog** dengan motion **scale** (pop, membesar, mengecil), muncul pada momen tertentu.
- Nama rasmi setiap design keluar sekali bagi setiap colorway.

**Bukan matlamat**
- Klip kain AI atau penjanaan AI (tiada kredit AI).
- Tagline selain "AVAILABLE NOW". Nas akan bagi kemudian; jangan reka.
- Nama kain (Silky Cotton Voile), harga atau kod produk.

**Anti-matlamat** (gagal walaupun teknikalnya jalan)
- Transition heartbeat, zoom pulse, atau zoom in/out pada **footage**.
- Fast cut yang "flashy" dengan efek pada setiap potongan.
- Frame yang sesak: ruang kosong, border tebal, atau elemen sepanjang masa.
- Bulatan yang sentiasa ada. Ia hanya untuk momen tertentu.

## 3. Bahan (semua dalam folder Drive Nas "FULL VIDOE JOY CLUB")

| Bahan | Spec / nota |
|---|---|
| `VERCITAL.mp4` | 1080x1920, 59.94fps, 107.86s, tanpa audio, sudah di-grade |
| `Landscape 2.mp4` | 1920x1080, 59.94fps, 107.86s, tanpa audio, sudah di-grade. Kualitinya kurang sikit menurut Nas |
| `Snap Back.mp3` | 2:55, lebih kurang 108 BPM (beat ≈ 0.55s, bar ≈ 2.2s) |
| `JoyClub_Typography-01/-02.png` | Logo JOY CLUB 4500px (sebaris / bertingkat), JOY biru muda, CLUB merah, dot dalam huruf O dan U |
| `Logo_Nafesa-02/04/05.png` | 02 hijau olive, 04 putih, 05 hitam |
| `Poppins-Full-Version.zip` | Font teks (sama dengan katalog) |
| SVG colorway | Corak dot asli kain (viewBox 3240, ~1000 dot) |
| `Catalog_JoyClub.pdf` | Nama rasmi dan rujukan vibe |

**Dua kamera serentak.** Kedua-dua video berada pada timeline yang sama. Vertical tunjuk badan penuh, landscape tunjuk close-up momen yang sama. Blok colorway (sama dalam kedua-dua fail, dengan skrin hitam di antaranya):

| Design (katalog) | Nama lama | Masa dalam raw |
|---|---|---|
| SKY (NJC05) | Sky blue Red | 0:00 – 0:20.4 |
| BLUSH (NJC01) | Sage Taupe | 0:24.1 – 0:47.4 |
| SILVER (NJC04) | Silver Brownie | 0:50.1 – 1:04.2 |
| RUBY (NJC03) | Red Sky blue | 1:07.0 – 1:27.7 |
| PEARL (NJC02) | White Sky blue | 1:30.3 – 1:47.9 |

**Warna setiap design** (dari SVG dan katalog):

| Design | Warna kain / dot | Warna bulatan aksen (gaya katalog) |
|---|---|---|
| PEARL | #ffffff / #a0c4e1 | biru muda #a0c4e1 |
| BLUSH | #d1bdc1 / #738476 | pink #d1bdc1 + hijau sage #738476 |
| SILVER | #d8d8d8 / #5c484d | kelabu #d8d8d8 + coklat gelap #5c484d |
| SKY | #a0c4e1 / #b11f24 | biru muda + merah |
| RUBY | #b11f24 / #a0c4e1 | merah #b11f24 + biru muda |

## 4. Pendekatan yang dipertimbang

1. **Remotion (dipilih Nas).** Semua potongan, bulatan dan transition dibina dalam code, jadi tepat ikut beat dan bulatan kekal tajam. Footage dipilih melalui contact sheet bernombor dan di-render semula setiap revisi (lebih kurang 20 hingga 40 minit). Nas tak boleh edit sendiri secara terus.
2. Premiere Pro dalam Mac Nas. Nas boleh tukar footage sendiri, tapi bulatan, dot sapu dan cutout kena dibina manual. Lebih lambat dan susah nak kekal tepat ikut beat.
3. Hibrid: Remotion hasilkan lapisan grafik telus, Nas susun footage dalam Premiere. Ada dua langkah dan risiko timing tak padan.

Nas pilih **1** pada 18 Nov 2026.

## 5. Keputusan yang Nas dah buat

- **Grid vertical** 2 atau 3 panel yang penuh skrin, tiada elemen lain dalam frame selain momen bulatan.
- **Landscape** sesekali untuk close-up detail.
- **Hard cut bersih** untuk potongan laju, tepat atas beat.
- **Tiga transition, setiap satu ada tugas sendiri:**
  - **A. Dot sapu skrin** untuk tukar colorway. Corak dot design seterusnya menyapu skrin.
  - **C. Shape cutout ikut beat** (gaya draf 2) untuk tukar layout dalam colorway yang sama, contohnya 3 panel ke 2 panel.
  - **B. Match cut vertical ke landscape** pada gerak yang sama, untuk momen close-up.
- **Bulatan gaya katalog:** bulatan besar warna solid dari tepi frame, lebih banyak, dengan motion scale (pop masuk, membesar, mengecil). Motion hanya pada bulatan, bukan pada footage.
- **Lagu Snap Back**, habis di 0:46.
- Guna nama design dari katalog.
- Bina dalam Remotion; footage dipilih oleh Nas.

## 6. Aliran (≈ 20 bar × 2.2s ≈ 45s)

Masa di bawah ialah sasaran. Pembina mesti padankan setiap potongan dengan **beat sebenar yang dikesan** dalam lagu, bukan grid tetap (lihat §8).

| Bar | Masa video | Isi |
|---|---|---|
| 1–2 | 0:00–0:04.4 | **Intro.** Latar cream. Bulatan semua warna pop masuk satu setiap beat dari tepi, membesar dan mengecil, kemudian bergabung ke tengah. Dot sapu (A) dengan corak PEARL membuka colorway pertama. |
| 3–5 | 0:04.4–0:11.0 | **PEARL** |
| 6–8 | 0:11.0–0:17.6 | **BLUSH** |
| 9–11 | 0:17.6–0:24.2 | **SILVER** |
| 12–14 | 0:24.2–0:30.8 | **SKY** |
| 15–17 | 0:30.8–0:37.4 | **RUBY** |
| 18 | 0:37.4–0:39.6 | **Klimaks.** 5 panel vertical penuh skrin, satu setiap design, hard cut serentak atas beat. Bulatan semua warna pop pada tepi. |
| 19 | 0:39.6–0:42.4 | **JOY CLUB.** Bulatan mengecil dan bergerak masuk menjadi dot dalam huruf O dan U, kemudian logo typography penuh muncul atas latar cream, dengan "AVAILABLE NOW" di bawahnya. |
| 20 | 0:42.4–0:45.0 | **NAFESA.** Logo olive (02) atas latar cream, bulatan olive dan tan di tepi macam muka akhir katalog. Lagu fade keluar. |

**Susunan design:** PEARL → BLUSH → SILVER → SKY → RUBY, dari lembut ke garang. RUBY di akhir sebab merah dan biru mudanya terus bersambung dengan warna logo JOY CLUB. *(Pilihan saya.)*

### Corak setiap colorway (3 bar)

```
Bar 1  [A dot sapu masuk] → grid 3 panel vertical penuh skrin
       hard cut panel ikut beat (bukan semua panel serentak)
       momen nama: 2–3 bulatan aksen pop dari tepi (scale), nama design
       keluar, kemudian bulatan mengecil dan keluar dalam 1 bar
Bar 2  [C shape cutout ikut beat] → grid 2 panel vertical penuh skrin
       hard cut ikut beat
Bar 3  [B match cut] dari satu panel vertical → landscape close-up penuh skrin
       (detail kain atau muka) sepanjang lebih kurang 1 bar
       → [A dot sapu] ke design seterusnya
```
Peraturan: paling banyak **satu transition setiap bar**. Selebihnya hard cut.

### Layout panel
- 3 panel: setiap panel 640x1080. 2 panel: setiap panel 960x1080. Footage vertical di-cover (crop atas dan bawah), tiada zoom pulse. Gerak drift yang sangat perlahan dibenarkan.
- Pemisah panel: garis putih nipis 4px. *(Pilihan saya, sebab "tiada benda lain". Boleh jadi 0px kalau Nas nak.)*
- Klimaks 5 panel: setiap panel 384x1080.

### Teks
- Nama design (PEARL, BLUSH, SILVER, SKY, RUBY): Poppins Bold, huruf besar, warna utama design atau putih bila latar terlalu cerah. Ditambah "JOY CLUB COLLECTION" kecil di bawah, macam katalog.
- Kedudukan: tengah bawah atau tengah frame, tanpa shadow atau stroke. Bila latar footage terlalu sibuk, gunakan bulatan solid di belakang nama sebagai alas.
- **AVAILABLE NOW**: Joy Club sudah dijual, jadi teks ini keluar di bawah logo JOY CLUB (Poppins, huruf besar, jarak huruf lebar). Pilihan saya berbanding "You can get now"; Nas buat keputusan akhir.
- Tiada teks lain sehingga Nas bagi tagline.

### Bulatan (elemen utama motion)
- Bulatan solid besar (diameter 200–700px), sebahagiannya terkeluar dari tepi frame, dalam warna aksen design (§3).
- Motion: pop masuk dengan scale 0 → 1.1 → 1 atas beat, membesar dan mengecil perlahan (0.9–1.15) ikut beat, dan keluar dengan scale ke 0. Tidak ada di skrin sepanjang masa.
- Muncul pada: intro, momen nama setiap colorway, klimaks, peralihan ke logo JOY CLUB, dan muka NAFESA.

### Dot sapu (transition A)
- Corak dot asli dari SVG design seterusnya (latar + dot, tanpa wordmark NAFESA dalam SVG). Dot membesar dari tepi frame dengan scale berperingkat sehingga menutup skrin, kemudian membuka grid design baru. Jumlah tempoh 1 hingga 2 beat.
- Mesti nampak berbeza dari "dot bloom" bulatan tunggal draf 1, kerana itu yang Nas rasa terlalu biasa.

### Slow motion dan speed ramp (Nas minta, 18 Nov)
- Footage asal 59.94fps dan output 60fps. Slow motion sehingga **50% kelajuan** kekal smooth: setiap frame asal dipaparkan dua kali, jadi rasanya macam video 30fps biasa. Lebih perlahan dari 50% akan nampak tersekat, jadi tidak digunakan.
- Speed ramp (laju → perlahan → laju) dipakai pada momen tertentu: close-up landscape (B), momen nama design, dan sebelum klimaks. Ramp mesti berakhir tepat atas beat supaya hard cut seterusnya kekal ikut lagu.
- Frame interpolation AI tidak digunakan, sebab ia boleh merosakkan tangan dan tepi kain.

## 7. SFX
- Pop halus untuk bulatan dan whoosh lembut untuk dot sapu, pada isipadu rendah di bawah lagu. *(Pilihan saya, mengikut rancangan asal "SFX buat sendiri".)*

## 8. Teknikal
- Lagu: potong 0:01–0:46 (45s). Fade masuk 0.3s, fade keluar sepanjang bar 20.
- **Beat:** kesan beat dengan librosa dan simpan sebagai `beats.json`. Semua potongan dan pop bulatan ikut senarai ini. Anggaran tempo berbeza-beza antara 108 dan 111 BPM, jadi grid tetap tak boleh dipercayai.
- **Footage:** transcode kedua-dua raw ke proxy untuk preview. Render final ambil terus dari raw (1080 lebar untuk vertical, 1920 untuk landscape).
- **Pemilihan footage:** sediakan contact sheet bernombor bagi setiap design (vertical dan landscape, satu thumbnail setiap 1s dengan cap masa). Nas pilih nombor untuk setiap slot. Sementara menunggu, pembina isi pilihan sementara. Shot list disimpan dalam satu fail data (`shots.ts`) supaya senang ditukar.
- **Match cut:** kedua-dua kamera dianggap serentak (offset 0). Sahkan offset tepat dengan satu momen gerak yang jelas, contohnya saat 0:30 dan 1:35, sebelum bina.
- **Output:** 1920x1080, **60fps** supaya gerak bulatan lebih licin di LED (footage asal 59.94fps). Masa render lebih kurang dua kali ganda draf 2. *(Pilihan saya.)*
- Tiada kredit AI.

### Sumber fail
- Semua bahan v3 boleh dimuat turun terus dari Drive dengan `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`. Salinan lagu, typography dan contact sheet ada di `/mnt/project-files/joy-club/launch-16x9/v3-raw-baru/`. Media kekal di-gitignore. Ada satu SVG untuk setiap 5 design (nama lama: White Sky blue, Sage Taupe, _Silver Brownie, Sky blue Red, Red Sky blue).
- Bahan draf 1 dan 2 dalam `public/` (lagu 136 BPM, C46xx, kain AI) tidak digunakan lagi.

### Crop panel *(pilihan saya)*
- Panel 2 (960 lebar) memotong lebih kurang 37% tinggi klip, dan panel klimaks (384 lebar) memotong lebih kurang 37% lebarnya.
- Shot badan penuh hanya dalam slot 3 panel. Slot 2 panel untuk shot separuh badan atau detail. Klimaks guna shot pinggang ke atas.
- `shots.ts` menyimpan `focusY` (titik crop) untuk setiap slot. Contact sheet tunjuk shot dengan cap masa; Nas pilih nombor, dan pembina tetapkan crop.

### Kawasan selamat LED *(pilihan saya)*
- Nama design dan logo diletak dalam kawasan 90% tengah frame (jauh 54px dari atas dan bawah). Bulatan boleh terkeluar dari tepi kerana ia hiasan.
- Render 60fps H.264 MP4. Kalau pemain LED tidak terima 60p, tukar ke 30fps dengan ffmpeg tanpa render semula.

## 9. Diserahkan kepada pembina
- Kedudukan tepat bulatan dan saiznya dalam setiap momen.
- Lengkung easing, selagi pop terasa smooth dan bukan bounce yang kuat.
- Bentuk cutout bagi setiap transition C, selagi ia sejajar dengan garis panel.

## 10. Langkah seterusnya
1. Nas luluskan design ini.
2. Tulis plan pelaksanaan.
3. Hantar contact sheet footage kepada Nas untuk dipilih. Render draf v3.
