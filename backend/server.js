const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;
const app = createApp();

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Kayda Sathi API listening on http://0.0.0.0:${port}`);
    console.log('Legal analysis mode: Gemini classification with curated JSON knowledge.');
  });
}

module.exports = app;
