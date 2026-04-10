import { Card } from './types';

export const DANA_UMUM_CARDS: Card[] = [
  { id: 'du-1', type: 'danaUmum', title: 'Bansos Cair', description: 'Dapat bantuan sosial!', effect: { type: 'gainMoney', amount: 500000 } },
  { id: 'du-2', type: 'danaUmum', title: 'Tilang Elektronik', description: 'Tilang dari ETLE!', effect: { type: 'loseMoney', amount: 250000 } },
  { id: 'du-3', type: 'danaUmum', title: 'Iuran RW', description: 'Bayar iuran ke semua warga.', effect: { type: 'payEachPlayer', amount: 50000 } },
  { id: 'du-4', type: 'danaUmum', title: 'Lomba Kerupuk', description: 'Juara lomba makan kerupuk!', effect: { type: 'gainMoney', amount: 100000 } },
  { id: 'du-5', type: 'danaUmum', title: 'Token Listrik Habis', description: 'Matii lampu!', effect: { type: 'loseMoney', amount: 200000 } },
  { id: 'du-6', type: 'danaUmum', title: 'Kondangan Mantan', description: 'Hadiah mahal untuk mantan...', effect: { type: 'loseMoney', amount: 300000 } },
  { id: 'du-7', type: 'danaUmum', title: 'THR Lebaran', description: 'Akhirnya THR cair!', effect: { type: 'gainMoney', amount: 1000000 } },
  { id: 'du-8', type: 'danaUmum', title: 'Tanah Digusur', description: 'Penggusuran! Jual 1 properti harga 2x lipat.', effect: { type: 'sellProperty', priceMultiplier: 2 } },
  { id: 'du-9', type: 'danaUmum', title: 'Patungan Takjil', description: 'Patungan buat takjil.', effect: { type: 'loseMoney', amount: 50000 } },
  { id: 'du-10', type: 'danaUmum', title: 'Refund Pajak', description: 'Pajak balik!', effect: { type: 'gainMoney', amount: 400000 } },
  { id: 'du-11', type: 'danaUmum', title: 'Parkir Liar', description: 'Denda parkir liar.', effect: { type: 'loseMoney', amount: 100000 } },
  { id: 'du-12', type: 'danaUmum', title: 'BBM Naik', description: 'Sewa naik 10% selama 1 putaran.', effect: { type: 'rentIncrease', percentage: 10, turns: 1 } },
  { id: 'du-13', type: 'danaUmum', title: 'Uang Kaget', description: 'Ambil Rp200rb dari pemain terkaya.', effect: { type: 'takeFromRichest', amount: 200000 } },
  { id: 'du-14', type: 'danaUmum', title: 'Jual Akun Game', description: 'Akun game laku!', effect: { type: 'gainMoney', amount: 150000 } },
  { id: 'du-15', type: 'danaUmum', title: 'Admin Bank', description: 'Biaya admin bank.', effect: { type: 'loseMoney', amount: 50000 } },
  { id: 'du-16', type: 'danaUmum', title: 'Nemu Duit', description: 'Nemu duit di jalan!', effect: { type: 'gainMoney', amount: 50000 } },
  { id: 'du-17', type: 'danaUmum', title: 'Donasi Bencana', description: 'Donasi untuk korban bencana.', effect: { type: 'loseMoney', amount: 200000 } },
  { id: 'du-18', type: 'danaUmum', title: 'Gaji Telat', description: 'Gak dapat uang START kali ini.', effect: { type: 'noSalary' } },
  { id: 'du-19', type: 'danaUmum', title: 'Bonus Akhir Tahun', description: 'Bonus cair!', effect: { type: 'gainMoney', amount: 750000 } },
  { id: 'du-20', type: 'danaUmum', title: 'Salah Transfer', description: 'Salah transfer ke rekening orang.', effect: { type: 'payBank', amount: 500000 } },
];

export const KESEMPATAN_CARDS: Card[] = [
  { id: 'ks-1', type: 'kesempatan', title: 'Viral di X', description: 'Petak ini gratis sewa!', effect: { type: 'freeRent' } },
  { id: 'ks-2', type: 'kesempatan', title: 'Orang Dalam', description: 'Langsung ke Istana Pusat Kota.', effect: { type: 'moveTo', position: 39, collectSalary: true } },
  { id: 'ks-3', type: 'kesempatan', title: 'Ghosting', description: 'Mundur 3 langkah.', effect: { type: 'moveBackward', steps: 3 } },
  { id: 'ks-4', type: 'kesempatan', title: 'Macet Total', description: 'Skip 1 putaran.', effect: { type: 'skipTurns', turns: 1 } },
  { id: 'ks-5', type: 'kesempatan', title: 'Investasi Bodong', description: 'Rugi besar!', effect: { type: 'loseMoney', amount: 750000 } },
  { id: 'ks-6', type: 'kesempatan', title: 'War Tiket', description: 'Bayar Rp1.5 Juta atau mundur ke START.', effect: { type: 'payOrMove', amount: 1500000, position: 0 } },
  { id: 'ks-7', type: 'kesempatan', title: 'Promosi Jabatan', description: 'Maju ke petak kosong terdekat & beli.', effect: { type: 'nearestEmpty', buy: true } },
  { id: 'ks-8', type: 'kesempatan', title: 'Salah Gg. Sempit', description: 'Tukar posisi dengan pemain terakhir.', effect: { type: 'swapPosition' } },
  { id: 'ks-9', type: 'kesempatan', title: 'Flash Sale', description: 'Bangun rumah diskon 50%.', effect: { type: 'buildDiscount', discount: 50 } },
  { id: 'ks-10', type: 'kesempatan', title: 'Revisi UU', description: 'Semua pemain geser 1 properti ke kanan.', effect: { type: 'shiftPropertiesRight' } },
  { id: 'ks-11', type: 'kesempatan', title: 'Razia KTP', description: 'Gak punya rumah? Masuk Operasi Zebra.', effect: { type: 'gotoJail' } },
  { id: 'ks-12', type: 'kesempatan', title: 'Kerja Lembur', description: '+Rp500rb, tapi skip putaran depan.', effect: { type: 'gainMoneySkipTurn', amount: 500000 } },
  { id: 'ks-13', type: 'kesempatan', title: 'Hacker Bobol Data', description: 'Data bocor!', effect: { type: 'loseMoney', amount: 300000 } },
  { id: 'ks-14', type: 'kesempatan', title: 'FOMO', description: 'Wajib beli petak selanjutnya.', effect: { type: 'mustBuyNext' } },
  { id: 'ks-15', type: 'kesempatan', title: 'Endorsement', description: 'Sewa propertimu x2 selama 2 putaran.', effect: { type: 'rentMultiplier', multiplier: 2, turns: 2 } },
  { id: 'ks-16', type: 'kesempatan', title: 'Joki Tugas', description: 'Ambil Rp100rb dari pemain terdekat.', effect: { type: 'takeFromNearest', amount: 100000 } },
  { id: 'ks-17', type: 'kesempatan', title: 'Healing Bali', description: 'Langsung ke petak Healing.', effect: { type: 'moveTo', position: 20, collectSalary: true } },
  { id: 'ks-18', type: 'kesempatan', title: 'OTW (Baru Mandi)', description: 'Maju ke START tapi tidak ambil gaji.', effect: { type: 'moveTo', position: 0, collectSalary: false } },
  { id: 'ks-19', type: 'kesempatan', title: 'Tiket Promo', description: 'Maju 5 langkah.', effect: { type: 'moveForward', steps: 5 } },
  { id: 'ks-20', type: 'kesempatan', title: 'Ganti Presiden', description: 'Semua hotel hancur, kompensasi 50%.', effect: { type: 'destroyAllHotels', compensationPercent: 50 } },
];

export const ALL_CARDS = [...DANA_UMUM_CARDS, ...KESEMPATAN_CARDS];
