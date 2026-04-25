const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.db;

  const totalWorkouts = db.getTotalWorkouts();
  const lastWorkoutDate = db.getLastWorkoutDate();
  const prCountThisMonth = db.getPrCountThisMonth();

  res.render('index', {
    title: 'Home',
    totalWorkouts,
    lastWorkoutDate,
    prCountThisMonth
  });
});

module.exports = router;
