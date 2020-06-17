var express = require("express");
var router = express.Router({
    mergeParams: true
});
var Blog = require("../models/blogs");
var Comment = require("../models/comments");
var middleware = require("../middleware/index");

//Comments new
router.get("/new", middleware.isLoggedIn, function (req, res) {
    // Find Blog by Id
    Blog.findById(req.params.id, function (err, blog) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {
                blog: blog
            });
        }
    });
});
//comments post
router.post("/", middleware.isLoggedIn, function (req, res) {
    //Lookup Comment using Id
    Blog.findById(req.params.id, function (err, blog) {
        if (err) {
            console.log(err);
            res.redirect("/blogs");
        } else {
            //create new Comment 
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    req.flash("error", "Something Went Wrong!");
                    console.log(err);
                } else {
                    //add username and id to commnets
                    comment.author.id = req.user.id;
                    comment.author.username = req.user.username;
                    //save the comments
                    comment.save();
                    console.log("THE NEW COMMENT-" + comment.author.created);
                    //connect new comment to the campground
                    blog.comments.push(comment);
                    blog.save();
                    //redirect
                    req.flash("success", "Successfully added comments!!!");
                    res.redirect("/blogs/" + blog._id)
                }
            })
        }
    });
});

// Edit Routes
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    Comment.findById(req.params.comment_id, (err, foundComment) => {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.render("comments/edit", {
                blog_id: req.params.id,
                comment: foundComment
            });
        }
    });
});
// Update Comment
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            req.flash("success", "Comment updated!!!");
            res.redirect("/blogs/" + req.params.id);
        }
    })
});

//Delete Comment Route
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndDelete(req.params.comment_id, (err) => {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted!!!");
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

module.exports = router;