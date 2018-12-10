'use strict';

const functions = require('firebase-functions');
const path = require('path');
const sharp = require('sharp');
const admin = require('firebase-admin')
const os = require('os');
const fs = require('fs');
admin.initializeApp();
const gcs = admin.storage();

const LOW_WIDTH = 480;
const LOW_HEIGHT = 640;

const HIGH_WIDTH = 1280;
const HIGH_HEIGHT = 960;

exports.resizeImages = functions.region("europe-west1").storage.bucket().object().onFinalize( (object) =>{
    const imageBucket = object.bucket;
    const imagePath = object.name;
    const imageType = object.contentType;

    if(!imageType.startsWith('image/')) {
        console.log("Not a image!!")
        return null;
    }
    const imageName = path.basename(imagePath);

    if(imageName.endsWith('_low')) {
        console.log("Already a low image!!")
        return null;
    }
    if(imageName.endsWith('_high')) {
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
        var p3 = null;
        var p4 = null;

        if(metadata.width > 640 && metadata.height > 480) {
            tempLowPath = path.join(os.tmpdir(),`${imageName}_low`);
            
            p1 = sharp(tempPath)
            .resize(LOW_WIDTH, LOW_HEIGHT, {
                fit: 'contain'
            })
            .toFile(tempLowPath);
        } 

       if (metadata.width > 1280 && metadata.height > 960 ) {
            tempHighPath = path.join(os.tmpdir(),`${imageName}_high`);
            p2 = sharp(tempPath)
            .resize(HIGH_WIDTH, HIGH_HEIGHT, {
                fit: 'contain'
            })
            .toFile(tempHighPath);
        }

        if(!tempLowPath){
            tempLowPath = path.join(os.tmpdir(),`${imageName}_low`); 
            p3 = sharp(tempPath)
            .clone()
            .toFile(tempLowPath);
        }
        if(!tempHighPath){
            tempHighPath = path.join(os.tmpdir(),`${imageName}_high`); 
            p4 = sharp(tempPath)
            .clone()
            .toFile(tempHighPath);
        }

        return Promise.all([p1, p2, p3, p4]);
    })
    .then((values) => {
        var p1 = null;
        var p2 = null;
        if(tempLowPath){
            const lowFilePath = path.join(path.dirname(imagePath), `${imageName}_low`);
            imgBucket.upload(tempLowPath, {destination: lowFilePath, metadata: imgMetadata});
        }
        if(tempHighPath){
            const highFilePath = path.join(path.dirname(imagePath), `${imageName}_high`);
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

// exports.sendNewGroupNotifications = functions.region("europe-west1")
// .database.ref('/group/{groupId}').onCreate((snapshot, context) => {

//     if(!snapshot.exists()){
//         console.log("no new data");
//         return;
//     }

//     let msg = {
//         "title": "addInGroup",
//         "body": "You are added into a group"
//     }

    
//         console.log("members are exists");
//       // eslint-disable-next-line consistent-return
//       return  snapshot.child("members").forEach(child => {
//             console.log("send message to topic:::" + child.key);
//             let message = {
//                 "notification": msg,
//                 "topic": child.key
//             }
//             admin.messaging().send(message)
//             .then(res => {
//                 console.log("Send message successfully!" + res);
//                 return;
//             })
//             .catch(err => {
//                 console.log("Error::" + err);
//             })
//         })
    
    
// });

exports.addNewUserNotifications = functions.region("europe-west1").database.ref('/group/{groupId}/members/{memberId}')
    .onCreate((snapshot, context) => {
        if(!snapshot.exists()){
            console.log("no new data");
            return;
        }
        let message = {
            "notification": {
                "title": "addInGroup",
                "body": "You are added into a group"
            },
            "topic": snapshot.key
        }
        admin.messaging().send(message)
        .then(res => {
            return console.log("Send message successfully!" + res);
        })
        .catch(err => {
            console.log("Error::" + err);
        })
    })

exports.sendMsgNotifications = functions.region('europe-west1').database.ref('/history/{groupId}/{messageId}')
    .onCreate((snapshot, context) => {
        if(!snapshot.exists()){
            console.log("no new data");
            return;
        }
        const groupId = context.params.groupId;
        const messageId = context.params.messageId;

        console.log("gourpid:::" + groupId + "  messageId:::" + messageId);
        const data = snapshot.val();
        const msg = data.chatMsg;
        const sender = data.sender;
        const sendername = data.sendername;
        let msgData;
        if(msg.startsWith("gs://"))
        {
            msgData = {
                "title": sendername,
                "body": "[image]"
            }
        }
        else{
            msgData = {
                "title": sendername,
                "body": msg
            }
        }
        
        console.log(msg,sender);
        // eslint-disable-next-line consistent-return
        return admin.database().ref(`/group/${groupId}/members`)
        .once("value")
        .then( (snapshot) => {
            
            return snapshot.forEach(child => {
                console.log("members id : " + child.key);
                let message = {
                    "notification": msgData,
                    "topic": child.key
                } 
                if(child.key !== sender){
                    console.log("sender "+ sender + " send to " + child.key);
                    admin.messaging().send(message);
                }
            });
        })
        .then(res => {
            console.log("Send message successfully!");
            return;
        })
        .catch(err => {
            console.log(err);
        })
})

