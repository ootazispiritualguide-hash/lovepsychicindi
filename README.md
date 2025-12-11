# love_pcsy_complete

Ready-to-run Node.js + Express + MySQL project with:
- Admin panel (login, register, dashboard, profile, change profile with image upload)
- Website (index, about, services, contact with inquiry form)
- Bootstrap 5 UI and small CSS animations
- MySQL integration (mysql2)
- File uploads stored in `public/uploads`

## Setup

1. Extract the ZIP.
2. Create a MySQL database (example name: `love_pcsy`) and run the SQL in `db/schema.sql`.
3. Copy `.env.example` to `.env` and update values.
4. Install dependencies:
   ```
   npm install
   ```
5. Start the app:
   ```
   npm start
   ```
6. Open http://localhost:3000

## Notes
- Uploaded profile images are saved to `public/uploads`.
- Contact inquiries are saved to `inquiries` table in the database.
