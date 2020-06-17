var express = require("express");
var router = express.Router();
var expressSanitizer = require("express-sanitizer");
var Blog = require("../models/blogs");
var User = require("../models/user");
var middleware = require("../middleware/index");
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({
    storage: storage,
    fileFilter: imageFilter
})

var cloudinary = require('cloudinary');
const blogs = require("../models/blogs");
cloudinary.config({
    cloud_name: 'anishaan',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//Home Page

router.get("/", function (req, res) {
    var noMatch = null;
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all blogs from DB
        Blog.find({
            title: regex
        }, function (err, allBlogs) {
            if (err) {
                console.log(err);
            } else {
                if (allBlogs.length < 1) {
                    noMatch = "No blogs match that search, please try again.";
                }
                res.render("blogs/home", {
                    blogs: allBlogs,
                    noMatch: noMatch
                });
            }
        });
    } else {
        // Get all blogss from DB
        Blog.find({}, function (err, allBlogs) {
            if (err) {
                console.log(err);
            } else {
                res.render("blogs/home", {
                    blogs: allBlogs,
                    noMatch: noMatch
                });
            }
        });
    }
});

// Creaate a new Blog
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("blogs/new");
});

//Create Blog Post request
router.post("/", middleware.isLoggedIn, upload.single('image'), (req, res) => {
    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            req.flash('error', err.message);
            console.log(err);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the blog object under image property
        req.body.blog.image = result.secure_url;
        // add image's public_id to blog object
        req.body.blog.imageId = result.public_id;
        // add author to blog
        req.body.blog.author = {
            id: req.user._id,
            username: req.user.username
        }
        req.body.blog.body = req.sanitize(req.body.blog.body);
        Blog.create(req.body.blog, function (err, newblog) {
            if (err) {
                req.flash('error', err.message);
                console.log(err);
                return res.redirect('back');
            }
            req.flash("success", "Successfully created");
            res.redirect("/blogs/" + newblog.id);
        });
    });
});

// Show Routes
router.get("/:id", function (req, res) {
    //find the blogs with provided ID
    Blog.findById(req.params.id).populate("comments").exec((err, foundBlog) => {
        if (err) {
            console.log(err);
        } else {
            //render show template with that Blog
            res.render("blogs/show", {
                blog: foundBlog
            });
        }
    });
});

// Edit Route
router.get("/:id/edit", middleware.checkBlogOwnership, function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            console.log("Something went wrong");
            console.log(err);
            res.redirect("/blogs");
        } else {
            res.render("blogs/edit", {
                blog: foundBlog
            });
        }
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkBlogOwnership, upload.single('image'), function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            console.log(err);
        }
        cloudinary.v2.uploader.destroy(foundBlog.imageId);
    });
    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            req.flash("error", err.message);
            console.log(err);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.blog.image = result.secure_url;
        // add image's public_id to campground object
        req.body.blog.imageId = result.public_id;
        req.body.blog.body = req.sanitize(req.body.blog.body);
        // find and update the correct blog
        Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (err, updatedBlog) {
            if (err) {
                console.log(err);
                req.flash("error", err.message);
                res.redirect("/blogs");
            } else {
                //redirect somewhere(show page)
                req.flash("success", "Successfully updated")
                res.redirect("/blogs/" + req.params.id);
            }
        });
    });
});
//Delete Route
router.delete("/:id", middleware.checkBlogOwnership, function (req, res) {
    //delete blog
    Blog.findByIdAndDelete(req.params.id, function (err) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/blogs");
        } else {
            req.flash("success", "Successfully deleted")
            res.redirect("/blogs");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;