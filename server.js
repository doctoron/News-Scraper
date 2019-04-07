const express = require('express');
const exphbs = require('express-handlebars');
const logger = require('morgan');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

// Require all models setting the root at ./models
const db = require('./models');

// Port configuration for local || Heroku
const PORT = process.env.PORT || process.argv[2] || 6020;

// Initialize Express
const app = express();

// Configure middleware and display home page
// app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
// app.set('view engine', 'handlebars');
app.set('view engine', 'handlebars');

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: {
    toJSON: function (object) {
      return JSON.stringify(object);
    }
  }
}));



// Use morgan logger for logging requests
app.use(logger('dev'));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make /public a static folder
app.use(express.static(__dirname + '/public'));
// app.use(express.static('/public'));

// Connect to the Mongo DB
mongoose.connect('mongodb://localhost/webscraper', { useNewUrlParser: true });
// mongodb://heroku_thqttplq:doegubk1n9vo97fob2nobsj6q5@ds111771.mlab.com:11771/heroku_thqttplq
// Routes
// Import routes and give the server access to them.
// const routes = require("./controllers/article_controller");

const url1 = 'http://www.echojs.com/'
const url2 = 'https://news.ycombinator.com/';

app.get('/', (req, res) => {
  res.render('index');
});

// A get route for scraping the url
app.get('/scrape', (req, res) => {
  // First, we grab the body of the html with axios
  axios.get(url1).then(response => {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    const $ = cheerio.load(response.data);
    // console.log(`This is what we found: ${response.data}`);

    // Now with cheerio grab every td tag with title class, and do the following:
    // $('td.title').each((i, element) => {
    $("article h2").each(function (i, element) {
      // console.log(`This is our result: ${element}`);
      const result = {};

      result.title = $(this)
        .children('a')
        .text();
      result.link = $(this)
        .children('a')
        .attr('href');

      // Create a new Article using the result object scraped
      db.Article.create(result)
        .then((dbArticle) => {
          console.log(result);
        })
        .catch((err) => {
          console.log(err);
        });
    });
    // res.render "index", retrievedArticles
    res.send('Scrape Complete');
    // res.redirect('/');
  });
});

app.get("/", (req, res) => {
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      const retrievedArticles = dbArticle;
      let hbsObject;
      hbsObject = {
        articles: dbArticle
      };
      res.render("index", hbsObject);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/saved", (req, res) => {
  db.Article.find({ isSaved: true })
    .then(function (retrievedArticles) {
      // If we were able to successfully find Articles, send them back to the client
      let hbsObject;
      hbsObject = {
        articles: retrievedArticles
      };
      res.render("saved", hbsObject);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



// Route for getting all Articles from the db
app.get("/articles", (req, res) => {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then((dbArticle) => {
      // If we were able to successfully find Articles, send them back to the client
      // res.json.render(dbArticle);
      res.json(dbArticle);
    })
    .catch((err) => {
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
    .catch((err) => {
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
    .then((dbArticle) => {
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