const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isHikingTrailAuthor, validateHikingTrail } = require('../middleware');
const hikingTrails = require('../controllers/hikingTrails');
// a tool to upload files
const multer = require('multer');
// specify where to store the uploaded files
const upload = multer({ dest: '../uploads'})


// group similar routes
router.route('/')
    .get(catchAsync(hikingTrails.index))
    .post(isLoggedIn, upload.array('images'), validateHikingTrail, catchAsync(hikingTrails.createHikingTrail));
// it will look for the image field for a/an single/array of file, and store the info in req.file(s)

router.get('/new', isLoggedIn, hikingTrails.renderNewForm);

router.route('/:id')
    .get(catchAsync(hikingTrails.showHikingTrail))
    .put(isLoggedIn, isHikingTrailAuthor, upload.array('images'), validateHikingTrail, catchAsync(hikingTrails.updateHikingTrail))
    .delete(isLoggedIn, isHikingTrailAuthor, catchAsync(hikingTrails.daleteHikingTrail));

router.get('/:id/edit', isLoggedIn, isHikingTrailAuthor, catchAsync(hikingTrails.renderEditForm));


module.exports = router;