const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const { campgroundSchema } = require('../schemas');

const ImageSchema = new Schema({
    url: String,
    filename: String
})

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_150');
});

// if not set, will not stringify virtual properties in html
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    price: Number,
    description: String,
    location: String,
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

CampgroundSchema.virtual('properties.popupMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
    <p>${this.description.substr(0, 50)}...</p>
    `;
});

CampgroundSchema.post('findOneAndDelete', async function (data) {
    if (data.reviews.length) {
        await Review.deleteMany({ _id: { $in: data.reviews } });
    };
});

module.exports = mongoose.model('Campground', CampgroundSchema);