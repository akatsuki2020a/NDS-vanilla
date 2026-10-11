const path = require('path');
const express = require('express');

const clinics = require('./data/clinics.json');
const doctors = require('./data/doctors.json');
const appointments = require('./data/appointments.json');
const results = require('./data/results.json');
const trends = require('./data/trends.json');
const queues = require('./data/queue.json');

const PORT = process.env.PORT || 3003;
const PER_PAGE = 6;
const PATIENT = { name: 'Reem Al-Harbi', mrn: 'MRN-204518' };
const DAY = 24 * 60 * 60 * 1000;
const ROOMS = Array.from({ length: 8 }, (_, i) => `Room ${i + 1}`);
const TICKET_LETTER = {
  'Family Medicine': 'A', Pediatrics: 'B', Dermatology: 'C', Dentistry: 'D', Cardiology: 'E', Orthopedics: 'F',
};
const NOTICES = [
  'Please keep your ticket until your visit ends.',
  'Children under 12 must be accompanied by an adult.',
  'Please keep your phone on silent in the waiting area.',
  'Lab samples are collected on the ground floor until 6 p.m.',
  'Please have your ID and insurance card ready at the desk.',
];

// Slots and upcoming visits are sample data: roll them forward so they are never in the past.
function roll(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff <= 0) return iso;
  const d = new Date(new Date(iso).getTime() + Math.ceil(diff / DAY) * DAY);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
clinics.forEach((c) => { c.next_slot = roll(c.next_slot); });
appointments.forEach((a) => { if (a.status === 'booked') a.at = roll(a.at); });

const byId = (list, id) => list.find((x) => x.id === Number(id));
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
const contactMessages = [];

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.when = (iso) => new Date(iso).toLocaleString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.active = '';
  res.locals.title = 'Al-Nakheel Medical Clinics';
  res.locals.patient = PATIENT;
  next();
});

/* ---------- API ---------- */

app.get('/api/clinics', (req, res) => {
  const { q, specialty, branch, sort } = req.query;
  let items = clinics.slice();
  if (q) items = items.filter((c) => c.name.toLowerCase().includes(String(q).toLowerCase()));
  if (specialty) items = items.filter((c) => c.specialty === specialty);
  if (branch) items = items.filter((c) => c.branch === branch);
  const sorters = {
    rating: (a, b) => a.rating - b.rating,
    '-rating': (a, b) => b.rating - a.rating,
    next_slot: (a, b) => a.next_slot.localeCompare(b.next_slot),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  if (sorters[sort]) items.sort(sorters[sort]);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  res.json({
    items: items.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    page,
    per_page: PER_PAGE,
    total: items.length,
  });
});

app.get('/api/doctors/:id', (req, res) => {
  const doctor = byId(doctors, req.params.id);
  if (!doctor) return res.status(404).json({ error: 'not_found' });
  res.json(doctor);
});

app.get('/api/appointments', (req, res) => res.json(appointments));

app.post('/api/appointments', (req, res) => {
  const { clinic_id, doctor_id, date, time, reason, phone } = req.body || {};
  const errors = {};
  const clinic = byId(clinics, clinic_id);
  const doctor = byId(doctors, doctor_id);
  if (!clinic) errors.clinic_id = 'Choose a clinic';
  if (!doctor || (clinic && doctor.clinic_id !== clinic.id)) errors.doctor_id = 'Choose a doctor from this clinic';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(Date.parse(date))) errors.date = 'Enter a valid date';
  else if (date < today()) errors.date = 'The date cannot be in the past';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) errors.time = 'Choose a time';
  if (!/^05\d{8}$/.test(phone || '')) errors.phone = 'Enter a mobile number like 0501234567';
  if (reason && String(reason).length > 300) errors.reason = 'Keep the reason under 300 characters';
  if (Object.keys(errors).length) return res.status(422).json({ errors });

  const id = Math.max(0, ...appointments.map((a) => a.id)) + 1;
  appointments.push({ id, doctor_id: doctor.id, clinic_id: clinic.id, at: `${date}T${time}`, status: 'booked', reason: reason || '' });
  res.status(201).json({ id });
});

app.delete('/api/appointments/:id', (req, res) => {
  const appt = byId(appointments, req.params.id);
  if (!appt) return res.status(404).json({ error: 'not_found' });
  if (appt.status === 'completed') return res.status(409).json({ error: 'already_completed' });
  appt.status = 'cancelled';
  res.status(204).end();
});

app.get('/api/results', (req, res) => {
  res.json(results.map(({ values, ...rest }) => rest));
});

app.get('/api/results/trends', (req, res) => {
  const wanted = String(req.query.test || '').toLowerCase();
  const test = Object.keys(trends).find((name) => name.toLowerCase() === wanted);
  if (!test) return res.status(404).json({ error: 'not_found' });
  const { unit, range, points } = trends[test];
  res.json({ test, unit, range, points });
});

app.get('/api/results/:id', (req, res) => {
  const result = byId(results, req.params.id);
  if (!result) return res.status(404).json({ error: 'not_found' });
  res.json(result);
});

/* Waiting-room queue: one shared queue per branch. It only moves while a screen is connected. */

const queueFeeds = {};

function hasBranch(slug) {
  return Object.prototype.hasOwnProperty.call(queues, slug);
}

function queueState(slug) {
  const { branch, now_serving, next, updated_at } = queues[slug];
  return { branch, now_serving, next, updated_at };
}

function advanceQueue(slug) {
  const q = queues[slug];
  const waiting = q.next.shift();
  q.now_serving.shift();
  const free = ROOMS.filter((r) => !q.now_serving.some((t) => t.room === r));
  q.now_serving.push({ ...waiting, room: free[Math.floor(Math.random() * free.length)] });
  const here = clinics.filter((c) => c.branch === q.branch);
  const clinic = here[Math.floor(Math.random() * here.length)];
  const letter = TICKET_LETTER[clinic.specialty];
  q.counters[letter] += 1;
  q.next.push({ ticket: `${letter}-${q.counters[letter]}`, clinic: clinic.name });
  q.updated_at = new Date().toISOString();
}

function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

Object.keys(queues).forEach((slug) => {
  const q = queues[slug];
  q.updated_at = new Date().toISOString();
  q.counters = {};
  Object.values(TICKET_LETTER).forEach((l) => { q.counters[l] = 100; });
  [...q.now_serving, ...q.next].forEach((t) => {
    const [l, n] = t.ticket.split('-');
    q.counters[l] = Math.max(q.counters[l], Number(n));
  });
});

app.get('/api/queue', (req, res) => {
  if (!hasBranch(req.query.branch)) return res.status(404).json({ error: 'not_found' });
  res.json(queueState(req.query.branch));
});

app.get('/api/queue/stream', (req, res) => {
  const slug = req.query.branch;
  if (!hasBranch(slug)) return res.status(404).json({ error: 'not_found' });
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n\n');
  sendEvent(res, 'queue', queueState(slug));

  const feed = queueFeeds[slug] || (queueFeeds[slug] = { clients: new Set(), timers: [] });
  feed.clients.add(res);
  if (feed.clients.size === 1) {
    const each = (event, data) => feed.clients.forEach((c) => sendEvent(c, event, data));
    feed.timers = [
      setInterval(() => { advanceQueue(slug); each('queue', queueState(slug)); }, 8000),
      setInterval(() => each('notice', { text: NOTICES[Math.floor(Math.random() * NOTICES.length)] }), 60000),
    ];
  }
  req.on('close', () => {
    feed.clients.delete(res);
    if (!feed.clients.size) {
      feed.timers.forEach(clearInterval);
      feed.timers = [];
    }
  });
});

app.post('/api/contact', (req, res) => {
  const { firstName, lastName, email, phone, subject, category, message } = req.body || {};
  const errors = {};
  if (!firstName || !String(firstName).trim()) errors.firstName = 'Enter your first name';
  if (!lastName || !String(lastName).trim()) errors.lastName = 'Enter your last name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) errors.email = 'Enter a valid email address';
  if (phone && !/^\d{7,15}$/.test(String(phone).replace(/\s/g, ''))) errors.phone = 'Enter a valid phone number';
  if (!message || String(message).trim().length < 10) errors.message = 'Tell us a little more (at least 10 characters)';
  if (Object.keys(errors).length) return res.status(422).json({ errors });
  contactMessages.push({ firstName, lastName, email, phone, subject, category, message, at: new Date().toISOString() });
  res.status(201).json({ id: contactMessages.length });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

/* ---------- Pages ---------- */

app.get('/', (req, res) => {
  res.render('home', { active: 'home', title: 'Home' });
});

app.get('/clinics', (req, res) => {
  const specialties = [...new Set(clinics.map((c) => c.specialty))].sort();
  const branches = [...new Set(clinics.map((c) => c.branch))];
  res.render('clinics', { active: 'clinics', title: 'Our Clinics', specialties, branches });
});

app.get('/doctors/:id', (req, res) => {
  const doctor = byId(doctors, req.params.id);
  if (!doctor) return res.status(404).render('404', { title: 'Doctor not found' });
  const clinic = byId(clinics, doctor.clinic_id);
  res.render('doctor', { active: 'clinics', title: doctor.name, doctor, clinic });
});

app.get('/book', (req, res) => {
  res.render('book', { active: 'book', title: 'Book an Appointment', clinics });
});

app.get('/appointments', (req, res) => {
  const rows = appointments
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((a) => ({ ...a, doctor: byId(doctors, a.doctor_id), clinic: byId(clinics, a.clinic_id) }));
  res.render('appointments', { active: 'appointments', title: 'My Appointments', rows });
});

app.get('/contact', (req, res) => {
  res.render('contact', { active: 'contact', title: 'Contact Us' });
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'bad_json' });
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

app.listen(PORT, () => {
  console.log(`Al-Nakheel Clinics running on http://localhost:${PORT}`);
});
