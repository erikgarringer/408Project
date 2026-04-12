const express = require('express');
const router = express.Router();

// GET /workouts — history page with pagination
router.get('/', (req, res) => {
  const db = req.db;
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 10;

  const workouts = db.getAllWorkouts({ page, perPage });
  const totalCount = db.getWorkoutCount();
  const totalPages = Math.ceil(totalCount / perPage);

  res.render('history', {
    title: 'Workout History',
    workouts,
    page,
    totalPages,
    totalCount
  });
});

// GET /workouts/log — log a workout form
router.get('/log', (req, res) => {
  res.render('log', { title: 'Log a Workout' });
});

// GET /workouts/progress — exercise progress page
router.get('/progress', (req, res) => {
  res.render('progress', { title: 'Exercise Progress' });
});

// POST /workouts — save a new workout and its exercise sets
router.post('/', (req, res) => {
  const db = req.db;
  const { workout_date, name, notes, exercise_name, sets, reps, weight_lbs } = req.body;

  if (!workout_date || !name) {
    return res.status(400).render('log', {
      title: 'Log a Workout',
      error: 'Workout date and name are required.'
    });
  }

  const workoutId = db.createWorkout(workout_date, name, notes || null);

  const names = Array.isArray(exercise_name) ? exercise_name : [exercise_name];
  const setsArr = Array.isArray(sets) ? sets : [sets];
  const repsArr = Array.isArray(reps) ? reps : [reps];
  const weightsArr = Array.isArray(weight_lbs) ? weight_lbs : [weight_lbs];

  names.forEach((exName, idx) => {
    if (!exName || !setsArr[idx] || !repsArr[idx] || !weightsArr[idx]) return;
    db.createExerciseSet(
      workoutId,
      exName.trim(),
      parseInt(setsArr[idx], 10),
      parseInt(repsArr[idx], 10),
      parseFloat(weightsArr[idx]),
      idx
    );
  });

  res.redirect('/workouts');
});

// GET /workouts/:id — workout detail page (CP5)
router.get('/:id', (req, res) => {
  res.render('detail', { title: 'Workout Detail', id: req.params.id });
});

// DELETE /workouts/:id — delete workout, cascade handled by FK
router.delete('/:id', (req, res) => {
  const db = req.db;
  db.deleteWorkout(req.params.id);
  res.redirect('/workouts');
});

module.exports = router;
