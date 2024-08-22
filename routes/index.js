var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/register', function(req, res, next) {
  res.render('register');
});


router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({ username: req.session.passport.user })
  .populate("posts");
  console.log("User profile:", user); // Log the user document
  res.render('profile', { user });
});

router.get('/show/posts', isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({ username: req.session.passport.user })
  .populate("posts");
  res.render('showposts', { user });
});

router.get('/feed', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find()
  .populate("user");
  res.render('feed', { user , posts});
});


router.get('/logout', function(req, res, next) {
  res.render('index');
});

router.get('/add', function(req, res, next) {
  res.render('add');
});

router.post('/register',function(req,res){
  const {username,fullname,email} = req.body;

  const userdata = new userModel({
    username,email,fullname
  })

  userModel.register(userdata,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect('/profile');
    })
  }
  )
})
router.post('/login',
  passport.authenticate("local",{
    successRedirect: '/profile',
    failureRedirect : '/'
  })
  ,function(req,res){

})

router.post('/logout',function(req,res,next){
  req.logOut(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/');
  })
})

router.post('/uploadImage',isLoggedIn,upload.single("image"),async function(req,res){
  const user = await userModel.findOne({username : req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
})

router.post('/createpost',isLoggedIn, upload.single("postimage"),async function(req,res){
  const user = await userModel.findOne({username : req.session.passport.user});
  const post = await postModel.create({
    user : user._id,
    title : req.body.title,
    description : req.body.description,
    image : req.file.filename
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
})


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');

}


module.exports = router;
