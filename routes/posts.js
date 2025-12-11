// routes/posts.js
const express = require('express');
const router = express.Router();
const db = require('../config/db').promise();

// ==== MULTER & PATH SETUP (image upload) ====
const multer = require('multer');
const path = require('path');

// storage: public/uploads/posts_img
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'posts_img'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage }); // <<== yahi define ho raha hai, ab iske baad hi routes aayenge

// ================== LIST all posts -> GET /posts ==================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.render('posts/post_index', {
      title: 'Blog',
      posts: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading blog posts');
  }
});

// ================== ADD POST form -> GET /posts/post_add ==================
router.get('/post_add', (req, res) => {
  res.render('posts/post_add', {
    title: 'Add New Post'
  });
});

// ================== ADD POST save -> POST /posts/post_add ==================
router.post('/post_add', upload.single('image'), async (req, res) => {
  try {
    const { title, category, slug, content } = req.body;

    let imageName = null;
    if (req.file) {
      imageName = req.file.filename;
    }

    await db.query(
      'INSERT INTO posts (title, category, slug, image, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [title, category, slug, imageName, content]
    );

    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding post');
  }
});

// ================== EDIT form -> GET /posts/edit/:id ==================
router.get('/edit/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).send('Post not found');

    res.render('posts/post_edit', {
      title: 'Edit Post',
      post: rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit form');
  }
});

// ================== UPDATE handler -> POST /posts/update/:id ==================
router.post('/update/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, category, slug, content, created_at } = req.body;

    // optional: agar edit pe image change karni ho
    let imageName = req.body.old_image || null;
    if (req.file) {
      imageName = req.file.filename;
    }

    await db.query(
      'UPDATE posts SET title = ?, category = ?, slug = ?, image = ?, content = ?, created_at = ? WHERE id = ?',
      [title, category, slug, imageName, content, created_at, req.params.id]
    );

    res.render('posts/post_update', {
      title: 'Post Updated',
      message: 'Post successfully updated!',
      redirectUrl: '/posts'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating post');
  }
});

// ================== DELETE handler -> POST /posts/delete/:id ==================
router.post('/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);

    res.render('posts/post_delete', {
      title: 'Post Deleted',
      message: 'Post successfully deleted!',
      redirectUrl: '/posts'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting post');
  }
});

// ================== VIEW single post by slug -> GET /posts/:slug ==================
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const [rows] = await db.query('SELECT * FROM posts WHERE slug = ? LIMIT 1', [slug]);
    if (!rows.length) {
      return res.status(404).send('Post not found');
    }
    res.render('posts/post_view', {
      title: rows[0].title,
      post: rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading post');
  }
});

module.exports = router;
