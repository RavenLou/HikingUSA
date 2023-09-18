const Review = require('../models/review');
const HikingTrail = require('../models/hikingTrail');

module.exports.createReview = async (req, res) => {
    const hikingTrail = await HikingTrail.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    hikingTrail.reviews.push(review);
    await review.save();
    await hikingTrail.save();
    req.flash('success', 'Successfully posted a comment!');
    res.redirect(`/hikingTrails/${hikingTrail._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    // pull will simply remove that one thing
    await HikingTrail.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted a comment!');
    res.redirect(`/hikingTrails/${id}`);
};