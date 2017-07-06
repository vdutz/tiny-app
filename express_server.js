var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser())

app.set("view engine", "ejs");

function generateRandomString() {
  var myArray = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "G", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
  var myString = ""
  for (i = 0; i < 6; i++) {
    myString += myArray[Math.floor(Math.random() * myArray.length)];
  }
  console.log(myString)
  return myString
}

// generateRandomString()

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "abc123": {
    id: "abc123",
    email: "vlad@abc.com",
    password: "purple"
  },
  "def456": {
    id: "def456",
    email: "mike@abc.com",
    password: "blue"
  }
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/register", (req, res) => {
  let templateVars = {
   user: users[req.cookies["user_id"]]
  };
  res.render('register', templateVars)
})

app.post("/register", (req, res) => {
  console.log("POST SUCCESFUL")

  duplicateEmail = false
  for (key in users) {
    if (users[key].email == req.body.email) {
      duplicateEmail = true
    }
  }
  if (duplicateEmail == true) {
    res.status(400).send("The email you entered already exists in our user database. Please refresh the page to try again.")
  }
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("The email or password you entered was blank.  Please refresh the page to try again.")
  }

  randomID = generateRandomString()
  res.cookie('user_id', randomID)
  users[randomID] = {id: randomID, email: req.body.email, password: req.body.password}
  console.log(users)
  // console.log(res.cookie[user_id])
  res.redirect("/urls");


})

app.get("/login", (req, res) => {
  let templateVars = {
   user: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars)
})

app.post("/login", (req, res) => {
  userID = ""
  emailInUsers = false
  for (key in users) {
    if (users[key].email === req.body.email) {
      userID = key
      emailInUsers = true
    }
  }
  if (!emailInUsers) {
    res.status(403).send("Your email address does not match our records.")
  } else {
    if (users[userID].password === req.body.password) {
      res.cookie('user_id', users[userID].id)
      res.redirect("/")
    } else {
      res.status(403).send("Your password does not match your email address.")
    }
  }
})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/urls");
})

app.get("/urls", (req, res) => {
  templateVars = {
      urls: urlDatabase,
      user: users[req.cookies["user_id"]]
    };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
   user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls")
})

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL
  res.redirect("/urls/" + req.params.id)
})

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send(`The short URL code you entered (${req.params.id}) does not exist.  Please try again.`)
  }
  let templateVars = { shortURL: req.params.id, urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  randomString = generateRandomString()
  urlDatabase[randomString] = req.body.longURL
  console.log(urlDatabase)
  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
  res.redirect("http://localhost:8080/u/" + randomString)
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send(`The short URL code you entered (${req.params.shortURL}) does not exist.  Please try again.`)
  }
  let longURL = urlDatabase[req.params.shortURL]
  console.log(longURL)
  // res.render("u_new")
  res.redirect(302, longURL)
})



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});