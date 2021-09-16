const express = require("express");
const https = require("https");

const config = require("./config.json");

const PORT = process.env.PORT || 3001;

const app = express();

const getIngredientData = (foodId, cb) => {
  https.get(`${config.fdcConfig.url}/${foodId}?limit=1&api_key=${config.fdcConfig.apiKey}`, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    })
    resp.on('end', () => {
      return cb(JSON.parse(data));
    });
  }).on('error', (e) => {
    return { name: null, cal: null };
  });
};

app.get("/api", (req, res) => {
  res.json({ message: "Food server is up and running!" });
});

app.get("/ingredient", (req, res) => {
  foodId = req.query.fdcID;
  console.log(`Fetching ingredient ${foodId}`);
  if (!foodId) {
    res.status(400).json({ name: null, cal: null });
    return;
  }
  getIngredientData(foodId, (ingredientData) => {
    ingName = ingredientData.description;
    calories = ingredientData.labelNutrients ? ingredientData.labelNutrients.calories.value : null;
    if (ingName) {
      res.json({name: ingName, cal: calories});
    } else res.status(400).json({ name: null, cal: null });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
