//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const upload = require("express-fileupload");
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque";
/*const bcrypt = require("bcrypt");*/

const app = express();

app.use(upload());

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

var posts = [];

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  type: {
    type: String,
    required: true,
    enum: ['teacher', 'student'],
  }

});
/*
const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res){

  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});

*/


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  res.render("home");
});


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
  res.render("login");
});
app.get("/teacherpage", function (req,res ) {
  res.render("teacherpage");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/question", function(req,res){

  res.render("question");
});

app.get("/secrets", function(req, res){
        res.render("secrets");
});

app.get("/compose", function(req,res){
  res.render("compose");
});

app.get("/viewmyprofile", function(req, res){
  res.render("viewmyprofile");
});

app.get("/computernetworks", function(req, res ){
  res.render("computernetworks");
});

app.get("/teacherfirstcourse", function(req,res) {
  res.render("teacherfirstcourse");
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});



app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;


//Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});
app.post("/secrets", function(req, res){
  if(req.files) {
    var file = req.files.file;
    var fileName = file.name;
    console.log(fileName);

    file.mv("./uploads/" +fileName,function(err){
      if(err) {
        console.log(err)
      } else {

        res.redirect("secrets");
      }
    });
  }
});
app.post("/register", function(req, res){

  User.register({username: req.body.username, type:req.body.type}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/question");
      });
    }
  });
 type= req.body.type;
 email= req.body.email;
});


app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password,
    type: req.body.type
  });


  req.login(user, function(err){

    if(type === "student") {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      })
    } else {
      res.redirect("/teacherpage");
    }

  });
    /*if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/teacherpage");
      });
    }
  });
*/
});

app.post("/question", function(req, res){

  firstName = req.body.firstname;
  lastName = req.body.lastname;
  city = req.body.city;
  username=req.body.username;


  res.redirect("/secrets");
});

app.post("/viewmyprofile", function(req,res){
  old_password = req.body.oldpassword;
  new_password= req.body.newpassword;
  confirm_password= req.body.confirmpassword;
  console.log(old_password);


  app.post("/compose", function(req,res){
    const post = {
      title:req.body.postTitle,
      content: req.body.postBody
    };

    posts.push(post);

    res.redirect("/");
  });

  app.get("/posts/:postName", function(req,res){
    const requestedTitle = _.lowerCase(req.params.postName);

    posts.forEach(function(post){
      const storedTitle = _.lowerCase(post.title);

      if ( storedTitle === requestedTitle){
        res.render("post",{
          title: post.title,
          content: post.content
        });
      }
    });
  });

  
   /* post.save(function(err){
      if (!err){
          res.redirect("/teacherpage");
      }
    });
  });
  
  app.get("/posts/:postId", function(req, res){
  
  const requestedPostId = req.params.postId;
  
    Post.findOne({_id: requestedPostId}, function(err, post){
      res.render("post", {
        title: post.title,
        content: post.content
      });
    });
  
  });

 /* User.findOne({"email": req.body.email},(err,user) => {

    var hash = user.password;
    bcrypt.compare(old_password, hash , function (err, res){
      if (res) {
        if(new_password === confirm_password) {
          bcrypt.hash(new_password, 3, function(err,hash) {
            user.password=hash;
            user.save(function(err,user){
              if (err) return console.log(err);
              res1.render("ChangePassword");
              console.log(user.firstName + "Your password has been changed");
            });
          });
        }
      }
    });
*/

  });









app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
