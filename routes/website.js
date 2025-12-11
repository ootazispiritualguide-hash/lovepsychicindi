const express = require("express");
const router = express.Router();
const db = require("../config/db").promise();

/* =======================
   HOME PAGE
======================== */
router.get("/", async (req, res) => {
  try {
    // ACTIVE BANNER (latest active)
    const [[banner]] = await db.query(
      "SELECT * FROM banners WHERE is_active = 1 ORDER BY id DESC LIMIT 1"
    );

    // LATEST SECTION BLOCK (image + title + content)
    const [secRows] = await db.query(
      "SELECT * FROM section_blocks ORDER BY created_at DESC LIMIT 1"
    );
    const section = secRows[0] || null;

    res.render("website/index", {
      banner,
      section,
    });
  } catch (err) {
    console.error(err);
    res.render("website/index", {
      banner: null,
      section: null,
    });
  }
});

/* =======================
   CONTACT PAGE
======================== */

// CONTACT PAGE - GET
router.get("/contact", (req, res) => {
  res.render("website/contact", { success: null, error: null });
});

// CONTACT PAGE - POST (form submit)
router.post("/contact", async (req, res) => {
  try {
    const { full_name, mobile_no, email, message } = req.body;

    // basic validation
    if (!full_name || !mobile_no || !email || !message) {
      return res.render("website/contact", {
        success: null,
        error: "Please fill all fields.",
      });
    }

    // MySQL insert - table name: query_data
    await db.query(
      "INSERT INTO query_data (full_name, mobile_no, email, message) VALUES (?, ?, ?, ?)",
      [full_name, mobile_no, email, message]
    );

    res.render("website/contact", {
      success: "Your query has been submitted successfully!",
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.render("website/contact", {
      success: null,
      error: "Something went wrong. Please try again later.",
    });
  }
});

/* =======================
   ABOUT PAGE
======================== */
router.get("/about", (req, res) => {
  // future me agar DB se dynamic about content chahiye ho to yaha query likh sakte ho
  res.render("website/about");
});

/* =======================
   SERVICES PAGE (Optional)
   Navbar me /services link ke liye
======================== */
router.get("/services", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, description, price, duration_minutes FROM services ORDER BY id DESC"
    );
    res.render("website/services", {
      services: rows,
    });
  } catch (err) {
    console.error(err);
    res.render("website/services", {
      services: [],
    });
  }
});

/* =======================
   POSTS PAGE (Optional)
   Navbar me /posts link ke liye
======================== */
router.get("/posts", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, slug, category, image, content, created_at FROM posts ORDER BY created_at DESC"
    );
    res.render("website/posts", {
      posts: rows,
    });
  } catch (err) {
    console.error(err);
    res.render("website/posts", {
      posts: [],
    });
  }
});

// (Optional) single post by slug
// router.get("/posts/:slug", async (req, res) => {
//   try {
//     const slug = req.params.slug;
//     const [rows] = await db.query(
//       "SELECT * FROM posts WHERE slug = ? LIMIT 1",
//       [slug]
//     );
//     if (!rows.length) {
//       return res.status(404).render("website/post-single", { post: null });
//     }
//     res.render("website/post-single", { post: rows[0] });
//   } catch (err) {
//     console.error(err);
//     res.status(500).render("website/post-single", { post: null });
//   }
// });

module.exports = router;
