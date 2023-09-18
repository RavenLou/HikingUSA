if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');

const s3 = new S3({
    region: process.env.S3_BUCKET_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});

module.exports.uploadImg = function uploadImg(file) {
    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Body: fileStream,
        Key: file.filename
    };
    return s3.upload(uploadParams).promise();
}

module.exports.downloadImg = function downloadImg(key) {
    const downloadParams = {
        Key: key,
        Bucket: process.env.S3_BUCKET_NAME
    };
    return s3.getObject(downloadParams).createReadStream();
};

module.exports.deleteImg = function deleteImg(key) {
    console.log('key: ', key)
    const deleteParams = {
        Key: key,
        Bucket: process.env.S3_BUCKET_NAME
    };
    return s3.deleteObject(deleteParams, function(err, data) {
        if (err) console.log(err, err.stack); 
        else     console.log('Delete Success', data);           
    }).promise();
}