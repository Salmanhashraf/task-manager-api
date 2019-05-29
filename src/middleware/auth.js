const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    
    try {
        const token = req.header('Authorization').replace('Bearer ', ''); //This info we put into the header through postman are extracting here. Bearer is placed at the beginning of the token to know what type of token it is so we are removing it. Also 'Authorization' allows the method to look for that key value in the header
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token}); //decoded._id because jwt.verofy returns an object with a property called _id that holds the val of id
        if(!user) {
            throw new Error();
        }
        
        req.token = token; //this allows all reqs to have access to the specific token that was used to login in to a specific device
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({error: 'Please authenticate!'});
    }
}

module.exports = auth;