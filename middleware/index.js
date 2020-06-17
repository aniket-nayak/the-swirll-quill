var Blog = require("../models/blogs");
var Comment = require("../models/comments");
var middlewareObj = {};

middlewareObj.checkBlogOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Blog.findById(req.params.id, function (err, foundBlog) {
            if (err) {
                console.log(err);
                req.flash("error", "Blog not found!!!");
                res.redirect("back");
            } else {
                //if the user is loged in then, he own the page?
                if (foundBlog.author.id.equals(req.user.id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that!!!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You must be logged in to do that!")
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                console.log(err);

                res.redirect("back");
            } else {
                //if the user is loged in then, he own the page?
                if (foundComment.author.id.equals(req.user.id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that!!!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You must be logged in to do that!")
        res.redirect("back");
    }
}


middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You must be login");
    res.redirect("/login");
}

module.exports = middlewareObj;