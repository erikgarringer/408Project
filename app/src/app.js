const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const methodOverride = require('method-override');
const path = require('path');
const db = require('./bin/db');
const fs = require('fs');

const index = require('./routes/index');
const workouts = require('./routes/workouts');

const app = express();

// Ensure the data directory exists
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dbFileName = process.env.DB_NAME || 'database.sqlite';
const dbPath = path.join(dataDir, dbFileName);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const databaseManager = db.createDatabaseManager(dbPath);
databaseManager.dbHelpers.seedSampleData(); 

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('ejs').__express);
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'static')));

// Attach database to every request
app.use((request, response, next) => {
  request.db = databaseManager.dbHelpers;
  next();
});

// Routes
app.use('/', index);
app.use('/workouts', workouts);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Server Error', message: err.message });
});

module.exports = app;