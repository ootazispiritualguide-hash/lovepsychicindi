const express = require('express');
const router = express.Router();
const db = require('../config/db');

// LIST – /services
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services ORDER BY id DESC');
    res.render('website/services', { services: rows });
  } catch (err) {
    console.error(err);
    res.send('Error loading services');
  }
});

// ADD FORM – /services/add
router.get('/add', (req, res) => {
  res.render('website/add_service');
});

// ADD SAVE – POST /services/add
router.post('/add', async (req, res) => {
  const { title, description, price, duration_minutes } = req.body;
  try {
    await db.query(
      'INSERT INTO services (title, description, price, duration_minutes) VALUES (?,?,?,?)',
      [title, description, price, duration_minutes]
    );
    res.redirect('/services');
  } catch (err) {
    console.error(err);
    res.send('Error saving service');
  }
});

// EDIT FORM – /services/edit/:id
router.get('/edit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!rows.length) return res.send('Service not found');
    res.render('website/edit_service', { service: rows[0] });
  } catch (err) {
    console.error(err);
    res.send('Error loading service');
  }
});

// UPDATE SAVE – POST /services/update/:id
router.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, price, duration_minutes } = req.body;
  try {
    await db.query(
      'UPDATE services SET title=?, description=?, price=?, duration_minutes=? WHERE id=?',
      [title, description, price, duration_minutes, id]
    );
    res.redirect('/services');
  } catch (err) {
    console.error(err);
    res.send('Error updating service');
  }
});

// DELETE – /services/delete/:id
router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM services WHERE id=?', [id]);
    res.redirect('/services');
  } catch (err) {
    console.error(err);
    res.send('Error deleting service');
  }
});

module.exports = router;
