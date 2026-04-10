# 🇮🇩 Project: Monopoli "Nasib Bangsa"
**Game Design Document - Kearifan Lokal & Satir Sosial**

---

## 1. Konsep Utama & Estetika
* **Genre:** Board Game / Strategy / Satire.
* **Visual Style:** **Neo-Brutalism**. 
    * Ciri khas: Border hitam tebal (`border-4`), bayangan kaku (`shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`), warna kontras (Neon Green, Pink, Bright Yellow), dan font Sans-Serif tegas.
* **Tech Stack:** * **Frontend:** Next.js (Tailwind CSS + Framer Motion + Zustand).
    * **Backend:** Laravel (API + PostgreSQL).
    * **Real-time:** Laravel Reverb atau Pusher.

---

## 2. Struktur Map (40 Petak)
*Urutan dimulai dari Sudut Kanan Bawah (START) berputar berlawanan arah jarum jam.*

| Posisi | Nama Petak | Kategori | Deskripsi Satir |
| :--- | :--- | :--- | :--- |
| **0** | **START (Gaji UMR)** | **Sudut** | Ambil Rp2.000.000 setiap lewat. |
| 1 | Lahan Parkir Minimarket | Cokelat | "Gak ada semenit, keluar bayar 2rb." |
| 2 | **DANA UMUM** | Kartu | Nasib rakyat jelata. |
| 3 | Kontrakan Petak Seribu | Cokelat | "Dinding tipis, denger tetangga bersin." |
| 4 | Pajak Makan Warteg | Pajak | Bayar Rp200.000 (PPN mendadak). |
| 5 | **Stasiun KRL Jabodetabek** | Transportasi | Sewa naik per jumlah stasiun dimiliki. |
| 6 | Pasar Kaget Minggu Pagi | Light Blue | "Beli baju bonus debu jalanan." |
| 7 | **KESEMPATAN** | Kartu | Nasib tak terduga. |
| 8 | Lapak PKL Trotoar | Light Blue | "Kucing-kucingan sama Satpol PP." |
| 9 | Kios Pulsa & Token | Light Blue | "Admin 2.500 per transaksi." |
| **10** | **OPERASI ZEBRA** | **Sudut** | Hanya Mampir / Masuk Sidang. |
| 11 | Kawasan Industri Cikarang | Pink | "Debu truk dan aroma pabrik." |
| 12 | **PLN (Perusahaan Listrik)** | Utilitas | Sewa = Dadu x 10.000. |
| 13 | Pusat Grosir Tanah Abang | Pink | "Desek-desekan demi baju lebaran." |
| 14 | Ruko Ekspedisi Paket | Pink | "Kurir paket, pakettt!" |
| 15 | **Terminal Bus Antar Kota** | Transportasi | Penghubung mudik. |
| 16 | Apartemen Subsidi | Oranye | "Tangga darurat jadi tempat jemur." |
| 17 | **DANA UMUM** | Kartu | - |
| 18 | Kawasan Distrik Tekstil | Oranye | "Limbah warna-warni." |
| 19 | Startup "Bakar Uang" | Oranye | "Gaji gede, kerja sampe tipes." |
| **20** | **HEALING KE BALI** | **Sudut** | Parkir Gratis / Tempat Istirahat. |
| 21 | Mall Mewah Jaksel | Merah | "Kopi 80rb, rasa prestise." |
| 22 | **KESEMPATAN** | Kartu | - |
| 23 | Kafe Aesthetic Senopati | Merah | "Foto dulu, makan nanti." |
| 24 | Gym Membership Eksklusif | Merah | "Daftar doang, dateng kagak." |
| 25 | **Bandara Internasional** | Transportasi | Gerbang keluar negeri (Flexing). |
| 26 | Cluster Minimalis Modern | Kuning | "Tembok nempel, cicilan 30 tahun." |
| 27 | **PDAM (Perusahaan Air)** | Utilitas | Sewa = Dadu x 10.000. |
| 28 | Kawasan Wisata Kota Tua | Kuning | "Sepeda ontel dan sejarah." |
| 29 | Hotel Bintang 5 | Kuning | "Sarapan buffet sampe kenyang." |
| **30** | **MASUK SIDANG TEMPAT** | **Sudut** | Langsung ke petak 10. |
| 31 | Kawasan Perkantoran SCBD | Hijau | "Lanyard mahal, mental tipis." |
| 32 | Penthouse Lantai 50 | Hijau | "Pemandangan macet dari atas." |
| 33 | **DANA UMUM** | Kartu | - |
| 34 | Markas Besar Ormas | Hijau | "Uang koordinasi dan keamanan." |
| 35 | **Pelabuhan Peti Kemas** | Transportasi | Gerbang logistik nasional. |
| 36 | **KESEMPATAN** | Kartu | - |
| 37 | Kawasan Menteng | Biru Tua | "Rumah tua, harga gila." |
| 38 | Pajak Barang Mewah | Pajak | Bayar Rp1.000.000. |
| 39 | Istana Pusat Kota | Biru Tua | "Puncak kekuasaan." |

---

## 3. Custom Roles & Skills
Setiap karakter memiliki kelebihan dan kekurangan untuk menjaga keseimbangan.

1.  **Si Anak Magang (The Grinder)**
    * **Pasif:** Jika dadu Ganjil, ambil Rp50rb dari Bank (Uang Lembur).
2.  **Content Creator (The Influencer)**
    * **Pasif:** Diskon sewa 25% di petak Merah & Kuning. **Debuff:** Bayar pajak 2x lipat.
3.  **Tukang Parkir (The Gatekeeper)**
    * **Pasif:** Dapat Rp50rb dari pemain yang berhenti di petak Transportasi manapun.
4.  **Admin Olshop (The Fast Response)**
    * **Pasif:** Tambahan Rp300rb di START. **Debuff:** Kena denda Rp100rb jika masuk Dana Umum.
5.  **Ketua RT (The Local Leader)**
    * **Pasif:** Bebas sewa di petak Cokelat & Light Blue milik lawan.
6.  **Supir Travel (The Navigator)**
    * **Pasif:** Bisa memajukan/memundurkan bidak 1 langkah dari hasil dadu (3x pakai).
7.  **Sultan Gadungan (The Flexer)**
    * **Pasif:** Bisa beli properti meski uang minus (hutang). **Debuff:** Bunga hutang 20% per putaran.
8.  **Aktivis Sosmed (The Canceller)**
    * **Pasif:** Berhenti di Hotel lawan? Tidak perlu bayar (Ancaman Viralin).
9.  **Penjual Gorengan (The Survivor)**
    * **Pasif:** Kebal terhadap kartu Dana Umum yang bersifat denda/merugikan.
10. **Investor Kripto (The Speculator)**
    * **Pasif:** Di START, lempar dadu. 1-3: Rugi Rp500rb. 4-6: Cuan Rp1 Juta.

---

## 4. Kartu Dana Umum & Kesempatan

### **20 Dana Umum (Keuangan)**
1.  **Bansos Cair:** +Rp500rb.
2.  **Tilang Elektronik:** -Rp250rb.
3.  **Iuran RW:** Bayar Rp50rb ke tiap pemain.
4.  **Lomba Kerupuk:** +Rp100rb.
5.  **Token Listrik Habis:** -Rp200rb.
6.  **Kondangan Mantan:** -Rp300rb.
7.  **THR Lebaran:** +Rp1 Juta.
8.  **Tanah Digusur:** Jual 1 properti, harga 2x lipat.
9.  **Patungan Takjil:** -Rp50rb.
10. **Refund Pajak:** +Rp400rb.
11. **Parkir Liar:** -Rp100rb.
12. **BBM Naik:** Sewa bayar +10% (1 putaran).
13. **Uang Kaget:** Ambil Rp200rb dari pemain terkaya.
14. **Jual Akun Game:** +Rp150rb.
15. **Admin Bank:** -Rp50rb.
16. **Nemu Duit:** +Rp50rb.
17. **Donasi Bencana:** -Rp200rb.
18. **Gaji Telat:** Gak dapat uang START kali ini.
19. **Bonus Akhir Tahun:** +Rp750rb.
20. **Salah Transfer:** -Rp500rb ke Bank.

### **20 Kesempatan (Aksi/Pergerakan)**
1.  **Viral di X:** Petak ini gratis sewa.
2.  **Orang Dalam:** Langsung ke "Istana Pusat Kota".
3.  **Ghosting:** Mundur 3 langkah.
4.  **Macet Total:** Skip 1 putaran.
5.  **Investasi Bodong:** -Rp1 Juta.
6.  **War Tiket:** Bayar Rp1.5 Juta atau mundur ke START.
7.  **Promosi Jabatan:** Maju ke petak kosong terdekat & beli.
8.  **Salah Gg. Sempit:** Tukar posisi dengan pemain terakhir.
9.  **Flash Sale:** Bangun rumah diskon 50%.
10. **Revisi UU:** Semua pemain geser 1 properti ke kanan.
11. **Razia KTP:** Gak punya rumah? Masuk Operasi Zebra.
12. **Kerja Lembur:** +Rp500rb, tapi skip putaran depan.
13. **Hacker Bobol Data:** -Rp300rb.
14. **FOMO:** Wajib beli petak selanjutnya yang diinjak.
15. **Endorsement:** Sewa propertimu x2 (2 putaran).
16. **Joki Tugas:** Ambil Rp100rb dari pemain terdekat.
17. **Healing Bali:** Langsung ke petak "Healing".
18. **OTW (Baru Mandi):** Maju ke START tapi tidak ambil gaji.
19. **Tiket Promo:** Maju 5 langkah.
20. **Ganti Presiden:** Semua hotel hancur, kompensasi 50%.

---

## 5. Implementasi Teknis (Developer Notes)

### **Backend (Laravel)**
* Gunakan **Migration** untuk tabel `properties` dengan kolom `color_group`, `base_rent`, dan `price`.
* Buat **Event & Listener** untuk broadcast pergerakan bidak via **Laravel Reverb**.

### **Frontend (Next.js)**
* Gunakan **Zustand** untuk `useGameStore`.
* Contoh Animasi:
    ```javascript
    <motion.div 
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300 }}
    />
    ```
* **Tailwind Style:** `bg-lime-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`.

buat codenya modular dan buat penambahan lainnya lebih mudah

## 6. Sistem Ekonomi & Properti

### A. Sistem Pembelian & Kepemilikan
1. **Beli Tanah:** Jika berhenti di petak tak bertuan, pemain bisa membeli sesuai harga yang tertera.
2. **Monopoli:** Jika pemain memiliki semua tanah dalam satu warna, uang sewa di tanah kosong (tanpa bangunan) otomatis naik **2x lipat**.

### B. Sistem Sewa (Rent)
* **Tanah Kosong:** Sewa dasar sesuai kartu properti.
* **Dengan Bangunan:** Sewa naik drastis berdasarkan jumlah rumah/hotel.
* **Utilitas (PLN/PDAM):** - Punya 1: Sewa = 10.000 x angka dadu.
    - Punya 2: Sewa = 20.000 x angka dadu.
* **Transportasi (Stasiun/Bandara):**
    - Punya 1: Rp250.000 | 2: Rp500.000 | 3: Rp1.000.000 | 4: Rp2.000.000.

### C. Sistem Perumahan (Pembangunan)
* **Syarat:** Harus memiliki satu set warna lengkap sebelum bisa membangun.
* **Level Bangunan:** Maksimal 4 Rumah (disebut "Bedeng/Kontrakan") sebelum bisa upgrade ke 1 Hotel (disebut "Real Estate/Apartemen").
* **Aturan Pemerataan:** Pembangunan harus rata. Kamu tidak bisa punya 3 rumah di satu petak jika petak warna yang sama lainnya masih kosong.

### D. Sistem Jual & Gadai (Mortgage)
1. **Gadai ke Bank:** Jika butuh uang darurat, properti bisa digadaikan ke Bank seharga 50% nilai beli. Properti yang digadaikan tidak menghasilkan sewa.
2. **Tebus Gadai:** Membayar nilai gadai + bunga 10%.
3. **Jual Rumah:** Bangunan bisa dijual kembali ke Bank seharga 50% dari harga beli awal.
4. **Lelang:** Jika pemain berhenti di petak kosong tapi tidak mau membeli, Bank akan melelang petak tersebut ke semua pemain mulai dari harga Rp100.000.