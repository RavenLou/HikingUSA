const HikingTrail = require('./models/hikingTrail');
const Review = require('./models/review');
const { hikingTrailSchema, reviewSchema } = require('./schemas');
const ExpressError = require('./utils/ExpressError');

module.exports.isLoggedIn = (req, res, next) => {
    // passport provides you with the middleware to check if you are signed in in req
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in to add a new trail!');
        return res.redirect('/login');
    };
    next();
};

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

module.exports.isHikingTrailAuthor = async (req, res, next) => {
    const { id } = req.params;
    const hikingTrail = await HikingTrail.findById(id);
    if (!hikingTrail.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/hikingTrail/${id}`)
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/hikingTrail/${id}`)
    }
    next();
};

module.exports.validateHikingTrail = (req, res, next) => {
    // pass in the body to validate it
    console.log(req.body)
    const { error } = hikingTrailSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(ele => ele.message).join(',');
        throw new ExpressError(msg, 400);
    }
    else {
        next();
    };
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(ele => ele.message).join(',');
        throw new ExpressError(msg, 400);
    }
    else {
        next();
    };
};