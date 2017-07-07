const express = require("express");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080; // default port 8080

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

const hashed_purple = bcrypt.hashSync("purple", 10);
const hashed_blue = bcrypt.hashSync("blue", 10);


// Function used for generating: (i) user IDs, and (ii) unique IDs to track unique link clicks
function generateRandomString() {
  var myArray = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "G", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  var myString = "";
  for (var i = 0; i < 6; i++) {
    myString += myArray[Math.floor(Math.random() * myArray.length)];
  }
  console.log(myString);
  return myString;
}


const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca",
              userID: "abc123",
              visits: [ {unique_id: "U-aaa111",
                        timestamp: "sample-datetime"},
                        {unique_id: "U-aaa222",
                        timestamp: "sample-datetime2"}],
              uniques: 2},
  "Zq4Rt1": {longURL: "http://www.wired.com",
              userID: "abc123",
              visits: [ {unique_id: "U-bbb111",
                        timestamp: "sample-datetime3"}],
              uniques: 1},
  "9sm5xK": {longURL: "http://www.google.com",
              userID: "def456",
              visits: [ {unique_id: "U-ccc111",
                        timestamp: "sample-datetime4"},
                        {unique_id: "U-ddd222",
                        timestamp: "sample-datetime5"}],
              uniques: 2}
};


const users = {
  "abc123": {
    id: "abc123",
    email: "vlad@abc.com",
    password: hashed_purple,
    unique_id: "U-testID1"
  },
  "def456": {
    id: "def456",
    email: "mike@abc.com",
    password: hashed_blue,
    unique_id: "U-testID2"
  }
};


app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  let templateVars = {
   user: users[req.session["user_id"]]
  };
  res.render('register', templateVars);
});


app.post("/register", (req, res) => {
  // Checks if email entered is already in the user database
  duplicateEmail = false;
  for (key in users) {
    if (users[key].email == req.body.email) {
      duplicateEmail = true;
    }
  }
  if (duplicateEmail == true) {
    res.status(400).send("The email you entered already exists in our user database. Please refresh the page to try again.");
  }

  // Checks if a blank password was entered
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("The email or password you entered was blank.  Please refresh the page to try again.");
  }

  // Generates a user ID
  var randomID = generateRandomString();
  req.session.user_id = randomID;

  // Generates a unique ID (to keep track of unique link clicks)
  var uniqueID = "U-" + generateRandomString();
  req.session["unique_id"] = uniqueID;

  // Generates a new user object in the user database
  users[randomID] = {id: randomID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10), unique_id: uniqueID};

  res.redirect("/urls");
});


app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  let templateVars = {
   user: users[req.session.user_id]
  };
  res.render("login", templateVars);
});


app.post("/login", (req, res) => {
  // Checks if email entered is in user database
  var userID = "";
  var emailInUsers = false;
  for (var key in users) {
    if (users[key].email === req.body.email) {
      userID = key;
      emailInUsers = true;
    }
  }
  if (!emailInUsers) {
    res.status(403).send("Your email address does not match our records.");
  } else {
    // Checks if password entered matches hashed password in user database
    if (bcrypt.compareSync(req.body.password, users[userID].password)) {
      req.session["unique_id"] = users[userID]["unique_id"];
      req.session.user_id = users[userID].id;
      res.redirect("/urls");
    } else {
      res.status(403).send("Your password does not match your email address.");
    }
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


// Function to return URLs filtered by user in order to render the /urls page with only the short links created by the user viewing it.
function urlsForUser(id) {
  var filteredURLs = {};
  for (var key in urlDatabase) {
    if (urlDatabase[key].userID == id) {
      filteredURLs[key] = urlDatabase[key];
    }
  }
  return filteredURLs;
};


app.get("/urls", (req, res) => {
  let templateVars = {
      urls: urlsForUser(req.session.user_id),
      user: users[req.session.user_id]
    };
  res.render('urls_index', templateVars);
});


app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  let templateVars = {
   user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});


app.delete("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


app.put("/urls/:id", (req, res) => {
  urlDatabase[req.params.id]["longURL"] = req.body.newLongURL;
  urlDatabase[req.params.id]["userID"] = req.session.user_id;
  res.redirect("/urls/" + req.params.id);
});


app.get("/urls/:id", (req, res) => {
  // Checks to see if short code entered matches a record in user database
  if (!urlDatabase[req.params.id]) {
    res.status(404).send(`The short URL code you entered (${req.params.id}) does not exist.  Please try again.`);
  }
  let templateVars = { shortURL: req.params.id, urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  // Generates a short code for the URL entered
  var randomString = generateRandomString();
  urlDatabase[randomString] = { "longURL": req.body.longURL,
                                "userID": req.session.user_id,
                                "visits": [],
                                "uniques": 0}
  res.redirect("http://localhost:8080/urls/" + randomString)
});


app.get("/u/:shortURL", (req, res) => {
  // Checks to see if short code entered matches a record in the database
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send(`The short URL code you entered (${req.params.shortURL}) does not exist.  Please try again.`);
  }

  // Checks to see if user already has a unique_id.  If not, one is created.
  if (!req.session["unique_id"]) {
    var uniqueID = "U-" + generateRandomString();
    req.session["unique_id"] = uniqueID;
  }

  // Increases the unique hit counter for the short URL if the user who clicked the short link has a unique_id that does not match any other unique_id in the "visits" log
  var newHit = true;
  var visitLogs = urlDatabase[req.params.shortURL]["visits"];
  visitLogs.forEach(function(item, index) {
    if(item.unique_id === req.session["unique_id"]) {
      newHit = false;
    }
  })
  if (newHit === true) {
    urlDatabase[req.params.shortURL]["uniques"] += 1;
  }

  // Creates a timestamp for each click of the short URL
  var ts = new Date();
  ts.setHours(ts.getHours() - 4);
  var timestamp = new Date(ts);
  timestamp = timestamp.toString().replace("GMT+0000 (UTC)", "EST");

  // Creates a log in the "visits" array when a user clicks a short link
  urlDatabase[req.params.shortURL]["visits"].push({unique_id: req.session["unique_id"], timestamp: timestamp});

  // Redirects to the full URL that corresponds to the short link
  var finalURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(302, finalURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});