const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isCampgroundAuthor, validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campgrounds');
// a tool to upload files
const multer = require('multer');
// specify where to store the uploaded files
const { storage } = require('../cloudinary');
const upload = multer({ storage });


// group similar routes
router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('images'), validateCampground, catchAsync(campgrounds.createCampground));
// it will look for the image field for a/an single/array of file, and store the info in req.file(s)

router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isCampgroundAuthor, upload.array('images'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isCampgroundAuthor, catchAsync(campgrounds.daleteCampground));

router.get('/:id/edit', isLoggedIn, isCampgroundAuthor, catchAsync(campgrounds.renderEditForm));


module.exports = router;