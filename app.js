require("dotenv").config();
var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	flash = require("connect-flash"),
	passport = require("passport"),
	cookieParser = require("cookie-parser"),
	passportLocal = require("passport-local"),
	expressSession = require("express-session"),
	methodOverride = require("method-override"),
	expressSanitizer = require("express-sanitizer"),
	Blog = require("./models/blogs"),
	Comment = require("./models/comments"),
	User = require("./models/user"),
	seedDB = require("./seeds");

//seedDB();

// Requiring Routes
var commentsRoutes = require("./routes/comments");
var blogsRoutes = require("./routes/blogs");
var indexRoutes = require("./routes/index");

var url = process.env.DATABASEURL || "mongodb://localhost:27017/blog_project";

mongoose
	.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	})
	.then(() => {
		console.log("CONNECTED TO DB");
	})
	.catch((err) => {
		console.log("error : ", err.message);
	});

app.use(
	bodyParser.urlencoded({
		extended: true
	})
);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(cookieParser("secret"));
app.use(flash());

//Passport Configuration
app.use(
	expressSession({
		secret: "Hello World",
		resave: false,
		saveUninitialized: false
	})
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", indexRoutes);
app.use("/blogs", blogsRoutes);
app.use("/blogs/:id/comments", commentsRoutes);

app.listen(process.env.PORT || 3000, () => {
	console.log("BLOG SERVER STARTED");
});