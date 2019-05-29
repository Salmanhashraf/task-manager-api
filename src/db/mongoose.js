const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser : true, useCreateIndex: true, useFindAndModify: false});





/*const me = new User({
    name: '   Jillian ',
    email: 'carl97@gmail.com    ',
    password: '   123455465'
});

me.save().then(() => { //saving user to db
    console.log(me);
}).catch((error) => {
    console.log(error);
}); */