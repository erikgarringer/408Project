const express = require('express');
const router = express.Router();

// GET /workouts — history page
router.get('/', (req, res) => {
  res.render('history', { title: 'Workout History' });
});

// GET /workouts/log — log a workout form
router.get('/log', (req, res) => {
  res.render('log', { title: 'Log a Workout' });
});

// GET /workouts/progress — exercise progress page
router.get('/progress', (req, res) => {
  res.render('progress', { title: 'Exercise Progress' });
});

// POST /workouts — form submission (stubbed, wired in CP3)
router.post('/', (req, res) => {
  res.redirect('/workouts');
});

// GET /workouts/:id — workout detail page
router.get('/:id', (req, res) => {
  res.render('detail', { title: 'Workout Detail', id: req.params.id });
});

// DELETE /workouts/:id — delete a workout (wired in CP4)
router.delete('/:id', (req, res) => {
  res.redirect('/workouts');
});

module.exports = router;
