# Petal Pop Drop 4: video teaser LED 16:9 (design ringkas)

Tarikh: 19 Nov 2026. Status: menunggu kelulusan Nas.

## Tujuan
Tayang sekali di skrin LED landscape, sebelum tudung keluar 22/11 12 tengah malam. Aliran ikut video launching Joy Club (blok setiap design dalam panel, klimaks, logo, NAFESA) tetapi rupa Petal Pop Drop 4 (gaya SKILL.md Drop 2: bunga dari print sendiri).

## Ketetapan Nas
- 1920x1080, 16:9, MP4. Lagu April Rain Rhythm - Funky Groove Town, **2:45.5 hingga 3:12 (26.5 s)**, ikut panjang lagu. 103 BPM (1 beat = 0.58 s). Fade 0.5 s di hujung (lagu masih rancak pada 3:12).
- Teks hanya: nama design + "COMING SOON". Tiada VO, tiada tagline lain.
- Gaya panel Joy Club: OK.
- Grade footage (diluluskan, "color good"): exposure/brightness naik, saturation+contrast naik sikit, white/highlight turun sikit. Nilai ujian v1: `eq=contrast=1.08:brightness=0.015:saturation=1.15:gamma=1.04, curves=all='0/0 0.25/0.26 0.5/0.53 0.75/0.77 0.9/0.87 1/0.94'`.
- Pilihan shot: jangan ada orang halang model, jangan shot model belum ready, jangan shot gegar, jangan ambil awal shot. Tiada saat raw berulang di mana-mana.

## Pendekatan
1. **Dipilih: Remotion, satu MP4 penuh** (macam Joy Club v3). Guna semula komponen panel/klimaks Joy Club dan BloomSweep/BloomAccent Drop 2, tukar dot kepada bunga print Drop 4.
2. Premiere XML editable (cara SKILL.md Drop 2): boleh edit sendiri, tapi panel berbentuk 16:9 sukar dibina dalam Premiere. Tak dipilih.
3. Gabung (Remotion overlay + Premiere): lebih banyak langkah untuk tayangan sekali. Tak dipilih.

## Susunan (beat dikira dari 2:45.5)
| Beat | Masa | Bahagian |
|---|---|---|
| 0-2 | 0.0-1.2 s | Intro: print Pearl Grey mekar dari tengah atas latar warnanya |
| 2-32 | 1.2-18.6 s | 6 blok x 5 beat: Pearl Grey, Dusty Rose, Lilac Mist, Sage Petal, Powder Blue, Black Dahlia |
| 32-36 | 18.6-20.9 s | Klimaks: 6 jalur (satu setiap design) masuk setiap separuh beat, muka sama paras |
| 36-41 | 20.9-23.8 s | COMING SOON atas latar Black Dahlia, kemudian logo Petal Pop 4 (putih) dalam bulatan bunga |
| 41-45.6 | 23.8-26.5 s | NAFESA putih, frame sendiri, fade akhir |

Satu blok design (5 beat): 3 panel masuk satu-satu pada beat 0, 1, 2 (satu klip setiap panel, tiada potong dalam panel), kad nama putih bulat (gaya SKILL.md) muncul bawah kiri tanpa tutup muka, 1-2 bloom accent bunga design tu di bucu. Hujung blok: bloom sweep guna bunga design **seterusnya** tutup skrin lalu buka ke blok baru. Slot kosong tunjuk warna latar design tu.

**Setiap design wajib ada 1 shot detail** (Nas, 19 Nov): salah satu daripada 3 panel ialah close-up print (crop dari raw, maks ~1.4x supaya tak kabur). Raw asal 1080x1920 60fps (~65 Mbps), bukan 4K, jadi detail penuh skrin akan kabur.

Kualiti: guna raw asal dari Mac (bukan proxy 720p). Potong julat terpilih pada resolusi penuh dengan grade, CRF rendah.

Bentuk panel berbeza setiap design (set Joy Club: A tiga sama, B tengah besar, C serong, H zigzag, I trapezium tengah; satu diulang).

**Motion akhir (Nas, 19 Nov):**
- "COMING SOON": motion animation, huruf pop satu-satu ikut separuh beat (scale + naik + fade), bunga kecil Black Dahlia mekar di sekeliling.
- Logo Petal Pop 4: dari SVG, dipecah ikut huruf/elemen, pop satu-satu ikut separuh beat (cara logo JOY CLUB), bulatan bunga mekar dulu sebagai bingkai.
- NAFESA: fade in sahaja, tiada animasi lain.

## Bahan
- Raw: `PETAL POP 4/TEASER VIDEO/video raw/`. Black Dahlia C4567-4570, Pearl Grey C4574-4575, Powder Blue C4580-4584, Dusty Rose C4588-4590, Lilac Mist C4594-4598, Sage Petal C4603-4605. 18 klip panel + 6 klip klimaks.
- Print: 6 SVG dalam TEASER VIDEO (sumber bunga sweep/accent dan warna latar). Logo: `logo petal pop 4.svg`. Logo NAFESA putih: `joy-club/launch-16x9/assets/logo-nafesa-putih.png`.
- SFX buatan sendiri: pop kecil masuk panel, pop nama, whoosh sweep, di bawah lagu.

## Diserahkan kepada builder
- Pilih masa tepat setiap shot (ikut peraturan shot), slow-mo >= 0.5x jika perlu.
- Tulisan nama design: ambil gaya dari PDF katalog `Drop 4/` jika ada; jika tiada, Transcity (demo) atau Fraunces.
- Font COMING SOON ikut teaser v6.
- Proxy: potong julat terpilih sahaja di Mac (1080x1920, grade dibakar) supaya tak salin 6 GB raw.

## Langkah seterusnya
Storyboard PNG (still berlabel) dulu. Render penuh hanya selepas Nas cakap "render".
