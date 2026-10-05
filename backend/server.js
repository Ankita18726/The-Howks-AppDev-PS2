const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;
const app = createApp();

if (require.main === module) {
  app.get("/test", (req, res) => {
    console.log("TEST REQUEST RECEIVED");

    res.json({
      success: true,
      message: "Backend reachable"
    });
  });

  const PORT = process.env.PORT || 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(`Kayda Sathi API listening on http://0.0.0.0:${port}`);
    const mode = process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'Gemini';
    console.log(`Legal analysis mode: ${mode} classification with curated JSON knowledge.`);
  });
}

module.exports = app;
