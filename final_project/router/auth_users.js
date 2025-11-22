const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { // returns boolean
  // Username is valid if it does NOT already exist in users
  return !users.some((user) => user.username === username);
}

const authenticatedUser = (username, password) => { // returns boolean
  // Check if username and password match any existing user
  return users.some(
    (user) => user.username === username && user.password === password
  );
}

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }

  const accessToken = jwt.sign({ username: username }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "User successfully logged in" });
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;

  if (!isbn) {
    return res.status(400).json({ message: "ISBN is required" });
  }

  if (!review) {
    return res.status(400).json({ message: "Review is required" });
  }

  // username stored in session during login
  const username = req.session && req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Initialize reviews object if needed
  if (!book.reviews) {
    book.reviews = {};
  }

  // Add or update this user's review
  const isUpdate = Boolean(book.reviews[username]);
  book.reviews[username] = review;

  if (isUpdate) {
    return res.status(200).json({ message: "Review modified successfully", reviews: book.reviews });
  }

  return res.status(200).json({ message: "Review added successfully", reviews: book.reviews });
});

// Delete a book review added by the logged-in user
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  if (!isbn) {
    return res.status(400).json({ message: "ISBN is required" });
  }

  const username = req.session && req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!book.reviews || !book.reviews[username]) {
    return res.status(404).json({ message: "No review by this user for the given ISBN" });
  }

  // Delete only this user's review
  delete book.reviews[username];

  return res.status(200).json({ message: "Review deleted successfully", reviews: book.reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
