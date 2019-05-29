const mongoose = require('mongoose');
const validator = require('validator'); //npm module for preset validations
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true //trims spaces off the name
    },

    email: {
        type: String,
        unique: true, //makes sure no duplicates in the database
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)) {//check if valid email from npm validator module
                throw new Error('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) { //es6 method definition validate allows custom validations
            if(value < 0) {
                throw new Error('Age must be a positive number');
            }
        }
    }, 
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if(value.length < 6 ) {
                throw new Error('Password must be greater than six characters');
            } else if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain the word password');
            }
        }
    },
    tokens: [{ //array of tokens for the user when logged in
        token: {
            type: String,
            required: true
        }
    }],
    avatar: { //adding 
        type: Buffer
    }

}, { //pass second object to schema that enables timestamps
    timestamps: true
});

userSchema.virtual('tasks', { //virtual field doesn't actually hold data in database but rather allows mongoose to figure out relations between two models
    ref: 'Task',
    localField: '_id', // the field in the current model that relates to the foreign field 
    foreignField: 'owner' //foreign field associates the current model with the name of its own model in another model ie: Tasks has a owner field which holds user ids 
});

userSchema.methods.toJSON = function () { //have to name toJASON and then in users/login don't have to set user: user.getPublicProfile() (old method name) explained at the end of vid 112
    const user = this;
    const userObject = user.toObject(); //just gives raw profile data

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

userSchema.methods.generateAuthToken = async function () { //allows us to create methods on the instance of a model
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET); //use tostring because user._id is an id object and jwt doesn't automatically convert those back to strings

    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;

}

userSchema.statics.findByCredentials = async (email, password) => { //allows us to create methods on the user model
    const user = await User.findOne({email}) //find user by email

    if(!user) {
        throw new Error('Unable to login!');
    }

    const isMatch = await bcrypt.compare(password, user.password); //check if the password matches up

    if(!isMatch) {
        throw new Error('Unable to login!');
    }

    return user;
}

userSchema.pre('save',  async function (next) {//pre allows the function to run before saving the schema to database. Save is the option. Function can't be arrow func because we need to use this binding and arrow func doesn't allow that.
    const user = this; //this refers to current user
    
    if(user.isModified('password')) { //checks to see if password value has been changed and if so then hashes it
        user.password = await bcrypt.hash(user.password, 8);
    }

    next(); //next is used to run the next thing after the funct is done doing what it needs to.
});

userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({owner: user._id});
    
    next();
});

const User = mongoose.model('User', userSchema); //associates userschema with user model

module.exports = User;
