// routes/services.js
const express = require('express');
const router = express.Router();
const db = require('../config/db').promise();

// LIST all services  ->  GET /services
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services ORDER BY id DESC');
    res.render('website/services', { services: rows });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading services');
    res.redirect('/');
  }
});

// ADD FORM  ->  GET /services/add
router.get('/add', (req, res) => {
  res.render('website/add_service');
});

// ADD SAVE  ->  POST /services/add
router.post('/add', async (req, res) => {
  const { title, description, price, duration_minutes } = req.body;

  try {
    await db.query(
      'INSERT INTO services (title, description, price, duration_minutes) VALUES (?,?,?,?)',
      [title, description, price, duration_minutes]
    );
    req.flash('success', 'Service added successfully');
    res.redirect('/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error adding service');
    res.redirect('/services/add');
  }
});

// EDIT FORM  ->  GET /services/edit/:id
router.get('/edit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!rows.length) {
      req.flash('error', 'Service not found');
      return res.redirect('/services');
    }
    res.render('website/edit_service', { service: rows[0] });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading service');
    res.redirect('/services');
  }
});

// UPDATE SAVE  ->  POST /services/update/:id
router.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, price, duration_minutes } = req.body;

  try {
    await db.query(
      'UPDATE services SET title=?, description=?, price=?, duration_minutes=? WHERE id=?',
      [title, description, price, duration_minutes, id]
    );
    req.flash('success', 'Service updated successfully');
    res.redirect('/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating service');
    res.redirect('/services');
  }
});

// DELETE  ->  GET /services/delete/:id
router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM services WHERE id = ?', [id]);
    req.flash('success', 'Service deleted successfully');
    res.redirect('/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting service');
    res.redirect('/services');
  }
});

// ================== SINGLE SERVICE DETAIL PAGE ==================
// GET /services/:id  -> View single service details
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);

    if (!rows.length) {
      req.flash('error', 'Service not found');
      return res.redirect('/services');
    }

    const service = rows[0];

    res.render('website/view_service', {
      title: service.title,
      service
    });

  } catch (err) {
    console.error('Error loading service details:', err);
    req.flash('error', 'Error loading service details');
    res.redirect('/services');
  }
});
// ================================================================

module.exports = router;
