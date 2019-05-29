const express = require('express');
require('./db/mongoose');
const User = require('./models/user');
const Task = require('./models/task');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT 

/*app.use((req, res, next) => {
    if(req.method === 'GET') {
        res.send('Get requests are disabled'); 
    } else {
        next();
    }
}); */

/*const multer = require('multer'); //multer used for data upload
const upload = multer({ //upload is an instance of multer with an options obj passed to it
    dest: 'images' //destination of where uploads is saved
});
app.post('/upload', upload.single('upload'), (req, res) => { //.single is multer middleware takes in as the argument the name you'd like to assign to your upload
    res.send(); //now when we use the post route the image uploaded using the key 'upload' will allow the file to be uploaded to the image dir that was created by the code above
}); */

app.use(express.json()); //automatically parses json data
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});

/*const jwt = require('jsonwebtoken');

const myFunction = async () => {
    const token = jwt.sign({ _id: 'abc123'}, 'Thisismyliferightnow', {expiresIn: '7 days'}); //creates a token and signs it with secret phrase we create. We used id in this case but could have used any piece of info from user model
    console.log(token);

    const data = jwt.verify(token, 'Thisismyliferightnow');
    console.log(data);
} 

myFunction(); */








