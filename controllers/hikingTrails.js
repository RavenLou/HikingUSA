const HikingTrail = require('../models/hikingTrail');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });
const { uploadImg, deleteImg } = require('../s3/index');

module.exports.index = async (req, res, next) => {
    const hikingTrails = await HikingTrail.find({});
    res.render('hikingTrails/index', { hikingTrails });
};

module.exports.renderNewForm = (req, res) => {
    res.render('hikingTrails/new');
};

module.exports.createHikingTrail = async (req, res, next) => {
    // send a location query to mapbox
    const geoData = await geocoder.forwardGeocode({
        query: req.body.hikingTrail.location,
        limit: 1
    }).send()
    // if (!req.body.hikingTrail) throw new ExpressError('Invalid Hiking Trail Data', 400);
    const hikingTrail = new HikingTrail(req.body.hikingTrail);
    // it stores a geo JSON object: {'type': 'Point', 'coordinates': [xxx, xxx]}
    hikingTrail.geometry = geoData.body.features[0].geometry;
    // upload img to s3 and update info in mongodb
    for(let f of req.files) {
        const result = await uploadImg(f);
        hikingTrail.images.push({ filename: `${result.Bucket}_${result.key}`, key: result.key });
    };
    hikingTrail.author = req.user._id;
    await hikingTrail.save();
    req.flash('success', 'Successfully added a new hiking trail!')
    res.redirect(`/hikingTrails/${hikingTrail._id}`);
};

module.exports.showHikingTrail = async (req, res, next) => {
    const { id } = req.params;
    // nested populate
    // here we populate the reviews in hikingTrails, and then populate the author in reviews
    const hikingTrail = await HikingTrail.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!hikingTrail) {
        req.flash('error', 'Cannot find that hiking trail!');
        return res.redirect('/hikingTrails');
    };
    res.render('hikingTrails/show', { hikingTrail });
};

module.exports.renderEditForm = async (req, res, next) => {
    const { id } = req.params;
    const hikingTrail = await HikingTrail.findById(id);
    if (!hikingTrail) {
        req.flash('error', 'Cannot find that hiking trail!');
        return res.redirect('/hikingTrails');
    };
    res.render('hikingTrails/edit', { hikingTrail });
};

module.exports.updateHikingTrail = async (req, res, next) => {
    const newData = req.body.hikingTrail;
    const { id } = req.params;
    const hikingTrail = await HikingTrail.findByIdAndUpdate(id, { ...newData });
    for(let f of req.files) {
        const result = await uploadImg(f);
        hikingTrail.images.push({ filename: `${result.Bucket}_${result.key}`, key: result.key })
    };
    await hikingTrail.save();
    if (req.body.deleteImages) {
        // if there are images to delete, pull from the images array
        // where the filename is in deleteImages array
        for (let key of req.body.deleteImages) {
            if (key) {
                await deleteImg(key);
            }
        }
        await hikingTrail.updateOne({ $pull: { images: { key: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Successfully updated the hiking trail!');
    res.redirect(`/hikingTrails/${id}`);
};

module.exports.daleteHikingTrail = async (req, res, next) => {
    const { id } = req.params;
    await HikingTrail.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted the hiking trail!');
    res.redirect(`/hikingTrails`);
};