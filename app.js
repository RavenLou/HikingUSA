// if not in production mode
// to run in production mode in command line: NODE_ENV=production node app.js
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash')
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const campgroundsRouter = require('./routes/campgrounds');
const reviewsRouter = require('./routes/reviews');
const userRouter = require('./routes/users');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const MongoDBStore = require('connect-mongo')(session);
// this will help filter query strings with security issues
// to avoid mongo injection
const mongoSanitize = require('express-mongo-sanitize');
// for security purpose
const helmet = require('helmet');

// connecting to mongo db
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp'
mongoose.connect(dbUrl)
    .then(() => {
        console.log('Mongo Connection Open');
    })
    .catch(err => {
        console.log('Mongo Error');
        console.log(err);
    });
mongoose.set('strictQuery', true);

const app = express();

// app config
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
// the file in the public folder will be served
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisshouldbeabettersecret';

const store = new MongoDBStore({
    url: dbUrl,
    secret: secret,
    // lazy update after 1 day of no change
    touchAfter: 24 * 60 * 60
});

store.on('error', function(e) {
    console.log('SESSION STORE ERROR', e);
});

// session cookie is stored in memory if not specified (for dev purposes)
const sessionConfig = {
    // set a name so that no one knows this is the session id
    name: 'session',
    secret: secret,
    // for session store
    store: store,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // cookie will expire in a week
        // data.now shows time in miliseconds
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        // this is the same thing
        maxAge: 1000 * 60 * 60 * 24 * 7,
        // this is for security purpose. Only http requests can access the cookies
        httpOnly: true  

        // use this line when deploying (when testing, comment it out   )
        // secure: true
    }
};
app.use(session(sessionConfig));
app.use(flash());
// auto enable 11 middleware from helmet
app.use(helmet());

// just copy and paste
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dircon6p3/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls]
        }
    })
);

// make sure session is used before passport.session
app.use(passport.initialize());
app.use(passport.session());
// authenticate is a method automatically added to User by passport
passport.use(new LocalStrategy(User.authenticate()));
// tell passport how to store/unstore user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    // these can be accessed in ejs templates
    // this user information is from passport
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/', userRouter);
app.use('/campgrounds', campgroundsRouter);
app.use('/campgrounds/:id/reviews', reviewsRouter);

app.get('/', (req, res) => {
    res.render('home');
});

// for every request, for every path
// this will catch errors that are not caught in previous routes
// and will be passed to the generic error handler
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh no, something went wrong!';
    res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 3000;
app.listen([port], () => {
    console.log(`SERVING ON PORT ${port}`);
});