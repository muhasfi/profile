/* ============================================================
   script.js – Digital vCard (generic, multi-company)
   Setiap halaman HTML mendefinisikan window.CONTACT_DATA
   sebelum memuat file ini.
   ============================================================ */

'use strict';

let vcardText   = '';
let contactName = '';
let qrGenerated = false;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  const defaults = window.CONTACT_DATA || {};

  const contact = {
    org:      params.get('org')      || defaults.org      || '',
    name:     params.get('name')     || defaults.name     || '',
    title:    params.get('title')    || defaults.title    || '',
    phone:    params.get('phone')    || defaults.phone    || '',
    email:    params.get('email')    || defaults.email    || '',
    web:      params.get('web')      || defaults.web      || '',
    whatsapp: params.get('whatsapp') || params.get('phone') || defaults.whatsapp || defaults.phone || '',
    address:  params.get('address')  || defaults.address  || '',
    photo:    params.get('photo')    || defaults.photo    || 'profile.png',
  };

  contactName = contact.name.split(',')[0].trim();

  _setPageTitle(contact.name, contact.org);
  _setPhoto(contact.photo, contactName);
  _setProfileText(contact.org, contact.name, contact.title);
  _setActionLinks(contact);
  _setContactCards(contact);
  _buildVCard(contact);
});

function _setPageTitle(name, org) {
  document.title = org ? `${name} – ${org}` : name;
}

function _setPhoto(photoSrc, name) {
  document.getElementById('headerPhoto').src = photoSrc;

  const parts    = name.split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase();

  document.getElementById('avatarInitials').textContent = initials;
}

function _setProfileText(org, name, title) {
  const orgEl = document.getElementById('companyName');
  if (orgEl) orgEl.textContent = org;
  document.getElementById('profileName').textContent  = name;
  document.getElementById('profileTitle').textContent = title;
}

function _setActionLinks(contact) {
  const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');
  const webHref    = contact.web
    ? (contact.web.startsWith('http') ? contact.web : `https://${contact.web}`)
    : '#';

  document.getElementById('qaPhone').href = `tel:${cleanPhone}`;
  document.getElementById('qaEmail').href = `mailto:${contact.email}`;
  const qaWeb = document.getElementById('qaWeb');
  if (qaWeb) qaWeb.href = webHref;
}

function _setContactCards(contact) {
  const cleanPhone    = contact.phone.replace(/[^0-9+]/g, '');
  const cleanWA       = (contact.whatsapp || '').replace(/[^0-9]/g, '');
  const hasAddress    = !!contact.address;
  const googleMapsUrl = hasAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(contact.address)}`
    : '#';
  const shortAddr     = hasAddress
    ? contact.address.split(',').slice(0, 2).join(', ')
    : '-';
  const webHref       = contact.web
    ? (contact.web.startsWith('http') ? contact.web : `https://${contact.web}`)
    : '#';
  const shortWeb      = contact.web ? contact.web.replace(/^https?:\/\//, '') : '-';

  const phoneLink = document.getElementById('phoneLink');
  if (phoneLink) { phoneLink.href = `tel:${cleanPhone}`; phoneLink.textContent = contact.phone; }

  const emailLink = document.getElementById('emailLink');
  if (emailLink) { emailLink.href = `mailto:${contact.email}`; emailLink.textContent = contact.email; }

  const webLink = document.getElementById('webLink');
  if (webLink) { webLink.href = webHref; webLink.textContent = shortWeb; }

  const waLink = document.getElementById('waLink');
  if (waLink) { waLink.href = `https://wa.me/${cleanWA}`; waLink.textContent = contact.whatsapp || '-'; }

  const mapLink = document.getElementById('mapLink');
  if (mapLink) { mapLink.href = googleMapsUrl; mapLink.textContent = shortAddr; }

  const mapBtn = document.getElementById('mapBtn');
  if (mapBtn) { mapBtn.href = googleMapsUrl; }

  // Sembunyikan card alamat jika tidak ada data alamat
  const addrCard = document.getElementById('addressCard');
  if (addrCard && !hasAddress) addrCard.classList.add('hidden');
}

function _buildVCard(contact) {
  const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');
  const webHref    = contact.web
    ? (contact.web.startsWith('http') ? contact.web : `https://${contact.web}`)
    : '';

  const nameParts = contactName.split(' ');
  const lastName  = nameParts.slice(-1)[0];
  const firstName = nameParts.slice(0, -1).join(' ');

  const addrParts = (contact.address || '').split(',').map(s => s.trim());
  const street    = addrParts[0] || '';
  const city      = addrParts[1] || '';
  const province  = addrParts[2] || '';
  const country   = addrParts[3] || 'Indonesia';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
    `N:${lastName};${firstName};;;`,
  ];

  if (contact.org) lines.push(`ORG:${contact.org}`);
  if (contact.title) lines.push(`TITLE:${contact.title}`);

  lines.push(`TEL;TYPE=WORK,VOICE:${cleanPhone}`);
  lines.push(`TEL;TYPE=CELL,VOICE:${cleanPhone}`);
  lines.push(`EMAIL;TYPE=PREF,INTERNET:${contact.email}`);

  if (contact.address) {
    lines.push(`ADR;TYPE=WORK:;;${street};${city};${province};;${country}`);
  }
  if (webHref) lines.push(`URL:${webHref}`);

  lines.push('END:VCARD');

  vcardText = lines.join('\r\n');
}

function showAvatarFallback() {
  document.getElementById('headerPhoto').classList.add('hidden');
  document.getElementById('avatarFallback').classList.remove('hidden');
}

function toggleQrCode() {
  const btn    = document.querySelector('.qr-toggle-btn');
  const drawer = document.getElementById('qrDrawer');
  const isOpen = drawer.classList.contains('show');

  btn.classList.toggle('active');
  drawer.classList.toggle('show');
  btn.setAttribute('aria-expanded', String(!isOpen));

  if (!isOpen && !qrGenerated && vcardText) {
    const qrCode = new QRCodeStyling({
      width:  140,
      height: 140,
      data:   vcardText,
      margin: 4,
      qrOptions: {
        errorCorrectionLevel: 'M',
      },
      dotsOptions: {
        color: '#1E3A5F',
        type: 'rounded',
      },
      cornersSquareOptions: {
        color: '#0F172A',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#3B82F6',
        type: 'dot',
      },
      backgroundOptions: {
        color: '#FFFFFF',
      },
    });

    qrCode.append(document.getElementById('qr'));
    qrGenerated = true;
  }
}

function saveContact() {
  if (!vcardText) return;

  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${contactName.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Kontak berhasil disimpan ✓');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}