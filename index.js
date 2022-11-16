const cookieSession = require("cookie-session");
require("dotenv").config();
const express = require("express");
const app = express();
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var cors = require("cors");
const sharetribeSdk = require("sharetribe-flex-sdk");
const passport = require("passport");
const passportSetup = require("./passport");
const authRoute = require("./routes/auth");
const signInGoogle = require("./routes/signin/signin-google-passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const { application, response } = require("express");
const bodyParser = require("body-parser");
const showCurrentUser = require("./routes/currentuser/ShowCurrentUser");
const {
  authenticateLinkedin,
  authenticateLinkedinCallback,
} = require('./routes/linkedin/linkedin');
//taken from env
const port = parseInt(process.env.PORT);
const localHostURL = process.env.LOCAL_HOST_URL;
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const localHostBackendURL = process.env.LOCAL_HOST_BACKEND_URL;
const clientId = process.env.SHARETRIBE_CLIENT_ID;
const linkedInNew = require("./routes/linkedin/linkedInNew")
const config  = require("./routes/linkedin/config")
process.on("unhandledRejection", (error, promise) => {
  console.log(
    " Error Handled ",

    promise
  );

  console.log(" The error was: ", error);
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(
  cookieSession({ name: "session", keys: ["lama"], maxAge: 24 * 60 * 60 * 100 })
);

app.use(passport.initialize()); // init passport on every route call

app.use(passport.session());

app.use(
  cors({
    origin: localHostURL,
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
  })
);


passport.use(new LinkedInStrategy({
  clientID: config.linkedinAuth.clientID,
  clientSecret: config.linkedinAuth.clientSecret,
  callbackURL: config.linkedinAuth.callbackURL,
  scope: ['r_emailaddress', 'r_liteprofile'],
}, function (token, tokenSecret, profile, done) {
  return done(null, profile);
}
));


const signInRoute = require("./routes/signin/Signin");
app.use("/api", signInRoute);

const signUpRoute = require("./routes/signup/Signup");
app.use("/api", signUpRoute);

app.use("/auth/", authRoute);

app.use("/social", linkedInNew)
app.use("/currentuser", showCurrentUser);

// This endpoint is called when the user wants to initiate authentication with Linkedin
app.use('/api/linkedin', authenticateLinkedin);

// This is the route for callback URL the user is redirected after authenticating
// with Linkedin. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Flex API to authenticate user to Flex
app.use('/api/linkedin/callback', authenticateLinkedinCallback);
// app.use("/google",signInGoogle);

// const flexIntegrationSdk = require("sharetribe-flex-integration-sdk");

app.post("/login/google", (req, res) => {
  const authUser = (request, accessToken, refreshToken, profile, done) => {
    console.log("inside auth");
    console.log(profile);
    return done(null, profile);
  };

  // passport.use(
  //   new GoogleStrategy(
  //     {
  //       clientID:
  //         "381986969505-9pv9f2j17kii7spheulmhnll36mhsh00.apps.googleusercontent.com",
  //       clientSecret: "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",
  //       callbackURL: "http://localhost:3500/api/auth/google/callback",
  //       passReqToCallback: true,
  //     },
  //     authUser
  //   )
  // );

  res.send("hi");
});
app.post("/verify", (req, res) => {
  const token = req.body.token;
  // let token = "5337708699036610";
  console.log(token);
  let result = {};
  const sdk = sharetribeSdk.createInstance({
    clientId: clientId,
  });

  sdk
    .login({ username: req.body.username, password: req.body.password })
    .then((loginRes) => {
      console.log("Login successful.", loginRes);

      sdk.currentUser
        .verifyEmail(
          {
            verificationToken: token,
          },
          {
            expand: true,
          }
        )
        .then((res) => {
          console.log("res", res.data);
          res.status(200).json({ data: res });
        })
        .catch((error) => res.status(402).send("error"));
    })
    .catch((error) => {
      // response.status(error.status).json({ error: error });
    });
});

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.listen(port, () => {
  console.log(`Your port is ${port}`);
});
