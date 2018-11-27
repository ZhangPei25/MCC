'use strict';

const functions = require('firebase-functions');
const path = require('path');
const sharp = require('sharp');
const admin = require('firebase-admin')
const os = require('os');
const fs = require('fs');
admin.initializeApp()
const gcs = admin.storage()

const LOW_WIDTH = 480;
const LOW_HEIGHT = 640;

const HIGH_WIDTH = 1280;
const HIGH_HEIGHT = 960;

exports.resizeImages = functions.storage.bucket().object().onFinalize( (object) =>{
    const imageBucket = object.bucket;
    const imagePath = object.name;
    const imageType = object.contentType;

    if(!imageType.startsWith('image/')) {
        console.log("Not a image!!")
        return null;
    }
    const imageName = path.basename(imagePath);

    if(imageName.startsWith('low_')) {
        console.log("Already a low image!!")
        return null;
    }
    if(imageName.startsWith('high_')) {
        console.log("Already a high image!!")
        return null;
    }

    const imgBucket = gcs.bucket(imageBucket);
    const imgMetadata = {
        contentType: imageType,
    };
    const tempPath = path.join(os.tmpdir(), imageName);
    var tempLowPath = null;
    var tempHighPath = null;

    const imgFile = imgBucket.file(imagePath);

    return imgFile.download({destination: tempPath,})
    .then(() => {
        return sharp(tempPath).metadata();
    })
    .then( metadata => {
        var p1 = null;
        var p2 = null;

        if(metadata.width > 640 && metadata.height > 480) {
            tempLowPath = path.join(os.tmpdir(),`low_${imageName}`);
            
            p1 = sharp(tempPath).resize(LOW_WIDTH, LOW_HEIGHT).toFile(tempLowPath);
        } 

       if (metadata.width > 1280 && metadata.height > 960 ) {
            tempHighPath = path.join(os.tmpdir(),`high_${imageName}`);
            p2 = sharp(tempPath).resize(HIGH_WIDTH, HIGH_HEIGHT).toFile(tempHighPath);
        }

        return Promise.all([p1, p2]);
    })
    .then((values) => {
        var p1 = null;
        var p2 = null;
        if(tempLowPath){
            const lowFilePath = path.join(path.dirname(imagePath), `low_${imageName}`);
            imgBucket.upload(tempLowPath, {destination: lowFilePath, metadata: imgMetadata});
        }
        if(tempHighPath){
            const highFilePath = path.join(path.dirname(imagePath), `high_${imageName}`);
            imgBucket.upload(tempHighPath, {destination: highFilePath, metadata: imgMetadata});
        }
        return Promise.all([p1,p2]);
    })
    .then((files) => {
        fs.unlinkSync(tempPath);
        return null;        
    })
    .catch( err => {
        console.error(err);
    })

})

