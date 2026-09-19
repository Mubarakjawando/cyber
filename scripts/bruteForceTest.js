const BASE_URL = process.env.TDPS_BASE_URL || 'http://localhost:3000';
const TEST_USERNAME = process.env.TDPS_TEST_USER || 'bruteforcetest';
const WRONG_PASSWORD_PREFIX = 'WrongAttempt';
const TOTAL_ATTEMPTS = 8;

const results = [];
let sessionCookie = null;

function extractCsrfToken(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  return match ? match[1] : null;
}

function extractSetCookie(response) {
  const raw = response.headers.get('set-cookie');
  if (!raw) return null;
  return raw.split(';')[0];
}

function classifyResponse(text) {
  if (text.includes('Too many failed attempts') || text.includes('Access denied')) return 'PREVENTED (blocked)';
  if (text.includes('CAPTCHA challenge')) return 'DETAINED (captcha)';
  if (text.includes('Invalid or missing CSRF token')) return 'ERROR (csrf rejected)';
  if (text.includes('Invalid username or password')) return 'ALLOWED (rejected credentials)';
  if (text.includes('Welcome') || text.includes('dashboard')) return 'ALLOWED (authenticated)';
  return 'UNKNOWN';
}

async function getLoginPageAndToken() {
  const headers = {};
  if (sessionCookie) headers['Cookie'] = sessionCookie;

  const response = await fetch(`${BASE_URL}/login`, { headers });
  const newCookie = extractSetCookie(response);
  if (newCookie) sessionCookie = newCookie;

  const html = await response.text();
  return extractCsrfToken(html);
}

async function attemptLogin(password, attemptNumber) {
  const csrfToken = await getLoginPageAndToken();

  const start = process.hrtime.bigint();

  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookie || ''
    },
    body: new URLSearchParams({
      username: TEST_USERNAME,
      password,
      _csrf: csrfToken || ''
    }),
    redirect: 'manual'
  });

  const end = process.hrtime.bigint();
  const latencyMs = Number(end - start) / 1_000_000;

  const newCookie = extractSetCookie(response);
  if (newCookie) sessionCookie = newCookie;

  const text = await response.text();
  const classification = classifyResponse(text);
  if (classification === 'UNKNOWN') console.log('--- RAW RESPONSE (attempt ' + attemptNumber + ') ---\n' + text.slice(0, 500) + '\n--- END ---');

  results.push({
    attempt: attemptNumber,
    httpStatus: response.status,
    classification,
    latencyMs: latencyMs.toFixed(2)
  });

  return classification;
}

async function runSimulation() {
  console.log('='.repeat(70));
  console.log('TDPS BRUTE-FORCE SIMULATION TEST');
  console.log('='.repeat(70));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Test account: ${TEST_USERNAME}`);
  console.log(`Total attempts: ${TOTAL_ATTEMPTS}\n`);

  for (let i = 1; i <= TOTAL_ATTEMPTS; i++) {
    const wrongPassword = `${WRONG_PASSWORD_PREFIX}${i}`;
    const classification = await attemptLogin(wrongPassword, i);
    console.log(`Attempt ${i}: ${classification}`);
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(70));

  const allowedCount = results.filter(r => r.classification.startsWith('ALLOWED')).length;
  const detainedCount = results.filter(r => r.classification.startsWith('DETAINED')).length;
  const preventedCount = results.filter(r => r.classification.startsWith('PREVENTED')).length;
  const errorCount = results.filter(r => r.classification.startsWith('ERROR')).length;
  const avgLatency = (results.reduce((sum, r) => sum + parseFloat(r.latencyMs), 0) / results.length).toFixed(2);

  console.table(results);
  console.log(`\nAllowed responses:   ${allowedCount}`);
  console.log(`Detained (CAPTCHA):  ${detainedCount}`);
  console.log(`Prevented (blocked): ${preventedCount}`);
  console.log(`Errors (CSRF etc.):  ${errorCount}`);
  console.log(`Average latency:     ${avgLatency} ms`);

  const firstDetain = results.find(r => r.classification.startsWith('DETAINED'));
  const firstPrevent = results.find(r => r.classification.startsWith('PREVENTED'));

  console.log(`\nDetention first triggered at attempt:  ${firstDetain ? firstDetain.attempt : 'N/A'}`);
  console.log(`Prevention first triggered at attempt:  ${firstPrevent ? firstPrevent.attempt : 'N/A'}`);

  console.log('\n' + '='.repeat(70));
  if (firstDetain && firstPrevent && firstDetain.attempt < firstPrevent.attempt) {
    console.log('RESULT: PASS');
  } else {
    console.log('RESULT: FAIL');
  }
  console.log('='.repeat(70));
}

runSimulation().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
