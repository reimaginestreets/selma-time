// Selma — a slow time journal.
// A place to land when there's a little time and no plan for it.
// Everything is stored in this browser (localStorage); there is no server.

const STORE_KEY = 'selma-time.v1';
const TRAIL_KEEPS = 120; // older marks quietly fall off the end
const state = loadState();

const $ = (sel) => document.querySelector(sel);
const inviteDialog = $('#invite-dialog');
const ownDialog = $('#own-dialog');
const ownForm = $('#own-form');

const svg = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const OWN_ICON = svg('<circle cx="12" cy="12" r="4.5"/>');
const PLUS_ICON = svg('<path d="M12 6v12M6 12h12"/>');

// sizes: few = a few minutes, half = half an hour or so, open = an open stretch.
// Each invitation has a few thoughts; one is shown at a time.
// kind: make, connect, move or still. It sets the tile colour and the "It'd be nice to…" filter.
// The order mixes the kinds so the colours are spread around the grid.
const INVITATIONS = [
  {
    id: 'reading', kind: 'still', name: 'Reading', line: 'A few pages, on paper.', sizes: ['few', 'half', 'open'],
    icon: svg('<path d="M12 7c-2-1.5-5-2-8-1.5v12c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-12c-3-.5-6 0-8 1.5z"/><path d="M12 7v12"/>'),
    thoughts: [
      'Pick up the book that is already open somewhere in the house.',
      'One poem, read twice. Once for the words, once for the sound.',
      'Read until something makes you look up. Then stay looking up for a moment.',
      'Take the book to a different chair than usual.',
    ],
  },
  {
    id: 'writing', kind: 'make', name: 'Writing', line: 'The scholarly kind, unhurried.', sizes: ['half', 'open'],
    icon: svg('<path d="M12 21l-4.500-8L10 5h4l2.500 8z"/><path d="M12 21v-6.500"/><circle cx="12" cy="13" r="1.300"/><path d="M10 5V3h4v2"/>'),
    thoughts: [
      'One paragraph, by hand first. It does not have to be the next paragraph.',
      'Write down the question you keep circling. Just the question.',
      'Explain the idea to a friend in a few sentences, on paper.',
      'Reread a page you are proud of before adding anything new.',
    ],
  },
  {
    id: 'connecting', kind: 'connect', name: 'Connecting', line: 'Reach out to someone you love.', sizes: ['few', 'half'],
    icon: svg('<path d="M5.500 5.500h13A1.500 1.500 0 0 1 20 7v8a1.500 1.500 0 0 1-1.500 1.500H12l-4 3.500v-3.500H5.500A1.500 1.500 0 0 1 4 15V7a1.500 1.500 0 0 1 1.500-1.500z"/>'),
    thoughts: [
      'Who crossed your mind this week? Tell them so.',
      'Call instead of typing. If they do not pick up, leave a message with your voice in it.',
      'Send one person one sentence: something you appreciate about them.',
      'Ask someone how a thing they mentioned last time turned out.',
    ],
  },
  {
    id: 'walking', kind: 'move', name: 'Going on a walk', line: 'No destination needed.', sizes: ['few', 'half', 'open'],
    icon: svg('<path d="M7.200 3.500c1.700 0 2.500 1.500 2.500 3.500s-.800 3.500-2.500 3.500S4.700 9 4.700 7s.800-3.500 2.500-3.500z"/><path d="M5.700 12.500h3v1a1.500 1.500 0 0 1-3 0z"/><g transform="translate(9.600 5.500)"><path d="M7.200 3.500c1.700 0 2.500 1.500 2.500 3.500s-.800 3.500-2.500 3.500S4.700 9 4.700 7s.800-3.500 2.500-3.500z"/><path d="M5.700 12.500h3v1a1.500 1.500 0 0 1-3 0z"/></g>'),
    thoughts: [
      'Around the block, phone in a pocket or left at home.',
      'Turn down a street you usually pass.',
      'Walk until you have noticed five things you had not seen before.',
      'Go as far as the water and back.',
    ],
  },
  {
    id: 'journaling', kind: 'make', name: 'Journaling', line: 'A page for no one else.', sizes: ['few', 'half'],
    icon: svg('<rect x="6" y="4" width="13" height="16" rx="2"/><path d="M9 4v16M12 9h4M12 12.500h4"/>'),
    thoughts: [
      'What is on your mind right now? Start mid-sentence.',
      'Describe the room you are in, as if for someone who has never seen it.',
      'What did today ask of you? What did it give back?',
      'Write three lines and stop, even if there is more.',
    ],
  },
  {
    id: 'gratitude', kind: 'still', name: 'Gratitude', line: 'Notice what is already here.', sizes: ['few'],
    icon: svg('<path d="M12 4l1.800 5.200L19 11l-5.200 1.800L12 18l-1.800-5.200L5 11l5.200-1.800z"/>'),
    thoughts: [
      'Three small things from today. The smaller the better.',
      'Someone who made this week easier. What did they do?',
      'Something in this room you would miss.',
      'Something your body did for you today without being asked.',
    ],
  },
  {
    id: 'hug', kind: 'connect', name: 'Sharing a hug', line: 'A long one, with Karthik.', sizes: ['few'],
    icon: svg('<circle cx="9" cy="7" r="2.500"/><circle cx="15" cy="7" r="2.500"/><path d="M4.500 19v-3a4.500 4.500 0 0 1 7.500-3.300A4.500 4.500 0 0 1 19.500 16v3"/><path d="M8.500 16.500h7"/>'),
    thoughts: [
      'Go and find Karthik. Stay a few breaths longer than usual.',
      'No reason needed. Let the hug be the whole plan.',
      'Hold on until you both feel your shoulders drop.',
      'If Karthik is not nearby, send word that one is waiting.',
    ],
  },
  {
    id: 'stretching', kind: 'move', name: 'Stretching', line: 'Unfold a little.', sizes: ['few'],
    icon: svg('<circle cx="12" cy="5" r="2"/><path d="M12 8v7M12 10 7 6M12 10l5-4M12 15l-3 5M12 15l3 5"/>'),
    thoughts: [
      'Reach for the ceiling, then let everything hang. Three slow breaths each.',
      'Roll your shoulders back. Unclench your jaw. Notice your feet.',
      'Find the place that is tight and give it a full minute.',
      'Lie on the floor for a moment. That counts.',
    ],
  },
  {
    id: 'haiku', kind: 'make', name: 'Writing a haiku', line: 'Five, seven, five. That is all.', sizes: ['few', 'half'],
    icon: svg('<path d="M8 7h8M5 12h14M8 17h8"/>'),
    thoughts: [
      'Look around for one small thing, and give it seventeen syllables.',
      'Write one about the weather outside the window right now.',
      'Count the syllables on your fingers. It is part of the pleasure.',
      'Write one for someone, and tuck it where they will find it.',
    ],
  },
  {
    id: 'inspiration', kind: 'still', name: 'Finding inspiration', line: 'A quotation, a flower, a spark.', sizes: ['few', 'half'],
    icon: svg('<circle cx="12" cy="5.500" r="2.200"/><circle cx="15.600" cy="8" r="2.200"/><circle cx="14.200" cy="12" r="2.200"/><circle cx="9.800" cy="12" r="2.200"/><circle cx="8.400" cy="8" r="2.200"/><path d="M12 14.500V21"/>'),
    thoughts: [
      'Open your quotation collection somewhere in the middle. Read one, slowly, twice.',
      'Find a flower photo you had forgotten about. Remember where you were standing.',
      'Copy out a favourite quotation by hand.',
      'Choose one quotation to carry with you for the rest of the day.',
    ],
  },
  {
    id: 'lettering', kind: 'connect', name: 'Lettering', line: 'A letter or a postcard.', sizes: ['few', 'half', 'open'],
    icon: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3.500 7.500 12 13l8.500-5.500"/>'),
    thoughts: [
      'Who would be surprised to find your handwriting in their post box?',
      'A postcard only needs three sentences. One of them can be about the weather.',
      'Tell someone about one small thing you saw this week.',
      'Begin with “I thought of you when…”',
    ],
  },
  {
    id: 'breathing', kind: 'move', name: 'Breathing', line: 'Three deep breaths.', sizes: ['few'],
    icon: svg('<path d="M4 9h10a2.500 2.500 0 1 0-2.500-2.500M4 13h14a2.500 2.500 0 1 1-2.500 2.500M4 17h6"/>'),
    thoughts: [
      'Three deep breaths. In through the nose, and out more slowly than in.',
      'Breathe in for four, out for six. Three times.',
      'Let the first breath drop your shoulders, the second your jaw, the third your hands.',
      'Three breaths by an open window.',
    ],
  },
  {
    id: 'crafting', kind: 'make', name: 'Crafting', line: 'Something made by hand.', sizes: ['half', 'open'],
    icon: svg('<circle cx="7" cy="7" r="2.500"/><circle cx="7" cy="17" r="2.500"/><path d="M9 8.500 20 17M9 15.500 20 7"/>'),
    thoughts: [
      'Lay the materials out first. See what they suggest.',
      'Pick up the project that is closest to hand, not the one that is most behind.',
      'Make something small enough to finish, or do one small part of something large.',
      'It does not have to turn out.',
    ],
  },
  {
    id: 'noticing', kind: 'still', name: 'Looking out', line: 'A window and a few minutes.', sizes: ['few'],
    icon: svg('<rect x="5.500" y="5" width="13" height="14.500" rx="1"/><path d="M3.500 5h17M4 19.500h16"/><path d="M10 5c0 4.500-1.500 7.500-4.500 9M14 5c0 4.500 1.500 7.500 4.500 9"/>'),
    thoughts: [
      'Stand at the window. What is the sky doing?',
      'Watch the street the way you would watch a film.',
      'Find something that is moving slowly.',
    ],
  },
  {
    id: 'love', kind: 'connect', name: 'A little love', line: 'A hand to your heart.', sizes: ['few'],
    icon: svg('<path d="M12 19s-7-4.300-7-9.200A3.800 3.800 0 0 1 12 7.600a3.800 3.800 0 0 1 7 2.200C19 14.700 12 19 12 19z"/>'),
    thoughts: [
      'Hand to your heart. Feel it going, steadily, on your behalf.',
      'Say one kind thing to yourself, the way you would say it to a friend.',
      'Name something you did well this week. Let it be enough.',
      'Hand to your heart, and tell yourself: I am doing fine.',
    ],
  },
  {
    id: 'tending', kind: 'still', name: 'Tending', line: 'A plant, a shelf, one small corner.', sizes: ['few', 'half'],
    icon: svg('<path d="M12 20v-8M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2.500-4.500-6-4.500 0 3 2.500 4.500 6 4.500z"/>'),
    thoughts: [
      'Water whatever needs watering. Look at each plant while you do.',
      'Clear one surface. Only one.',
      'Mend, sew or fix the small thing that has been waiting.',
    ],
  },
  {
    id: 'dancing', kind: 'move', name: 'Dancing', line: 'No music needed.', sizes: ['few'],
    icon: svg('<circle cx="12" cy="5" r="2"/><path d="M5.500 8.500l2.700 2.700L12 9.800l3.800-1.300 2.700 2.700"/><path d="M12 9.800v4.700M12 14.500l-3 6M12 14.500l3 6"/>'),
    thoughts: [
      'Shake it off: hands, arms, shoulders, the whole thing. Thirty seconds.',
      'No music needed. Move however your body wants to, badly and gladly.',
      'Let loose until you laugh or run out of breath, whichever comes first.',
      'Notice how good it is to have a body that can do this.',
    ],
  },
  {
    id: 'wish', kind: 'connect', name: 'Sending a wish', line: 'Hold someone in your heart.', sizes: ['few'],
    icon: svg('<path d="M9.500 20v-8.500h5V20M7 20h10"/><path d="M12 9c-1.300-1-1.300-2.500 0-4.500 1.300 2 1.300 3.500 0 4.500z"/>'),
    thoughts: [
      'Bring one person to mind. Picture their face, and wish them an easy day.',
      'Hold someone in your heart for three breaths. They do not need to know.',
      'Think of someone who is having a hard time. Send them a little strength.',
      'Silently, to someone you love: may you be well, may you be at ease.',
    ],
  },
  {
    id: 'kalimba', kind: 'still', name: 'Playing the kalimba', line: 'A few notes, going nowhere.', sizes: ['few'],
    icon: svg('<rect x="5.500" y="4" width="13" height="16" rx="3"/><path d="M9 4v8M12 4v11M15 4v8"/>'),
    thoughts: [
      'Pluck a few notes and let each one ring out before the next.',
      'No song, no goal. Follow whatever sounds nice.',
      'Find two notes you like together and go back and forth between them.',
      'Play with your eyes closed for a minute.',
    ],
  },
  {
    id: 'resting', kind: 'still', name: 'Resting', line: 'Nothing at all is also something.', sizes: ['few', 'half'],
    icon: svg('<path d="M19 14.500A7.500 7.500 0 0 1 9.500 5a7.500 7.500 0 1 0 9.500 9.500z"/>'),
    thoughts: [
      'Lie down. Close your eyes. You do not have to sleep.',
      'Sit somewhere soft and let the time pass without filling it.',
      'You are allowed to do nothing with this.',
    ],
  },
];

// The line under the greeting, Sunday first.
const DAY_LINES = [
  'It’s Sunday. Nothing is due.',
  'It’s Monday. The week can wait a few minutes.',
  'It’s Tuesday. There’s room in it.',
  'It’s Wednesday. The middle is a good place to pause.',
  'It’s Thursday. No hurry.',
  'It’s Friday. Let the week set itself down.',
  'It’s Saturday. The day is yours.',
];

const KIND_TINTS = { make: 'blue', connect: 'clay', move: 'honey', still: 'sage' };

let currentId = null;      // the invitation open in the dialog
let currentThought = 0;
let chosenBySelma = false;

// ---------- storage ----------

function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    if (data && Array.isArray(data.own) && Array.isArray(data.away) && Array.isArray(data.trail)) return data;
  } catch {}
  // own: invitations Ashton added; away: ids put out of sight; trail: ids only, no dates.
  return { own: [], away: [], trail: [] };
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

// ---------- invitations ----------

function allInvitations() {
  const own = state.own.map((item) => ({ ...item, icon: OWN_ICON, isOwn: true }));
  return [...INVITATIONS, ...own];
}

function findInvitation(id) {
  return allInvitations().find((item) => item.id === id);
}

function tintOf(item) {
  return KIND_TINTS[item.kind] || 'plain';
}

function selectedSize() {
  return document.querySelector('#time-filter input:checked').value;
}

function visibleInvitations() {
  const size = selectedSize();
  const kind = document.querySelector('#kind-filter input:checked').value;
  return allInvitations().filter((item) =>
    !state.away.includes(item.id) && (!size || item.sizes.includes(size)) && (!kind || item.kind === kind));
}

function renderInvitations() {
  const list = $('#invites');
  list.replaceChildren();
  for (const item of visibleInvitations()) {
    const card = document.createElement('button');
    card.className = 'invite';
    card.dataset.invite = item.id;
    card.innerHTML = `<div class="invite-icon ${tintOf(item)}">${item.icon}</div><div><h3></h3><p></p></div>`;
    card.querySelector('h3').textContent = item.name;
    card.querySelector('p').textContent = item.line || '';
    list.append(card);
  }
  const own = document.createElement('button');
  own.className = 'invite own';
  own.dataset.action = 'new-own';
  own.innerHTML = `<div class="invite-icon plain">${PLUS_ICON}</div><div>Add your own</div>`;
  list.append(own);

  const note = $('#hidden-note');
  note.hidden = state.away.length === 0;
  if (state.away.length) {
    const count = state.away.length === 1 ? 'One invitation is' : `${state.away.length} invitations are`;
    note.innerHTML = `${count} put away. <button class="link" data-action="bring-back">Bring them back</button>`;
  }
}

function openInvitation(id, bySelma) {
  const item = findInvitation(id);
  if (!item) return;
  currentId = id;
  chosenBySelma = bySelma;
  const thoughts = item.thoughts || [];
  currentThought = Math.floor(Math.random() * thoughts.length);

  $('#invitation').hidden = false;
  $('#farewell').hidden = true;
  $('#invite-eyebrow').hidden = !bySelma;
  const icon = $('#invite-icon');
  icon.className = `invite-icon large ${tintOf(item)}`;
  icon.innerHTML = item.icon;
  $('#invite-name').textContent = item.name;
  showThought(item);
  $('#another-thought').hidden = thoughts.length < 2;
  $('#mail-link').hidden = id !== 'lettering';
  $('#not-this').textContent = bySelma ? 'Something else' : 'Not this one';
  $('#hide-invite').textContent = item.isOwn ? 'Remove' : 'Put this one away';
  if (!inviteDialog.open) inviteDialog.showModal();
}

function showThought(item) {
  const thoughts = item.thoughts || [];
  $('#invite-prompt').textContent = thoughts[currentThought] || item.line || 'Whenever you are ready.';
}

function letSelmaChoose() {
  const options = visibleInvitations().filter((item) => item.id !== currentId);
  if (!options.length) return toast('Nothing to choose from just now.');
  openInvitation(options[Math.floor(Math.random() * options.length)].id, true);
}

function go() {
  state.trail.unshift(currentId);
  state.trail.length = Math.min(state.trail.length, TRAIL_KEEPS);
  saveState();
  $('#invitation').hidden = true;
  $('#farewell').hidden = false;
  renderTrail();
}

function putAway() {
  const item = findInvitation(currentId);
  if (item.isOwn) {
    state.own = state.own.filter((own) => own.id !== currentId);
    state.trail = state.trail.filter((id) => id !== currentId);
  } else {
    state.away.push(currentId);
  }
  saveState();
  inviteDialog.close();
  renderInvitations();
  renderTrail();
  toast(item.isOwn ? 'Removed.' : 'Put away. You can bring it back any time.');
}

// ---------- trail ----------

function renderTrail() {
  const trail = $('#trail');
  const marks = state.trail.map(findInvitation).filter(Boolean);
  if (!marks.length) {
    trail.innerHTML = `<div class="empty"><img src="selma-time.svg" alt=""><h3>No trail yet</h3><p>It begins whenever you do. There is no hurry.</p></div>`;
    return;
  }
  trail.innerHTML = `
    <p class="trail-intro">Where the slow time has gone lately. Nothing is counted or dated, and the oldest marks fade on their own.</p>
    <div class="trail-path"><img src="selma-time.svg" alt=""></div>
    <div class="trail-actions"><button class="link" data-action="sweep">Sweep the trail clean</button></div>`;
  const path = trail.querySelector('.trail-path');
  marks.forEach((item, index) => {
    const mark = document.createElement('button');
    mark.className = `invite-icon ${tintOf(item)}`;
    mark.dataset.mark = item.name;
    mark.title = item.name;
    mark.setAttribute('aria-label', item.name);
    mark.style.opacity = Math.max(0.3, 1 - index * 0.012).toFixed(2);
    mark.innerHTML = item.icon;
    path.append(mark);
  });
}

// ---------- greeting + clock ----------

function renderGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let hello = 'Good evening.';
  if (hour < 5) hello = 'The quiet hours.';
  else if (hour < 12) hello = 'Good morning.';
  else if (hour < 17) hello = 'Good afternoon.';
  else if (hour >= 22) hello = 'A late hour.';
  $('#greeting').textContent = hello;
  $('#greeting-sub').textContent = `${DAY_LINES[now.getDay()]} What would feel good right now?`;
}

function setClock() {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = (now.getHours() % 12) + minutes / 60;
  $('#hour-hand').style.transform = `rotate(${hours * 30}deg)`;
  $('#minute-hand').style.transform = `rotate(${minutes * 6}deg)`;
}

// ---------- small things ----------

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function showView(name) {
  for (const view of ['now', 'trail']) $(`#view-${view}`).hidden = view !== name;
  for (const tab of document.querySelectorAll('.tab')) {
    if (tab.dataset.view === name) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}

// ---------- events ----------

document.addEventListener('click', (event) => {
  const tab = event.target.closest('.tab');
  if (tab) return showView(tab.dataset.view);

  const card = event.target.closest('[data-invite]');
  if (card) return openInvitation(card.dataset.invite, false);

  const mark = event.target.closest('[data-mark]');
  if (mark) return toast(mark.dataset.mark);

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  if (action === 'choose') { currentId = null; letSelmaChoose(); }
  if (action === 'another-thought') {
    const item = findInvitation(currentId);
    currentThought = (currentThought + 1) % item.thoughts.length;
    showThought(item);
  }
  if (action === 'not-this') {
    if (chosenBySelma) letSelmaChoose();
    else inviteDialog.close();
  }
  if (action === 'go') go();
  if (action === 'hide-invite') putAway();
  if (action === 'close-dialog') event.target.closest('dialog').close();
  if (action === 'new-own') { ownForm.reset(); ownDialog.showModal(); }
  if (action === 'bring-back') { state.away = []; saveState(); renderInvitations(); }
  if (action === 'sweep') {
    if (confirm('Sweep the trail clean? This only clears the marks; your invitations stay.')) {
      state.trail = [];
      saveState();
      renderTrail();
    }
  }
});

// Click outside a dialog closes it.
for (const dialog of [inviteDialog, ownDialog]) {
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}

$('#time-filter').addEventListener('change', renderInvitations);
$('#kind-filter').addEventListener('change', renderInvitations);

ownForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(ownForm);
  const name = data.get('name').trim();
  if (!name) return;
  const sizes = data.getAll('sizes');
  state.own.push({
    id: `own-${Date.now().toString(36)}`,
    name,
    line: data.get('line').trim(),
    kind: data.get('kind'),
    sizes: sizes.length ? sizes : ['few', 'half', 'open'],
  });
  saveState();
  ownDialog.close();
  renderInvitations();
});

// ---------- start ----------

renderGreeting();
setClock();
setInterval(() => { setClock(); renderGreeting(); }, 20000);
renderInvitations();
renderTrail();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
