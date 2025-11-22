const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Validate presence
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Check if user already exists
  if (!isValid(username)) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Add new user
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  // Return the full list of books as pretty JSON
  return res.status(200).send(JSON.stringify(books, null, 2));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    return res.status(200).json(book);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
});
  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;

  // books is an object keyed by ISBN; we want all books whose author matches
  const matchingBooks = Object.keys(books)
    .filter(isbn => books[isbn].author === author)
    .map(isbn => ({ isbn, ...books[isbn] }));

  if (matchingBooks.length > 0) {
    return res.status(200).json(matchingBooks);
  } else {
    return res.status(404).json({ message: `No books found for author ${author}` });
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;

  // books is an object keyed by ISBN; we want all books whose title matches
  const matchingBooks = Object.keys(books)
    .filter(isbn => books[isbn].title === title)
    .map(isbn => ({ isbn, ...books[isbn] }));

  if (matchingBooks.length > 0) {
    return res.status(200).json(matchingBooks);
  } else {
    return res.status(404).json({ message: `No books found with title ${title}` });
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  // reviews is an object on the book
  return res.status(200).json(book.reviews);
});

// ------------ Tasks 10-13: Async/Await or Promises with Axios ------------

// Task 10: Get the list of books using async/await with Axios
public_users.get('/async/books', async (req, res) => {
  try {
    // Simulate an HTTP call that returns the books object
    const response = await axios.get('http://localhost:5000/');
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching books asynchronously', error: error.message });
  }
});

// Task 11: Get book details based on ISBN using Promises with Axios
public_users.get('/async/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  axios
    .get(`http://localhost:5000/isbn/${isbn}`)
    .then(response => {
      return res.status(200).json(response.data);
    })
    .catch(error => {
      // If the underlying call returned 404, bubble up a friendly message
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
      }
      return res.status(500).json({ message: 'Error fetching book by ISBN asynchronously', error: error.message });
    });
});

// Task 12: Get book details based on author using async/await with Axios
public_users.get('/async/author/:author', async (req, res) => {
  const author = req.params.author;

  try {
    const response = await axios.get(`http://localhost:5000/author/${author}`);
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: `No books found for author ${author}` });
    }
    return res.status(500).json({ message: 'Error fetching books by author asynchronously', error: error.message });
  }
});

// Task 13: Get book details based on title using Promises with Axios
public_users.get('/async/title/:title', (req, res) => {
  const title = req.params.title;

  axios
    .get(`http://localhost:5000/title/${title}`)
    .then(response => {
      return res.status(200).json(response.data);
    })
    .catch(error => {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ message: `No books found with title ${title}` });
      }
      return res.status(500).json({ message: 'Error fetching books by title asynchronously', error: error.message });
    });
});

module.exports.general = public_users;
