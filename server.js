const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");

const PORT = 6020;

// Initialize Express
const app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/webscraper", { useNewUrlParser: true });

// Routes
const url = "https://news.ycombinator.com/";

// A GET route for scraping the url
app.get("/scrape", (req, res) => {
  // First, we grab the body of the html with axios
  axios.get(url).then(response => {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    let $ = cheerio.load(response.data);
    //console.log(`This is what we found: ${response.data}`);

    // Now with cheerio grab every p tag with title class, and do the following:
    $("td.title").each((i, element) => {
      console.log(element);
      // $("table.itemlist tr").each(i, element)=> {
      // $("table.itemlist tr td:nth-child(3) table.itemlist tr td:nth-child(3)").each(function (i, element) {

      const article = {
        title: $(element).text(),
        link: $(element).children().attr("href")
      }

      db.Article.create(article)
        .then(function (dbArticle) {
          console.log('Made it here');
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });

        res.redirect('/');
    });

    res.send("Scrape Complete");


    // Add the text and href of every link, and save them as properties of the result object
    //   result.title = $(this)
    //     .children("a")
    //     .text();
    // result.link = $(this)
    //   .children("a")
    //   .attr("href");

    // Create a new Article using the `result` object built from scraping


    // console.log(response.data);
    // let getData = html => {
    //   data = [];
    //   let $ = cheerio.load(html);
    //   $('table.itemlist tr td:nth-child(3)').each((i, elem) => {
    //     data.push({
    //       title: $(elem).text(),
    //       link: $(elem).find('a.storylink').attr('href')
    //     });
    //   });
    //   console.log(data);
    // }
    //   getData(response.data);

    // Send a message to the client;
  }).catch(err => res.send(err))

});
// Route for getting all Articles from the db
app.get("/articles", (req, res) => {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then((dbArticle) => {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch( (err) => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", (req, res) => {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(dbArticle => {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch( (err) => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then( (dbArticle) => {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
// Start the server
app.listen(PORT, () => {
  console.log("App running on port " + PORT + "!");
});