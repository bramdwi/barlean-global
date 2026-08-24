/**
 * Barlean Global Logistics - Interactive Client Logic
 * Handling: Tabs, Live Tracking simulation, CBM Calculator, Interactive Hub Explorer, Mobile Drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 1. Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  
  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });

    // Close mobile drawer when clicking links
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // 2. Hero Console Tabs (Tracking vs Rate) with Full ARIA Support
  const tabButtons = document.querySelectorAll('.console-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add('active');
    });
  });

  // 3. Live Tracking Form (Connected to Google Sheets Tab "Tracking_AWB")
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzBZU4UKt7b1Dx6XHPhO0nWjQVag-O8zPo0Gf8MD712K1j9hgtn0KJBGrhcetPF4yEH/exec';
  const trackingForm = document.getElementById('trackingForm');
  const trackingResult = document.getElementById('trackingResult');
  const resAwbNumber = document.getElementById('resAwbNumber');
  const trackSubmitBtn = document.getElementById('trackSubmitBtn');
  const resStatusBadge = document.getElementById('resStatusBadge');
  const resStatusText = document.getElementById('resStatusText');
  const resRouteDesc = document.getElementById('resRouteDesc');
  const resMilestones = document.getElementById('resMilestones');

  function renderMilestones(steps) {
    if (!resMilestones || !steps || !steps.length) return;
    resMilestones.innerHTML = steps.map(step => {
      let statusClass = '';
      let tag = '';
      const st = (step.status || '').toString().toLowerCase().trim();

      if (st.includes('completed') || st.includes('selesai') || st.includes('done') || st.includes('finish') || st.includes('sukses')) {
        statusClass = 'completed';
        tag = '<span style="font-size: 0.75rem; font-weight: 500; color: var(--color-emerald);">(Selesai)</span>';
      } else if (st.includes('active') || st.includes('berlangsung') || st.includes('proses') || st.includes('transit') || st.includes('otw')) {
        statusClass = 'active';
        tag = '<span style="font-size: 0.75rem; font-weight: 600; color: var(--color-accent);">(Sedang Berlangsung)</span>';
      } else {
        statusClass = '';
        tag = '<span style="font-size: 0.75rem; font-weight: 400; color: var(--color-slate-400);">(Tahap Akhir)</span>';
      }

      return `
        <div class="step-item ${statusClass}" role="listitem">
          <div class="step-dot" aria-hidden="true"></div>
          <div class="step-title">${step.title} ${tag}</div>
          <div class="step-meta">${step.meta}</div>
        </div>
      `;
    }).join('');
  }

  if (trackingForm && trackingResult) {
    trackingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputVal = document.getElementById('trackingNumber').value.trim();
      if (!inputVal) return;

      const originalBtnHTML = trackSubmitBtn ? trackSubmitBtn.innerHTML : '';
      if (trackSubmitBtn) {
        trackSubmitBtn.disabled = true;
        trackSubmitBtn.innerHTML = `<span>Memeriksa Resi...</span>`;
      }

      try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=track&awb=${encodeURIComponent(inputVal)}`);
        const data = await response.json();

        if (data && data.found) {
          if (resAwbNumber) resAwbNumber.textContent = data.awb || inputVal.toUpperCase();
          if (resStatusText) resStatusText.textContent = data.status || 'In-Transit';
          if (resRouteDesc) resRouteDesc.textContent = data.description || '';
          
          if (resStatusBadge) {
            const rawStatus = (data.status || '').toLowerCase();
            let badgeStyle = data.badgeColor || 'emerald';
            if (rawStatus.includes('delivered') || rawStatus.includes('selesai') || rawStatus.includes('diterima')) {
              badgeStyle = 'emerald';
            } else if (rawStatus.includes('transit') || rawStatus.includes('perjalanan')) {
              badgeStyle = 'accent';
            } else if (rawStatus.includes('customs') || rawStatus.includes('cukai') || rawStatus.includes('tunda')) {
              badgeStyle = 'orange';
            }
            resStatusBadge.className = `badge badge-${badgeStyle}`;
          }

          if (data.milestones) {
            renderMilestones(data.milestones);
          }

          trackingResult.classList.remove('show');
          setTimeout(() => {
            trackingResult.classList.add('show');
            showToast(`Status kargo ${inputVal.toUpperCase()} berhasil dimuat.`);
          }, 150);
        } else {
          trackingResult.classList.remove('show');
          showToast(`Nomor resi "${inputVal.toUpperCase()}" tidak ditemukan di database.`);
        }
      } catch (err) {
        console.warn('Live tracking lookup fallback:', err);
        if (resAwbNumber) resAwbNumber.textContent = inputVal.toUpperCase();
        trackingResult.classList.add('show');
        showToast(`Status kargo ${inputVal.toUpperCase()} dimuat.`);
      } finally {
        if (trackSubmitBtn) {
          trackSubmitBtn.disabled = false;
          trackSubmitBtn.innerHTML = originalBtnHTML;
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });
  }

  // Download e-POD dummy handler
  const downloadPodBtn = document.getElementById('downloadPodBtn');
  if (downloadPodBtn) {
    downloadPodBtn.addEventListener('click', () => {
      showToast('Mengunduh e-POD Digital Receipt (PDF)...');
    });
  }

  // 4. Interactive CBM Calculator Logic
  const lengthInput = document.getElementById('dimLength');
  const widthInput = document.getElementById('dimWidth');
  const heightInput = document.getElementById('dimHeight');
  const qtyInput = document.getElementById('dimQty');
  const weightInput = document.getElementById('actualWeight');

  const resCbm = document.getElementById('resCbm');
  const resVolAir = document.getElementById('resVolAir');
  const resRecom = document.getElementById('resRecom');

  function calculateCBM() {
    const l = parseFloat(lengthInput.value) || 0;
    const w = parseFloat(widthInput.value) || 0;
    const h = parseFloat(heightInput.value) || 0;
    const qty = parseInt(qtyInput.value, 10) || 1;
    const actualW = parseFloat(weightInput.value) || 0;

    // Cubic Meter (CBM) = (L * W * H in meters) * Qty
    const singleCbm = (l / 100) * (w / 100) * (h / 100);
    const totalCbm = singleCbm * qty;

    // Air Volumetric Weight (Divisor 5000) in Kg = (L * W * H in cm) / 5000 * Qty
    const singleAirVol = (l * w * h) / 5000;
    const totalAirVol = singleAirVol * qty;

    resCbm.textContent = `${totalCbm.toFixed(2)} CBM`;
    resVolAir.textContent = `${totalAirVol.toFixed(2)} Kg`;

    // Smart Container Recommendation
    if (totalCbm > 55) {
      resRecom.textContent = '1x 40ft High Cube FCL';
    } else if (totalCbm > 28) {
      resRecom.textContent = '1x 40ft Standard FCL';
    } else if (totalCbm > 12) {
      resRecom.textContent = '1x 20ft Standard FCL';
    } else {
      resRecom.textContent = 'LCL Consolidation / FTL Trucking';
    }
  }

  [lengthInput, widthInput, heightInput, qtyInput, weightInput].forEach(inp => {
    if (inp) inp.addEventListener('input', calculateCBM);
  });

  // 5. Interactive Coverage Hub Explorer
  const hubData = {
    jkt: {
      title: 'Jakarta Main HQ Hub (Tanjung Priok / Cengkareng)',
      detail: 'Kapasitas pergudangan CFS 18.000 m² dengan jalur bongkar muat kontainer terdedikasi, fasilitas cold chain, dan sistem kepabeanan PPJK jalur cepat.',
      routes: '➔ Direct Weekly to Singapore (Transit: 2 Hari)<br>➔ Direct to Shanghai / Ningbo (Transit: 6-8 Hari)<br>➔ Trans-Java Daily Trucking to Surabaya / Bali',
      sla: '99.4% On-Schedule'
    },
    sub: {
      title: 'Surabaya Hub (Tanjung Perak / Teluk Lamong)',
      detail: 'Pusat konsolidasi kargo untuk kawasan Indonesia Timur (Sulawesi, Maluku, Papua) dengan fasilitas depo kontainer 12.000 m².',
      routes: '➔ Direct Feeder to Makassar & Bitung (Transit: 3-4 Hari)<br>➔ Ocean Freight to Balikpapan / IKN (Transit: 2 Hari)<br>➔ Inter-island Roro Express Lines',
      sla: '99.2% On-Schedule'
    },
    sin: {
      title: 'Singapore International Transshipment Hub (PSA)',
      detail: 'Hub transshipment kargo global untuk koneksi pelayaran utama ke Eropa, Timur Tengah, Asia Barat, dan Amerika Utara dengan kapasitas transfer kontainer cepat.',
      routes: '➔ Global Ocean Lines to Rotterdam / Hamburg (Transit: 18-22 Hari)<br>➔ Direct Air Cargo to Middle East Hubs (Daily Flight)<br>➔ Southeast Asia Coastal Feeder Networks',
      sla: '99.8% On-Schedule'
    },
    sha: {
      title: 'Shanghai & Ningbo Port Hub (China Main Port)',
      detail: 'Fasilitas konsolidasi barang impor spesialis rute Tiongkok-Indonesia dengan opsi DDP (Door-to-Door All In) dan audit bea cukai pra-keberangkatan.',
      routes: '➔ Direct Ocean Service to Jakarta (Weekly 3x Sailing)<br>➔ Air Freight Express from PVG to CGK (Transit: 1-2 Hari)<br>➔ Bonded Export Warehouse & Factory Pick-up Services',
      sla: '99.5% On-Schedule'
    }
  };

  const hubCards = document.querySelectorAll('.hub-card');
  const hubDisplayName = document.getElementById('hubDisplayName');
  const hubDisplayDetail = document.getElementById('hubDisplayDetail');
  const hubRoutes = document.getElementById('hubRoutes');
  const hubSla = document.getElementById('hubSla');

  hubCards.forEach(card => {
    function activateHub() {
      const hubKey = card.getAttribute('data-hub');
      const data = hubData[hubKey];

      if (data) {
        hubCards.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-selected', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-selected', 'true');

        hubDisplayName.textContent = data.title;
        hubDisplayDetail.textContent = data.detail;
        hubRoutes.innerHTML = data.routes;
        hubSla.textContent = data.sla;
      }
    }

    card.addEventListener('click', activateHub);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateHub();
      }
    });
  });

  // 6. Main RFQ Form Submission (Connected to Google Sheets & Email Automation)
  const rfqMainForm = document.getElementById('rfqMainForm');
  const submitRfqBtn = document.getElementById('submitRfqBtn');

  if (rfqMainForm) {
    rfqMainForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Kumpulkan data form dan hasil kalkulasi CBM
      const payload = {
        origin: document.getElementById('rfqOrigin')?.value || '',
        dest: document.getElementById('rfqDest')?.value || '',
        serviceType: document.getElementById('rfqServiceType')?.value || '',
        cbm: document.getElementById('resCbm')?.textContent || '',
        volAir: document.getElementById('resVolAir')?.textContent || '',
        recommendation: document.getElementById('resRecom')?.textContent || '',
        actualWeight: document.getElementById('actualWeight')?.value || '',
        companyName: document.getElementById('rfqCompanyName')?.value || '',
        email: document.getElementById('rfqEmail')?.value || '',
        phone: document.getElementById('rfqPhone')?.value || '',
        notes: document.getElementById('rfqNotes')?.value || ''
      };

      const originalBtnHTML = submitRfqBtn ? submitRfqBtn.innerHTML : '';
      if (submitRfqBtn) {
        submitRfqBtn.disabled = true;
        submitRfqBtn.innerHTML = `
          <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
            <span>Mengirim Data...</span>
          </span>
        `;
      }

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });

        showToast(`Permintaan RFQ untuk ${payload.companyName} berhasil dikirim! Silakan cek Email Anda.`);
        rfqMainForm.reset();
        calculateCBM();
      } catch (error) {
        console.error('Error submitting RFQ:', error);
        showToast('Gagal mengirim otomatis. Silakan hubungi kami via WhatsApp.');
      } finally {
        if (submitRfqBtn) {
          submitRfqBtn.disabled = false;
          submitRfqBtn.innerHTML = originalBtnHTML;
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });
  }

  // 7. Toast Notification Helper
  const toastBox = document.getElementById('toastBox');
  const toastText = document.getElementById('toastText');

  function showToast(message) {
    if (!toastBox || !toastText) return;
    toastText.textContent = message;
    toastBox.classList.add('show');

    setTimeout(() => {
      toastBox.classList.remove('show');
    }, 4000);
  }
});
