const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')
    .then(() => {
        console.log('Mongo Connection Open');
    })
    .catch(err => {
        console.log('Mongo Error');
        console.log(err);
    });
mongoose.set('strictQuery', true);

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            // YOUR USER ID
            author: '64ea41781bab9ed55617bc50',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [
                { url: 'https://res.cloudinary.com/dircon6p3/image/upload/v1693191943/YelpCamp/IMG_6604_ljuvfq.jpg', filename: 'IMG_6604_ljuvfq' },
                { url: 'https://res.cloudinary.com/dircon6p3/image/upload/v1693191942/YelpCamp/Fxcd7ONaUAU1o-j_ixxktk.jpg', filename: 'Fxcd7ONaUAU1o-j_ixxktk' },
                { url: 'https://res.cloudinary.com/dircon6p3/image/upload/v1693191941/YelpCamp/Fwep6TRacAEEiWs_mbxpmp.jpg', filename: 'Fwep6TRacAEEiWs_mbxpmp' }
            ],
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi nostrum ex perspiciatis quos aperiam laborum aliquid in optio architecto, maxime obcaecati nisi quis assumenda? Iste vero iusto optio maxime necessitatibus?',
            price: price,
            geometry: {
                type: 'Point',
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            }
        });
        await camp.save();
    };

};

seedDB().then(() => {
    mongoose.connection.close();
});