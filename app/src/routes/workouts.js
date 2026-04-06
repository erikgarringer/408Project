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

// POST /workouts — save a new workout and its exercise sets
router.post('/', (req, res) => {
  const db = req.db;
  const { workout_date, name, notes, exercise_name, sets, reps, weight_lbs } = req.body;

  // Basic validation
  if (!workout_date || !name) {
    return res.status(400).render('log', {
      title: 'Log a Workout',
      error: 'Workout date and name are required.'
    });
  }

  // Create the workout row
  const workoutId = db.createWorkout(workout_date, name, notes || null);

  // exercise_name etc. come in as arrays when there are multiple rows
  const names = Array.isArray(exercise_name) ? exercise_name : [exercise_name];
  const setsArr = Array.isArray(sets) ? sets : [sets];
  const repsArr = Array.isArray(reps) ? reps : [reps];
  const weightsArr = Array.isArray(weight_lbs) ? weight_lbs : [weight_lbs];

  // Insert each exercise set
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

// GET /workouts/:id — workout detail page
router.get('/:id', (req, res) => {
  res.render('detail', { title: 'Workout Detail', id: req.params.id });
});

// DELETE /workouts/:id — delete a workout (wired in CP4)
router.delete('/:id', (req, res) => {
  res.redirect('/workouts');
});

module.exports = router;
