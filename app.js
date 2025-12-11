// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const engine = require('ejs-mate'); // layout engine (optional)
const db = require('./config/db');  // mysql pool (promise pool)
const postsRouter = require('./routes/posts');

const app = express();

// ----- View Engine Setup (EJS + ejs-mate) -----
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static('public'));

// ----- Middlewares -----
app.use(express.urlencoded({ extended: true })); // extended true rakho, nested data ke liye
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false
}));

app.use(flash());

// make flash & session available in views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || req.session.admin || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// ================== APPOINTMENT SAVE ROUTE ==================
app.post('/appointments', async (req, res) => {
  try {
    const {
      service_id,
      service_title,
      full_name,
      mobile,
      email,
      message
    } = req.body;

    const query = `
      INSERT INTO appointments
      (service_id, service_title, full_name, mobile, email, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    // Yaha db (promise pool) use karna hai
    await db.query(query, [
      service_id || null,
      service_title || null,
      full_name,
      mobile,
      email,
      message
    ]);

    req.flash('success', 'Appointment submitted successfully!');
    res.redirect('/services?appointment=success');

  } catch (err) {
    console.error('Error saving appointment:', err);
    req.flash('error', 'Something went wrong while booking appointment.');
    res.redirect('/services?appointment=error');
  }
});
// ============================================================
// app.js

// ye hona chahiye:
app.use('/posts', postsRouter);


// ----- Routes -----
app.use('/', require('./routes/website'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/services', require('./routes/services')); 

// ----- Start Server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Project Running on http://localhost:${PORT}`));
