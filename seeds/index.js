if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const HikingTrail = require('../models/hikingTrail');
const cities = require('./cities');
const { places, descriptors, keys } = require('./seedHelpers');

mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/hiking-usa')
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
    await HikingTrail.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const length = Math.floor(Math.random() * 30) + 2;
        const key1 = sample(keys);
        const key2 = sample(keys);
        const key3 = sample(keys);
        const hikingTrail = new HikingTrail({
            // YOUR USER ID
            author: '64ef6d3f8a2643e0289df915',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [
                { filename: `${process.env.S3_BUCKET_NAME}_${key1}`, key: key1 },
                { filename: `${process.env.S3_BUCKET_NAME}_${key2}`, key: key2 },
                { filename: `${process.env.S3_BUCKET_NAME}_${key3}`, key: key3 }
            ],
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi nostrum ex perspiciatis quos aperiam laborum aliquid in optio architecto, maxime obcaecati nisi quis assumenda? Iste vero iusto optio maxime necessitatibus?',
            length: length,
            geometry: {
                type: 'Point',
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            }
        });
        await hikingTrail.save();
    };

};

seedDB().then(() => {
    mongoose.connection.close();
});