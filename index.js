if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');

const cookieParser = require('cookie-parser');

const session = require('express-session');

const flash = require('connect-flash');

const authRoute = require('./routes/auth');

const userRoute = require('./routes/user');

const request = require('request');

const path = require('path');

const app = express();

app.set("view engine", "ejs");

app.set("views", "views");

const baseUrl = "https://bhaveshnetflix.live/web_api/";

let selectFunction = (item) => {
  let options = {
    method: "POST",
    url: baseUrl + "select.php",
    formData: {
      select_query: item,
    },
  };
  return options;
};

app.enable("trust proxy");

app.use(cookieParser());

app.use(session({
  secret: 'Abcd@1234#',
  resave: false,
  proxy: true,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: "none", httpOnly: true },
}));

// Middleware to set the default language to French ('fr')
app.use((req, res, next) => {
  // req.cookies.lang = req.cookies.lang || 'fr';
  req.cookies.email = req.cookies.email || '';
  // req.cookies.isLoggedIn = req.cookies.isLoggedIn || 'false';
  // req.session.lang = req.session.lang || req.cookies.lang || 'fr';
  // req.session.isLoggedIn = req.session.isLoggedIn || req.cookies.isLoggedIn || 'false';
  req.session.user = req.session.user || req.cookies.email || '';
  req.session.lang = req.session.lang || 'fr';
  req.session.isLoggedIn = req.session.isLoggedIn || 'false';
  // req.session.user = req.session.user || '';
  next();
});

// Middleware to load language based on the session
app.use((req, res, next) => {
  const lang = req.session.lang;
  req.lang = require(`./languages/${lang}.json`);
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  else {
    let opt1 = selectFunction(
      "select * from ec_customers where email = '"
      .concat(`${req.session.user}`)
      .concat("' limit 10 offset 0")
    );

    request(opt1, async (error, response) => {
      if (error) throw new Error(error);
      else {
        let x = JSON.parse(response.body);

        if (x.length >= 1) {
          req.user = x[0];
          return next();
        }

        else {
          console.log("error");
        }
      }
    })
  }
})

app.use(flash());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/v1", authRoute);
app.use(userRoute);

app.listen(4000, () => {
  console.log("Listening to localhost PORT 4000......");
})
