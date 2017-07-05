var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


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

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });



app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
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