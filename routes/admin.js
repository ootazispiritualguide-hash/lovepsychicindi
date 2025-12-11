// routes/admin.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');         // only declared once
const db = require('../config/db').promise();
const bcrypt = require('bcryptjs');

// optional sharp - dimension check
let sharp;
try { sharp = require('sharp'); } catch (e) { sharp = null; }

// protect middleware
function protect(req, res, next) {
  if (!req.session.admin) return res.redirect('/auth/login');
  next();
}

/* ------------- Multer storages ------------- */
// profile avatar storage (keeps in public/uploads)
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png/;
    if (!allowed.test(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 }
});

// banner storage (separate folder)
const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'banners');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const bannerUpload = multer({
  storage: bannerStorage,
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png/;
    if (!allowed.test(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB for banners
});

/* ------------- Admin routes ------------- */

// Dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const [[u]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[inq]] = await db.query('SELECT COUNT(*) as totalInquiries FROM inquiries');
    const stats = { totalUsers: u.totalUsers || 0, totalInquiries: inq.totalInquiries || 0 };
    res.render('admin/dashboard', { admin: req.session.admin, stats });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { admin: req.session.admin, stats: { totalUsers: 0, totalInquiries: 0 } });
  }
});

// Profile view
router.get('/profile', protect, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.admin.id]);
  res.render('admin/profile', { admin: rows[0] });
});

// Change profile (form submission)
router.post('/change-profile', protect, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let avatarPath = null;
    if (req.file) avatarPath = '/uploads/' + req.file.filename;

    if (password && password.trim().length > 0) {
      const hash = await bcrypt.hash(password, 10);
      if (avatarPath) {
        await db.query('UPDATE users SET name=?, email=?, password=?, avatar=? WHERE id=?', [name, email, hash, avatarPath, req.session.admin.id]);
      } else {
        await db.query('UPDATE users SET name=?, email=?, password=? WHERE id=?', [name, email, hash, req.session.admin.id]);
      }
    } else {
      if (avatarPath) {
        await db.query('UPDATE users SET name=?, email=?, avatar=? WHERE id=?', [name, email, avatarPath, req.session.admin.id]);
      } else {
        await db.query('UPDATE users SET name=?, email=? WHERE id=?', [name, email, req.session.admin.id]);
      }
    }

    // refresh session
    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.admin.id]);
    req.session.admin.name = userRows[0].name;
    req.session.admin.email = userRows[0].email;
    req.session.admin.avatar = userRows[0].avatar;

    req.flash('success', 'Profile updated');
    res.redirect('/admin/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update profile');
    res.redirect('/admin/profile');
  }
});

/* ------------- Banner management ------------- */

// Show banner page
router.get('/banner', protect, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM banners ORDER BY created_at DESC');
    res.render('admin/banner', { admin: req.session.admin, banners: rows });
  } catch (err) {
    console.error(err);
    res.render('admin/banner', { admin: req.session.admin, banners: [] });
  }
});

// Upload new banner
router.post('/banner', protect, bannerUpload.single('banner_image'), async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please upload an image.');
      return res.redirect('/admin/banner');
    }

    const filepath = '/uploads/banners/' + req.file.filename;
    const title = req.body.title || '';
    const content = req.body.content || '';
    const makeActive = req.body.make_active === 'on' ? 1 : 0;

    // optional dimension validation using sharp (if installed)
    if (sharp) {
      const metadata = await sharp(req.file.path).metadata();
      if (metadata.width !== 1200 || metadata.height !== 500) {
        // remove uploaded file
        fs.unlinkSync(req.file.path);
        req.flash('error', 'Image must be exactly 1200 x 500 pixels.');
        return res.redirect('/admin/banner');
      }
    }

    if (makeActive === 1) {
      await db.query('UPDATE banners SET is_active = 0 WHERE is_active = 1');
    }

    await db.query('INSERT INTO banners (title, content, image_path, is_active) VALUES (?, ?, ?, ?)', [title, content, filepath, makeActive]);
    req.flash('success', 'Banner uploaded');
    res.redirect('/admin/banner');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Banner upload failed');
    res.redirect('/admin/banner');
  }
});

// Toggle banner active state
router.post('/banner/:id/toggle', protect, async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (!rows.length) { req.flash('error', 'Not found'); return res.redirect('/admin/banner'); }
    const newState = rows[0].is_active ? 0 : 1;
    if (newState === 1) await db.query('UPDATE banners SET is_active = 0');
    await db.query('UPDATE banners SET is_active = ? WHERE id = ?', [newState, id]);
    req.flash('success', 'Banner state updated');
    res.redirect('/admin/banner');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Operation failed');
    res.redirect('/admin/banner');
  }
});

// View contact queries list
router.get('/queries', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, mobile_no, email, message, created_at FROM query_data ORDER BY created_at DESC'
    );

    res.render('admin/query_data', {
      admin: req.session.admin,
      queries: rows
    });
  } catch (err) {
    console.error(err);
    res.render('admin/query_data', {
      admin: req.session.admin,
      queries: []
    });
  }
});


router.get('/services', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, description, price, duration_minutes, created_at FROM services ORDER BY created_at DESC'
    );

    res.render('admin/services', {
      admin: req.session.admin,
      services: rows
    });

  } catch (err) {
    console.log(err);
    res.render('admin/services', {
      admin: req.session.admin,
      services: []
    });
  }
});

// DELETE service
router.post('/services/:id/delete', protect, async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM services WHERE id = ?', [id]);
    req.flash('success', 'Service deleted successfully');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete service');
  }
  res.redirect('/admin/services');
});

router.get('/posts', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, slug, category, image, content, created_at FROM posts ORDER BY created_at DESC'
    );

    res.render('admin/post_view', {
      admin: req.session.admin,
      posts: rows
    });
  } catch (err) {
    console.error(err);
    res.render('admin/post_view', {
      admin: req.session.admin,
      posts: []
    });
  }
});
router.post('/posts/:id/delete', protect, async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM posts WHERE id = ?', [id]);
    req.flash('success', 'Post deleted successfully');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete post');
  }
  res.redirect('/admin/posts');
});


// section image storage
const sectionStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'section');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const sectionUpload = multer({
  storage: sectionStorage,
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png/;
    if (!allowed.test(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 }
});

// SHOW section (latest block + form)
router.get('/sections', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM section_blocks ORDER BY created_at DESC'
    );
    res.render('admin/sections', {
      admin: req.session.admin,
      sections: rows
    });
  } catch (err) {
    console.error(err);
    res.render('admin/sections', {
      admin: req.session.admin,
      sections: []
    });
  }
});

// SAVE new section block
router.post('/sections', protect, sectionUpload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!req.file) {
      req.flash('error', 'Please upload an image.');
      return res.redirect('/admin/sections');
    }

    const imagePath = '/uploads/section/' + req.file.filename;

    await db.query(
      'INSERT INTO section_blocks (title, content, image) VALUES (?, ?, ?)',
      [title, content, imagePath]
    );

    req.flash('success', 'Section block saved successfully');
    res.redirect('/admin/sections');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to save section block');
    res.redirect('/admin/sections');
  }
});



module.exports = router;
