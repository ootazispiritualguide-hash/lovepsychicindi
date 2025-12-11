// app.js me (require ke niche, routes ke section me)

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

    await pool.query(query, [
      service_id || null,
      service_title || null,
      full_name,
      mobile,
      email,
      message
    ]);

    // Yaha tum redirect ya success page dikha sakte ho
    // Example: same page pr success message ke saath redirect:
    res.redirect('/services?appointment=success');

  } catch (err) {
    console.error('Error saving appointment:', err);
    // error ke case me bhi kuch dikhao
    res.redirect('/services?appointment=error');
  }
});
