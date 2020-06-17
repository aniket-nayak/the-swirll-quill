var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Blog = require("../models/blogs");
var middleware = require("../middleware/index");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageF = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({
    storage: storage,
    fileF: imageF
})

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'anishaan',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



//Index Page
router.get("/", (req, res) => {
    res.render("index");
});

//=====================
//Auth Routes
//=====================

//Show Register Routes
router.get("/register", function (req, res) {
    res.render("register");
});

router.post("/register", upload.single('avatar'), function (req, res) {
    cloudinary.uploader.upload(req.file.path, function (result) {
        // add cloudinary url for the image to the campground object under image property
        req.body.user.avatar = result.secure_url;
        // add author to campground
        User.register(req.body.user, req.body.password, function (err, user) {
            if (err) {
                req.flash("error", err.message);
                console.log(err);
                return res.redirect("/register");
            } else {
                req.flash("success", "You are successfully registered ,now login as " + user.username);
                res.redirect("/login");

                /*passport.authenticate("local")(req, res, function () {
                    req.flash("success", "Welcome to Yelpcamp " + user.username);
                    res.redirect("/campgrounds");
                });*/
            }
        });
    });
});

//Login Form
router.get("/login", function (req, res) {
    res.render("login");
});

//Login Logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/blogs",
    failureRedirect: "/login"
}), function (req, res) {});

//Logout 
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Successfully logged you out!!")
    res.redirect("/");
});

// forgot password
router.get("/forgot", function (req, res) {
    res.render("forgot");
});

router.post("/forgot", function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({
                email: req.body.email
            }, function (err, user) {
                if (!user) {
                    req.flash("error", "No account with that email address has been registered.");
                    return res.redirect("/forgot");
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "aniketproject99@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: "aniketproject99@gmail.com",
                subject: "The Swirl Quill Password Reset",
                text: "You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n" +
                    "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                    "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                    "If you did not request this, please ignore this email and your password will remain unchanged.\n"
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log("mail sent");
                req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
                done(err, "done");
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect("/forgot");
    });
});

router.get("/reset/:token", function (req, res) {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function (err, user) {
        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired");
            return res.redirect("/forgot");
        }
        res.render("reset", {
            token: req.params.token
        });
    });
});

router.post("/reset/:token", function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function (err, user) {
                if (!user) {
                    req.flash("error", "Password reset token is invalid or has expired");
                    return res.redirect("back");
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match");
                    return res.redirect("back");
                }
            });
        },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "aniketproject99@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: "aniketproject99@gmail.com",
                subject: "Your password has been changed",
                text: "Hello,\n\n" +
                    "This is a confirmation that the password for your account " + user.email + "has just been changed.\n"
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash("success", "Success! Your password has been changed.");
                done(err);
            });
        }
    ], function (err) {
        res.redirect("/blogs");
    });
});

router.get("/about", (req, res) => {
    res.render("about");
})



//==============================================
//User Routes
//==============================================
router.get("/users/:id", function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else {
            Blog.find().where("author.id").equals(foundUser._id).exec(function (err, blogs) {
                if (err) {
                    req.flash("error", "Something went wrong!");
                    res.redirect("back");
                } else {
                    res.render("users/show", {
                        user: foundUser,
                        blogs: blogs
                    });
                }
            })

        }
    })
})


module.exports = router;