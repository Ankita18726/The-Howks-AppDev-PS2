const express = require('express');

const { getFirebaseClientConfig } = require('../services/firebaseConfigService');

function createConfigRouter() {
  const router = express.Router();
  router.get('/firebase', (request, response, next) => {
    try {
      response.json(getFirebaseClientConfig());
    } catch (error) {
      next(error);
    }
  });
  return router;
}

module.exports = { createConfigRouter };
