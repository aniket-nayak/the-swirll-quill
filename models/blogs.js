var mongoose = require("mongoose");

//Schema Setup
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    imageId: String,
    body: String,
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],

});

module.exports = mongoose.model("Blog", blogSchema);