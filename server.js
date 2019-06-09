const express = require('express');
const exphbs = require('express-handlebars');
const logger = require('morgan');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

// Require all models setting the root at ./models
const db = require('./models/');

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
    toJSON: (object) => {
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
mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/webscraper', { useNewUrlParser: true });

// Routes
// Import routes and give the server access to them.
const routes = require("./controllers/article_controller");

const url1 = 'http://www.echojs.com/'
const url2 = 'https://news.ycombinator.com/';

app.get('/', (req, res) => {
  db.Article.find({})
    .then(articles => {
      res.render("index", {
        articles
      });
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get('/scrape', (req, res) => {
  axios.get(url1).then(response => {
    const $ = cheerio.load(response.data);
    console.log($);
    let data = {};
    
    $("article h2").each((i, element) => {

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
        .catch(error => {
          console.log(error);
        });
    });
    res.redirect('/');
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
      // res.render("saved", hbsObject);
    })
    .catch(error => {
      // If an error occurred, send it to the client
      res.json(error);
    });
});

// Route for getting all Articles from the db
app.get("/articles", (req, res) => {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then((dbArticle) => {
      // If we were able to successfully find Articles, send them back to the client
      res.json.render(dbArticle);
      // res.json(dbArticle);
    })
    .catch(error => {
      // If an error occurred, send it to the client
      res.json(error);
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
    .catch(error => {
      // If an error occurred, send it to the client
      res.json(error);
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
    .catch(error => {
      // If an error occurred, send it to the client
      res.json(error);
    });
});

// Start the server
app.listen(PORT, () => {
  console.log("App running on port " + PORT + "!");
});