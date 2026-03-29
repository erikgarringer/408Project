const Database = require('better-sqlite3');

const createSchemaSQL = `
  CREATE TABLE IF NOT EXISTS workouts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_date TEXT    NOT NULL,
    name         TEXT    NOT NULL,
    notes        TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercise_sets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id    INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_name TEXT    NOT NULL,
    sets          INTEGER NOT NULL,
    reps          INTEGER NOT NULL,
    weight_lbs    REAL    NOT NULL,
    estimated_1rm REAL    NOT NULL,
    is_pr         INTEGER NOT NULL DEFAULT 0,
    sort_order    INTEGER NOT NULL DEFAULT 0
  );
`;

// Epley formula: weight * (1 + reps / 30)
function epley(weight, reps) {
  return parseFloat((weight * (1 + reps / 30)).toFixed(1));
}

function createDatabaseManager(dbPath) {
  const database = new Database(dbPath);
  console.log('Database manager created for:', dbPath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.exec(createSchemaSQL);

  function ensureConnected() {
    if (!database.open) {
      throw new Error('Database connection is not open');
    }
  }

  return {
    dbHelpers: {

      // ── Dev/test utilities ───────────────────────────────────────────────

      clearDatabase: () => {
        if (process.env.NODE_ENV === 'test') {
          ensureConnected();
          database.prepare('DELETE FROM exercise_sets').run();
          database.prepare('DELETE FROM workouts').run();
        } else {
          console.warn('clearDatabase called outside of test environment. FIXME!');
        }
      },

      seedTestData: () => {
        if (process.env.NODE_ENV === 'test') {
          ensureConnected();
          // minimal seed for Playwright tests
          const insertWorkout = database.prepare(
            'INSERT INTO workouts (workout_date, name, notes) VALUES (?, ?, ?)'
          );
          const insertSet = database.prepare(`
            INSERT INTO exercise_sets
              (workout_id, exercise_name, sets, reps, weight_lbs, estimated_1rm, is_pr, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          database.transaction(() => {
            const w = insertWorkout.run('2026-03-01', 'Test Push Day', null);
            insertSet.run(w.lastInsertRowid, 'Bench Press', 3, 5, 185, epley(185, 5), 1, 0);
            insertSet.run(w.lastInsertRowid, 'Overhead Press', 3, 8, 105, epley(105, 8), 1, 1);
          })();
          console.log('Seeding test data into database');
        } else {
          console.warn('seedTestData called outside of test environment. FIXME!');
        }
      },

      seedSampleData: () => {
        ensureConnected();
        const existing = database.prepare('SELECT COUNT(*) AS c FROM workouts').get().c;
        if (existing > 0) {
          console.log('Database already has data — skipping seed.');
          return;
        }

        const insertWorkout = database.prepare(
          'INSERT INTO workouts (workout_date, name, notes) VALUES (?, ?, ?)'
        );
        const insertSet = database.prepare(`
          INSERT INTO exercise_sets
            (workout_id, exercise_name, sets, reps, weight_lbs, estimated_1rm, is_pr, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const workouts = [
          {
            workout_date: '2026-03-01', name: 'Push Day A', notes: 'Felt strong, bench PR',
            sets: [
              { exercise_name: 'Bench Press',      sets: 3, reps: 5,  weight_lbs: 185 },
              { exercise_name: 'Overhead Press',   sets: 3, reps: 8,  weight_lbs: 105 },
              { exercise_name: 'Incline Dumbbell', sets: 3, reps: 10, weight_lbs: 65  },
              { exercise_name: 'Tricep Pushdown',  sets: 3, reps: 12, weight_lbs: 50  },
            ],
          },
          {
            workout_date: '2026-03-03', name: 'Pull Day A', notes: null,
            sets: [
              { exercise_name: 'Deadlift',       sets: 3, reps: 5,  weight_lbs: 275 },
              { exercise_name: 'Barbell Row',    sets: 3, reps: 8,  weight_lbs: 155 },
              { exercise_name: 'Lat Pulldown',   sets: 3, reps: 10, weight_lbs: 130 },
              { exercise_name: 'Hammer Curl',    sets: 3, reps: 12, weight_lbs: 35  },
            ],
          },
          {
            workout_date: '2026-03-05', name: 'Leg Day A', notes: 'Quads were smoked',
            sets: [
              { exercise_name: 'Squat',             sets: 3, reps: 5,  weight_lbs: 225 },
              { exercise_name: 'Romanian Deadlift', sets: 3, reps: 8,  weight_lbs: 185 },
              { exercise_name: 'Leg Press',         sets: 3, reps: 12, weight_lbs: 360 },
              { exercise_name: 'Calf Raise',        sets: 4, reps: 15, weight_lbs: 135 },
            ],
          },
          {
            workout_date: '2026-03-08', name: 'Push Day B', notes: null,
            sets: [
              { exercise_name: 'Bench Press',      sets: 3, reps: 5,  weight_lbs: 190 },
              { exercise_name: 'Overhead Press',   sets: 3, reps: 8,  weight_lbs: 110 },
              { exercise_name: 'Cable Fly',        sets: 3, reps: 12, weight_lbs: 40  },
              { exercise_name: 'Tricep Pushdown',  sets: 3, reps: 12, weight_lbs: 55  },
            ],
          },
          {
            workout_date: '2026-03-10', name: 'Pull Day B', notes: 'Grip gave out',
            sets: [
              { exercise_name: 'Deadlift',     sets: 3, reps: 5,  weight_lbs: 280   },
              { exercise_name: 'Barbell Row',  sets: 3, reps: 8,  weight_lbs: 160   },
              { exercise_name: 'Face Pull',    sets: 3, reps: 15, weight_lbs: 40    },
              { exercise_name: 'Hammer Curl', sets: 3, reps: 12, weight_lbs: 37.5  },
            ],
          },
        ];

        const bests = {};
        database.transaction(() => {
          for (const workout of workouts) {
            const w = insertWorkout.run(workout.workout_date, workout.name, workout.notes);
            workout.sets.forEach((s, idx) => {
              const e1rm = epley(s.weight_lbs, s.reps);
              const prev = bests[s.exercise_name] ?? 0;
              const isPr = s.weight_lbs > prev ? 1 : 0;
              if (isPr) bests[s.exercise_name] = s.weight_lbs;
              insertSet.run(w.lastInsertRowid, s.exercise_name, s.sets, s.reps, s.weight_lbs, e1rm, isPr, idx);
            });
          }
        })();
        console.log(`Seeded ${workouts.length} sample workouts.`);
      },

      // ── Workouts ─────────────────────────────────────────────────────────

      getAllWorkouts: ({ page = 1, perPage = 10 } = {}) => {
        ensureConnected();
        const offset = (page - 1) * perPage;
        return database.prepare(`
          SELECT * FROM workouts
          ORDER BY workout_date DESC, created_at DESC
          LIMIT ? OFFSET ?
        `).all(perPage, offset);
      },

      getWorkoutCount: () => {
        ensureConnected();
        return database.prepare('SELECT COUNT(*) AS c FROM workouts').get().c;
      },

      getWorkoutById: (id) => {
        ensureConnected();
        return database.prepare('SELECT * FROM workouts WHERE id = ?').get(id);
      },

      createWorkout: (workout_date, name, notes) => {
        ensureConnected();
        const info = database.prepare(
          'INSERT INTO workouts (workout_date, name, notes) VALUES (?, ?, ?)'
        ).run(workout_date, name, notes);
        return info.lastInsertRowid;
      },

      deleteWorkout: (id) => {
        ensureConnected();
        // exercise_sets cascade-deleted automatically via FK
        const info = database.prepare('DELETE FROM workouts WHERE id = ?').run(id);
        return info.changes;
      },

      // ── Exercise sets ─────────────────────────────────────────────────────

      getSetsForWorkout: (workoutId) => {
        ensureConnected();
        return database.prepare(`
          SELECT * FROM exercise_sets
          WHERE workout_id = ?
          ORDER BY sort_order ASC
        `).all(workoutId);
      },

      createExerciseSet: (workoutId, exercise_name, sets, reps, weight_lbs, sortOrder) => {
        ensureConnected();
        const e1rm = epley(weight_lbs, reps);

        // PR detection: is this weight a new best for this exercise?
        const best = database.prepare(`
          SELECT MAX(weight_lbs) AS best FROM exercise_sets WHERE exercise_name = ?
        `).get(exercise_name);
        const isPr = (!best.best || weight_lbs > best.best) ? 1 : 0;

        const info = database.prepare(`
          INSERT INTO exercise_sets
            (workout_id, exercise_name, sets, reps, weight_lbs, estimated_1rm, is_pr, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(workoutId, exercise_name, sets, reps, weight_lbs, e1rm, isPr, sortOrder);
        return info.lastInsertRowid;
      },

      // ── Progress page ─────────────────────────────────────────────────────

      getExerciseNames: () => {
        ensureConnected();
        return database.prepare(`
          SELECT DISTINCT exercise_name FROM exercise_sets ORDER BY exercise_name ASC
        `).all().map(r => r.exercise_name);
      },

      getSetsForExercise: (exercise_name) => {
        ensureConnected();
        return database.prepare(`
          SELECT es.*, w.workout_date, w.name AS workout_name
          FROM exercise_sets es
          JOIN workouts w ON w.id = es.workout_id
          WHERE es.exercise_name = ?
          ORDER BY w.workout_date ASC
        `).all(exercise_name);
      },

      getPrForExercise: (exercise_name) => {
        ensureConnected();
        return database.prepare(`
          SELECT es.*, w.workout_date
          FROM exercise_sets es
          JOIN workouts w ON w.id = es.workout_id
          WHERE es.exercise_name = ? AND es.is_pr = 1
          ORDER BY es.weight_lbs DESC
          LIMIT 1
        `).get(exercise_name);
      },

      // ── Dashboard stats (CP6) ─────────────────────────────────────────────

      getTotalWorkouts: () => {
        ensureConnected();
        return database.prepare('SELECT COUNT(*) AS c FROM workouts').get().c;
      },

      getLastWorkoutDate: () => {
        ensureConnected();
        const row = database.prepare(
          'SELECT workout_date FROM workouts ORDER BY workout_date DESC LIMIT 1'
        ).get();
        return row ? row.workout_date : null;
      },

      getPrCountThisMonth: () => {
        ensureConnected();
        const row = database.prepare(`
          SELECT COUNT(*) AS c FROM exercise_sets es
          JOIN workouts w ON w.id = es.workout_id
          WHERE es.is_pr = 1
            AND strftime('%Y-%m', w.workout_date) = strftime('%Y-%m', 'now')
        `).get();
        return row.c;
      },
    }
  };
}

module.exports = { createDatabaseManager };