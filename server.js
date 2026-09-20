const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/account');
const supportRoutes = require('./routes/support');
const contactRoutes = require('./routes/contact');
const blocklistCheck = require('./middleware/blocklistCheck');
const { csrfProtection, generateToken } = require('./middleware/csrf');
const seedAdmin = require('./scripts/seedAdmin');

require('./db/schema')();

// Seed the fixed admin account on boot — safe to run every startup,
// since it's a no-op if the account already exists. This matters on
// hosts (like Render's free tier) that don't provide shell access
// to run a one-off script after deploy.
seedAdmin().catch((err) => console.error('Admin seeding failed:', err.message));

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// The app sits behind a reverse proxy in production (Render, etc.).
// Without this, req.ip would resolve to the proxy's address instead
// of the real client — which would silently break the whole
// per-IP risk-scoring engine, since every visitor would look identical.
app.set('trust proxy', 1);

app.use(session({
  store: new FileStore({ path: config.sessionStorePath, logFn: () => {} }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    maxAge: 1000 * 60 * 60
  }
}));

app.use(blocklistCheck);
app.use(csrfProtection);

// Prevent the browser (and its back/forward cache) from ever serving
// a stale copy of a form page after logout/login — a cached page
// carries a CSRF token tied to a session that may no longer exist,
// which would fail on every retry until a real reload happens.
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});

app.get('/', (req, res) => {
  res.send('TDPS server is running.');
});

app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', accountRoutes);
app.use('/', supportRoutes);
app.use('/', contactRoutes);

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('dashboard', { username: req.session.username, role: req.session.role, fullName: req.session.fullName, csrfToken: generateToken(req) });
});

app.listen(config.port, () => {
  console.log(`🚀 TDPS server listening on http://localhost:${config.port}`);
});
