# 📚 Panduan Lengkap: Otomatisasi Formulir Penawaran (RFQ) ke Google Sheets & Auto-Reply

Panduan ini dibuat secara **sangat detail dan mudah dipahami** untuk pemula. Anda tidak perlu paham bahasa pemrograman rumit. Cukup ikuti langkah demi langkah dari atas sampai bawah.

---

## 🎯 Gambaran Alur Kerja (Cara Kerjanya)

```
[ Klien Mengisi Form di Website ]
               │
               ▼
[ Klik Tombol "Kirim Permintaan" ]
               │
               ▼
[ Data Terkirim ke Google Apps Script ]
               │
      ┌────────┴─────────────────────────┐
      ▼                                  ▼
[ 1. Masuk ke Google Sheets ]   [ 2. Auto-Reply Email ke Klien ]
                                         ▼
                                [ 3. (Opsional) Auto-Reply WhatsApp ]
```

---

## 📑 LANGKAH 1: Membuat Google Spreadsheet

1. Buka browser dan kunjungi: **[https://sheets.google.com](https://sheets.google.com)**
2. Klik tombol **`+ Blank spreadsheet`** (Spreadsheet Kosong Baru).
3. Beri nama spreadsheet di pojok kiri atas, contohnya:  
   👉 `Barlean Global - Database Penawaran`
4. Di baris paling pertama (**Baris 1**), buat judul kolom dari **A1 sampai K1** persis seperti tabel berikut:

| Kolom | Judul Kolom (Baris 1) | Keterangan |
| :---: | :--- | :--- |
| **A** | `Waktu Pengiriman` | Tanggal & jam form dikirim |
| **B** | `Nama Perusahaan` | Nama PT / CV klien |
| **C** | `Email` | Email bisnis klien |
| **D** | `No WhatsApp` | Nomor telepon/WA klien |
| **E** | `Asal (Origin)` | Pelabuhan/Kota asal |
| **F** | `Tujuan (Destination)` | Pelabuhan/Kota tujuan |
| **G** | `Jenis Layanan` | FCL / LCL / Air Cargo / Trucking |
| **H** | `Total Volume (CBM)` | Hasil hitungan kalkulator CBM |
| **I** | `Berat Aktual (Kg)` | Berat kargo |
| **J** | `Rekomendasi Armada` | Tipe kontainer yang disarankan |
| **K** | `Catatan Khusus Klien` | Catatan spesifikasi kargo |

> 💡 **Tips:** Anda bisa memberi warna latar belakang (background color) pada baris 1 dan membuatnya **Tebal (Bold)** agar rapi dan enak dibaca.

---

## ⚙️ LANGKAH 2: Memasang Google Apps Script

Google Apps Script adalah "jembatan" gratis resmi dari Google yang menerima data dari website dan menuliskannya ke Google Sheet Anda.

1. Di halaman Google Spreadsheet yang baru dibuat tadi, klik menu di atas:  
   👉 **Extensions** ➔ **Apps Script** *(atau jika bahasa Indonesia: **Ekstensi** ➔ **Apps Script**)*.
2. Tab baru editor script akan terbuka.
3. Hapus semua tulisan bawaan yang ada di kotak editor (misal: `function myFunction() { ... }`).
4. **Copy (Salin)** seluruh kode di bawah ini dan **Paste (Tempel)** ke dalam kotak editor tersebut:

```javascript
/**
 * BARLEAN GLOBAL LOGISTICS - RFQ AUTOMATION ENGINE
 * 
 * 1. Jalankan fungsi setupSheet() SEKALI saja untuk membuat tabel & header otomatis!
 * 2. Fungsi doPost(e) otomatis mencatat setiap data form yang masuk dan kirim email.
 */

// 🟢 JALANKAN INI SEKALI: Membuat tabel & styling warna otomatis
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.rename("Barlean Global - Database Penawaran");
  var sheet = ss.getActiveSheet();
  sheet.setName("RFQ_Inquiries");

  var headers = [
    "Waktu Pengiriman",
    "Nama Perusahaan",
    "Email",
    "No WhatsApp",
    "Asal (Origin)",
    "Tujuan (Destination)",
    "Jenis Layanan",
    "Total Volume (CBM)",
    "Berat Aktual (Kg)",
    "Rekomendasi Armada",
    "Catatan Khusus Klien"
  ];

  // Tulis Header di baris 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format Header (Background Charcoal/Navy, Teks Putih, Tebal, Rata Tengah)
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#121820");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment("center");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  // Auto resize lebar kolom agar rapi
  for (var col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

// 🟢 OTOMATIS: Menerima data dari formulir website
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Tunggu maksimal 10 detik

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // Format tanggal Indonesia (WIB)
    var formattedDate = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");

    // 1. Simpan baris data baru ke Google Sheet
    sheet.appendRow([
      formattedDate,
      data.companyName || '-',
      data.email || '-',
      data.phone || '-',
      data.origin || '-',
      data.dest || '-',
      data.serviceType || '-',
      data.cbm || '-',
      data.actualWeight || '-',
      data.recommendation || '-',
      data.notes || '-'
    ]);

    // 2. Kirim Email Konfirmasi Otomatis ke Klien
    if (data.email && data.email.indexOf('@') !== -1) {
      var subject = "[Barlean Global] Konfirmasi Permintaan Penawaran Kargo - " + (data.companyName || "Klien");
      
      var emailBody = 
        "Halo Tim " + (data.companyName || "Bapak/Ibu") + ",\n\n" +
        "Terima kasih telah menghubungi Barlean Global Logistics.\n" +
        "Permintaan penawaran resmi (Request for Quote) Anda telah berhasil kami terima dan tercatat di sistem operasional kami.\n\n" +
        "📋 RINGKASAN DATA PENGIRIMAN:\n" +
        "-----------------------------------------\n" +
        "• Rute Pengiriman : " + (data.origin || '-') + " ➔ " + (data.dest || '-') + "\n" +
        "• Jenis Layanan   : " + (data.serviceType || '-') + "\n" +
        "• Total Volume    : " + (data.cbm || '-') + "\n" +
        "• Berat Aktual    : " + (data.actualWeight ? data.actualWeight + " Kg" : '-') + "\n" +
        "• Rekomendasi     : " + (data.recommendation || '-') + "\n" +
        "• Catatan Khusus  : " + (data.notes || 'Tidak ada catatan tambahan') + "\n" +
        "-----------------------------------------\n\n" +
        "Tim Key Account Manager kami sedang meninjau rincian spesifikasi kargo Anda. " +
        "Surat penawaran harga resmi (Official Quotation) akan kami kirimkan kembali ke alamat email ini segera.\n\n" +
        "Jika ada kebutuhan mendesak, silakan hubungi kami via WhatsApp:\n" +
        "📞 WhatsApp: +60 19-699 3635\n" +
        "🌐 Website : https://barleanglobal.com\n" +
        "📍 Kantor  : Lot 396, Jalan Nilai 7/16, Kawasan Perindustrian Nilai 7, 71800 Nilai, Negeri Sembilan, Malaysia\n\n" +
        "Salam hangat,\n" +
        "Barlean Global Logistics Team";

      MailApp.sendEmail(data.email, subject, emailBody);
    }

    // 3. Kembalikan status sukses ke website
    return ContentService.createTextOutput(JSON.stringify({
      "result": "success",
      "message": "Data berhasil disimpan dan email konfirmasi telah dikirim."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "error": error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
```

5. Klik ikon **Simpan (Save)** 💾 (atau tekan `Ctrl + S` / `Cmd + S`).

---

## 🚀 LANGKAH 3: Menerbitkan Script (Deployment)

Agar script bisa diakses oleh website Anda, kita harus menerbitkannya sebagai **Web App**.

1. Di pojok kanan atas halaman Apps Script, klik tombol biru **`Deploy`** ➔ pilih **`New deployment`**.
2. Klik ikon gerigi (⚙️) di sebelah kiri tulisan *"Select type"*, lalu pilih **`Web app`**.
3. Isi kolom pengaturan seperti ini:
   - **Description**: `Otomatisasi RFQ Barlean`
   - **Execute as**: **`Me (email Google Anda)`**
   - **Who has access**: **`Anyone`** *(PENTING: Wajib pilih "Anyone" agar form website bisa mengirim data tanpa perlu login Google)*.
4. Klik tombol **`Deploy`**.
5. Google akan meminta izin akses (*Authorization required*):
   - Klik **`Authorize access`**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik tulisan kecil **`Advanced`** (Lanjutan) di kiri bawah ➔ klik **`Go to Untitled project (unsafe)`**.
   - Klik **`Allow`** (Izinkan).
6. Setelah selesai, akan muncul kotak bertuliskan **Web app URL**.
7. Klik tombol **`Copy`** pada **Web App URL** tersebut.  
   *(Bentuk URL-nya mirip seperti: `https://script.google.com/macros/s/AKfycbxABC123.../exec`)*.

---

## 🔗 LANGKAH 4: Menghubungkan Link ke Website Barlean Global

Sekarang kita hanya perlu menempelkan URL Web App tadi ke dalam file [`app.js`](file:///Users/bramdwi/Desktop/barlean-global/app.js) di website Anda.

1. Buka file [`app.js`](file:///Users/bramdwi/Desktop/barlean-global/app.js).
2. Cari bagian kode **Main RFQ Form Submission** (di sekitar baris 190).
3. Ganti kodenya menjadi:

```javascript
// GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA DARI LANGKAH 3
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYOUR_CODE_HERE/exec';

const rfqMainForm = document.getElementById('rfqMainForm');
const submitRfqBtn = document.getElementById('submitRfqBtn');

if (rfqMainForm) {
  rfqMainForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Ambil data dari input form & kalkulator
    const payload = {
      origin: document.getElementById('rfqOrigin').value,
      dest: document.getElementById('rfqDest').value,
      serviceType: document.getElementById('rfqServiceType').value,
      cbm: document.getElementById('resCbm').textContent,
      volAir: document.getElementById('resVolAir').textContent,
      recommendation: document.getElementById('resRecom').textContent,
      actualWeight: document.getElementById('actualWeight').value,
      companyName: document.getElementById('rfqCompanyName').value,
      email: document.getElementById('rfqEmail').value,
      phone: document.getElementById('rfqPhone').value,
      notes: document.getElementById('rfqNotes').value
    };

    // 2. Ubah tampilan tombol saat proses kirim
    const originalBtnHTML = submitRfqBtn.innerHTML;
    submitRfqBtn.disabled = true;
    submitRfqBtn.innerHTML = `<span>Mengirim Penawaran...</span>`;

    try {
      // 3. Kirim data ke Google Sheets
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      showToast(`Permintaan RFQ untuk ${payload.companyName} berhasil dikirim! Kami telah mengirim konfirmasi ke email Anda.`);
      rfqMainForm.reset();
      calculateCBM();
    } catch (error) {
      console.error("Gagal mengirim RFQ:", error);
      showToast('Gagal mengirim otomatis. Silakan hubungi kami langsung via WhatsApp.');
    } finally {
      submitRfqBtn.disabled = false;
      submitRfqBtn.innerHTML = originalBtnHTML;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
```

---

## 📱 LANGKAH 5 (Bonus): Mengaktifkan Auto-Reply WhatsApp

Jika Anda ingin ada pesan WhatsApp otomatis yang langsung terkirim ke nomor klien:

1. Daftar layanan WhatsApp Gateway seperti **[Fonnte.com](https://fonnte.com)** atau **Wablas**.
2. Hubungkan nomor WhatsApp bisnis Anda dengan scan QR Code di dashboard Fonnte.
3. Dapatkan **API Token** Fonnte Anda.
4. Di Google Apps Script (Langkah 2), tambahkan kode ini tepat sebelum baris `return ContentService...`:

```javascript
    // Kirim pesan WhatsApp otomatis via Fonnte
    if (data.phone) {
      var waToken = "ISI_TOKEN_FONNTE_ANDA_DISINI"; // Ganti dengan token Fonnte
      var waMessage = 
        "Halo Bpk/Ibu dari *" + (data.companyName || "Perusahaan") + "*,\n\n" +
        "Permintaan penawaran harga untuk rute *" + (data.origin || '-') + " ➔ " + (data.dest || '-') + "* telah kami terima.\n\n" +
        "Tim *Barlean Global Logistics* sedang menyiapkan surat penawaran resmi (Official Quotation) untuk Anda.\n\n" +
        "_Barlean Global Logistics | +60 19-699 3635_";

      UrlFetchApp.fetch("https://api.fonnte.com/send", {
        method: "post",
        headers: { "Authorization": waToken },
        payload: {
          target: data.phone,
          message: waMessage
        }
      });
    }
```

---

## 🧪 LANGKAH 6: Cara Mengetes (Uji Coba)

1. Buka website Anda di browser.
2. Scroll ke bagian **Kalkulator Volumetrik & Request for Quote (RFQ)**.
3. Isi kolom:
   - Asal: `Jakarta`
   - Tujuan: `Surabaya`
   - Nama Perusahaan: `PT. Uji Coba Sukses`
   - Email: *(Gunakan alamat email pribadi Anda yang aktif)*
   - No WA: *(Gunakan no HP/WA Anda)*
4. Klik tombol **`Kirim Permintaan Penawaran Resmi`**.
5. Cek:
   - ✅ Buka Google Spreadsheet Anda ➔ Baris baru akan langsung otomatis terisi.
   - ✅ Buka Inbox Email Anda ➔ Email konfirmasi otomatis dari Barlean Global akan masuk dalam beberapa detik.

---

## ❓ Troubleshooting (Kendala yang Sering Terjadi)

- **Q: Data tidak masuk ke Google Sheet saat tombol diklik?**  
  **A:** Pastikan saat **Deploy (Langkah 3)**, opsi **Who has access** dipilih **`Anyone`** (Bukan *Only myself*). Jika Anda mengubah script, selalu lakukan `Deploy` ➔ `Manage deployments` ➔ `Edit` ➔ pilih `Version: New version` ➔ `Deploy`.

- **Q: Email tidak masuk?**  
  **A:** Periksa folder **Spam/Promotions** di email Anda, atau pastikan kuota pengiriman email harian Google Apps Script (100 email/hari untuk akun gratis biasa) belum habis.
