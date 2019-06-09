// Import the model (article.js) to use its database functions.
const express = require("express");
const router = express.Router();

// Pull in all required dependencies
const db = require("../models/");

// Create all our routes and set up logic within those routes where required.
router.get("/", (req, res) => {
  articles.all((data) => {
    let hbsObject = {
      articles: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

router.post("/articles", (req, res) => {
  articles.insertOne([
    "title",
    "link"
  ], [
      req.body.title,
      req.body.link
    ], (data) => res.redirect("/"));
});

router.put("/articles/:id", (req, res) => {
  let condition = "id =" + req.params.id;
  articles.updateOne({
    saved: true
  }, condition, (data) => res.redirect('/'));
});


// Export routes for server.js
module.exports = db;