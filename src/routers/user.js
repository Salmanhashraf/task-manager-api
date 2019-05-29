const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail } = require('../emails/account');
const { sendCancelationEmail } = require('../emails/account');
const router = new express.Router();

const upload = multer({ // setting the destination dir
    //dest: 'avatars', //removing this dest so that we can store images to the user model instead of to a folder in our codebase 
    limits: { //restrictions on file upload size
        fileSize: 1000000 //number of bytes
    },
    fileFilter(req, file, cb) { //filefilter provided by multer to filter file types. req, file given and cb is callback
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {// file provides us with original filename and we can check if it endswith .pdf if we want a pdf file
            return cb(new Error('Please upload a file with a valid extention under 1MB'));
        } //the above if statement is a regular expression which translates to accept files that are .doc or .docx files only. Also the dollar sign means it must end with the extention not in the middle somewhere

        cb(undefined, true); //means we accept the file
    }
});

router.post('/users', async (req, res) => { //turning functions to async
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch(e) {
        res.status(400).send(e);
    }

    /*user.save().then(() => {
        res.status(201).send(user);
    }).catch((e) =>{
        res.status(400).send(e);
    }); */
});

router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (e) {
        res.status(400).send();
    }
});

router.post('/users/logout', auth, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => { //this code checks token array and if it isn't the token that is currently being used then it stays otherwise it is deleted from that array.
            return token.token !== req.token; //the tokens that pass this test will still be in the token array (req.token defined in auth)
        });

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user); //saved user in req.user header file in auth middleware
    
    /*User.find({}).then((users)=>{
        res.send(users);
    }).catch((e) =>{
        res.status(500).send();
    }); */
});

/*router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);    
        if(!user) {
            res.status(404).send();
        }
        res.send(user);
    } catch (e) {
        res.status(500).send(e);
    }


    /*User.findById(_id).then((user) => {
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    }).catch((e) =>{
        res.status(500).send();
    });
    console.log(req.params); 

});*/

router.patch('/users/me', auth, async (req, res) => {
    const _id = req.user._id
    const updates = Object.keys(req.body); //returns an array of strings where each string is a property on that object
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => { //every returns true only if every component in the array returns true
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) { //only runs if one of the updates is invalid
        return res.status(400).send({error: 'Invalid Update!!!'});
    }

    try {
        //const user = await User.findById(_id); //middle is bypassed by findByIdAndUpdate so we have to update the user manually to get access to user in middleware


        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });

        await req.user.save();


        //const user = await User.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true}); //returns new updated user in place of old user and makes sure all validators run
        res.send(req.user);
    } catch(e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {

    try {
        /*const user = await User.findByIdAndDelete(_id);
        if(!user) {
            return res.status(404).send({error: 'User does not exist already'});
        } */

        await req.user.remove(); //does the same thing as above just easier to use
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => { //multer middleware .single allows us to name the file that we will look for upon upload
    //req.user.avatar = req.file.buffer; //we will only have access to req.file.buffer if no dest is set in multer at the top
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer(); //using sharp to resize img but first sharp converts to png and then saves it as a buffer again
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {//this callback makes sure that error sent isnt a long one with random info and just what you want the message to say. Sent as a JSON obj
    res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/jpg') //sets the header of the response so that the image we sent back can actually be viewed instead of a buffer. Express defaults to JSON which is why we normally don't have to set the header type for our other routes
        res.send(user.avatar);

    } catch(e) {
        res.status(404).send();
    }
});


module.exports = router;