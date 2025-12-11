const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const db = require('../config/db').promise();
const router = express.Router();

// Multer setup for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Login & register pages
router.get('/login', (req, res) => {
  res.render('admin/login');
});
router.get('/register', (req, res) => {
  res.render('admin/register');
});

// Handle register
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) {
      req.flash('error', 'Email already registered');
      return res.redirect('/auth/register');
    }
    const hash = await bcrypt.hash(password, 10);
    const avatar = req.file ? '/uploads/' + req.file.filename : null;
    await db.query('INSERT INTO users (name,email,password,avatar) VALUES (?,?,?,?)', [name, email, hash, avatar]);
    req.flash('success', 'Registration successful. Please login.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/auth/register');
  }
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/auth/login');
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/auth/login');
    }
    req.session.admin = { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/auth/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
});

module.exports = router;
