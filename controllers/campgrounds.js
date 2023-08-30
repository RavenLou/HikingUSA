const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary/index');
// use mapbox for geocoding: npm i @mapbox/mapbox-sdk
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

module.exports.index = async (req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
    // send a location query to mapbox
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        // 1 result
        limit: 1
    }).send()
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const campground = new Campground(req.body.campground);
    // it stores a geo JSON object: {'type': 'Point', 'coordinates': [xxx, xxx]}
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    console.log(campground);
    await campground.save();
    req.flash('success', 'Successfully made a new campground!')
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res, next) => {
    const { id } = req.params;
    // nested populate
    // here we populate the reviews in campgrounds, and then populate the author in reviews
    const campground = await Campground.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    };
    res.render('campgrounds/show', { campground });
};

module.exports.renderEditForm = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    };
    res.render('campgrounds/edit', { campground });
};

module.exports.updateCampground = async (req, res, next) => {
    const newData = req.body.campground;
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...newData });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        // if there are images to delete, pull from the images array
        // where the filename is in deleteImages array
        for (let filename of req.body.deleteImages) {
            cloudinary.uploader.destroy(filename)
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Successfully updated the campground!');
    res.redirect(`/campgrounds/${id}`);
};

module.exports.daleteCampground = async (req, res, next) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted the campground!');
    res.redirect(`/campgrounds`);
};