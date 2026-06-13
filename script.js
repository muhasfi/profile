/* ============================================================
   script.js – Digital vCard | PT Koki Sehat Sejahtera
   ============================================================ */

'use strict';

/* ── STATE ─────────────────────────────────────────────────── */
let vcardText   = '';
let contactName = '';
let qrGenerated = false;

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  // Data default jika tidak ada URL parameter
  const defaults = {
    name:     'Ahmad Wijaya, S.T., M.M.',
    title:    'Direktur Utama',
    phone:    '+62 812-3456-789',
    email:    'ahmad@kokisehat.co.id',
    web:      'kokisehat.co.id',
    whatsapp: '+62 812-3456-789',
    address:  'Boyolali, Jawa Tengah, Indonesia',
    photo:    'profile.png',
  };

  const contact = {
    name:     params.get('name')     || defaults.name,
    title:    params.get('title')    || defaults.title,
    phone:    params.get('phone')    || defaults.phone,
    email:    params.get('email')    || defaults.email,
    web:      params.get('web')      || defaults.web,
    whatsapp: params.get('whatsapp') || params.get('phone') || defaults.whatsapp,
    address:  params.get('address')  || defaults.address,
    photo:    params.get('photo')    || defaults.photo,
  };

  // Nama bersih tanpa gelar (untuk inisial & nama file)
  contactName = contact.name.split(',')[0].trim();

  _setPageTitle(contact.name);
  _setPhoto(contact.photo, contactName);
  _setProfileText(contact.name, contact.title);
  _setActionLinks(contact);
  _setContactCards(contact);
  _buildVCard(contact);
});

/* ── PRIVATE HELPERS ───────────────────────────────────────── */

function _setPageTitle(name) {
  document.title = `${name} – PT Koki Sehat Sejahtera`;
}

function _setPhoto(photoSrc, name) {
  document.getElementById('headerPhoto').src = photoSrc;

  // Inisial untuk avatar fallback (maks 2 huruf)
  const parts    = name.split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase();

  document.getElementById('avatarInitials').textContent = initials;
}

function _setProfileText(name, title) {
  document.getElementById('profileName').textContent  = name;
  document.getElementById('profileTitle').textContent = title;
}

function _setActionLinks(contact) {
  const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');
  const webHref    = contact.web.startsWith('http')
    ? contact.web : `https://${contact.web}`;

  document.getElementById('qaPhone').href = `tel:${cleanPhone}`;
  document.getElementById('qaEmail').href = `mailto:${contact.email}`;
  document.getElementById('qaWeb').href   = webHref;
}

function _setContactCards(contact) {
  const cleanPhone    = contact.phone.replace(/[^0-9+]/g, '');
  const cleanWA       = contact.whatsapp.replace(/[^0-9]/g, '');
  const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(contact.address)}`;
  const shortAddr     = contact.address.split(',').slice(0, 2).join(', ');
  const webHref       = contact.web.startsWith('http')
    ? contact.web : `https://${contact.web}`;
  const shortWeb      = contact.web.replace(/^https?:\/\//, '');

  const phoneLink = document.getElementById('phoneLink');
  if (phoneLink) { phoneLink.href = `tel:${cleanPhone}`; phoneLink.textContent = contact.phone; }

  const emailLink = document.getElementById('emailLink');
  if (emailLink) { emailLink.href = `mailto:${contact.email}`; emailLink.textContent = contact.email; }

  const webLink = document.getElementById('webLink');
  if (webLink) { webLink.href = webHref; webLink.textContent = shortWeb; }

  const waLink = document.getElementById('waLink');
  if (waLink) { waLink.href = `https://wa.me/${cleanWA}`; waLink.textContent = contact.whatsapp; }

  const mapLink = document.getElementById('mapLink');
  if (mapLink) { mapLink.href = googleMapsUrl; mapLink.textContent = shortAddr; }

  const mapBtn = document.getElementById('mapBtn');
  if (mapBtn) { mapBtn.href = googleMapsUrl; }
}

function _buildVCard(contact) {
  const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');
  const webHref    = contact.web.startsWith('http')
    ? contact.web : `https://${contact.web}`;

  // N field: lastName;firstName;;;
  const nameParts = contactName.split(' ');
  const lastName  = nameParts.slice(-1)[0];
  const firstName = nameParts.slice(0, -1).join(' ');

  // ADR field: ;;street;city;province;;country
  const addrParts = contact.address.split(',').map(s => s.trim());
  const street    = addrParts[0] || '';
  const city      = addrParts[1] || '';
  const province  = addrParts[2] || '';
  const country   = addrParts[3] || 'Indonesia';

  vcardText = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
    `N:${lastName};${firstName};;;`,
    'ORG:PT Koki Sehat Sejahtera',
    `TITLE:${contact.title}`,
    `TEL;TYPE=WORK,VOICE:${cleanPhone}`,
    `TEL;TYPE=CELL,VOICE:${cleanPhone}`,
    `EMAIL;TYPE=PREF,INTERNET:${contact.email}`,
    `ADR;TYPE=WORK:;;${street};${city};${province};;${country}`,
    `URL:${webHref}`,
    'END:VCARD',
  ].join('\r\n');
}

/* ── PUBLIC FUNCTIONS ──────────────────────────────────────── */

/**
 * Avatar fallback jika foto gagal dimuat.
 * Dipanggil via onerror pada <img id="headerPhoto">.
 */
function showAvatarFallback() {
  document.getElementById('headerPhoto').classList.add('hidden');
  document.getElementById('avatarFallback').classList.remove('hidden');
}

/**
 * Buka / tutup drawer QR Code.
 * QR di-generate hanya sekali (lazy), berisi data vCard.
 */
function toggleQrCode() {
  const btn    = document.querySelector('.qr-toggle-btn');
  const drawer = document.getElementById('qrDrawer');
  const isOpen = drawer.classList.contains('show');

  btn.classList.toggle('active');
  drawer.classList.toggle('show');
  btn.setAttribute('aria-expanded', String(!isOpen));

  if (!isOpen && !qrGenerated && vcardText) {
    new QRCode(document.getElementById('qr'), {
      text:         vcardText,
      width:        180,
      height:       180,
      colorDark:    '#1d3b86',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    qrGenerated = true;
  }
}

/**
 * Toast notifikasi singkat.
 * @param {string} msg
 */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}