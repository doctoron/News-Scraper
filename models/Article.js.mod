const mongoose = require("mongoose");

// Save a reference to the Schema constructor
const Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  savedstatus: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date, 
    default: Date.now
  }
});
const Article = mongoose.model("Article", ArticleSchema);
module.exports = Article;

// `link` is required and of type String
// `title` is required and of type String
// `note` is an object that stores a Note id
// The ref property links the ObjectId to the Note model
// This allows us to populate the Article with an associated Note
// This creates our model from the above schema, using mongoose's model method
// Export the Article model
