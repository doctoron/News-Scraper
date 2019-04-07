// Import the model (article.js) to use its database functions.
const express = require("express");
const router = express.Router();

// Pull in all required dependencies
const db = require("../models/");

// Create all our routes and set up logic within those routes where required.
router.get("/", (req, res) => {
  db.article.selectAll((data) => {
    let hbsObject = {
      dbarticle: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

router.post("/article", (req, res) => {
  db.article.insertOne([
    "title"
  ], [
      req.body.title
    ], (data) => res.redirect("/"));
});

router.put("/article/:id", (req, res) => {
  let condition = "id =" + req.params.id;
  db.article.updateOne({
    saved: true
  }, condition, (data) => res.redirect('/'));
});


// Export routes for server.js
module.exports = db;