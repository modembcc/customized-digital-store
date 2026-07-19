// Placeholder gate for signup captcha verification. No captcha provider is
// wired up yet, so this always allows the request through; swap in a real
// verification call (e.g. hCaptcha/reCAPTCHA/Turnstile) later.
function verifyCaptcha(req, res, next) {
  next();
}

module.exports = verifyCaptcha;
