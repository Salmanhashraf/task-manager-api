const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body);

    const task = new Task ({
        ...req.body, //Three dots copy all the elements of req.body onto task object
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch(e) {
        res.status(400).send(e);
    }

    /*task.save().then(() => {
        res.status(201).send(task);
    }).catch((e) => {
        res.status(400).send(e);
    }); */
});

//get /tasks?completed=true or false
//get /tasks?limit=10&skip=20 paginate so that skips first twenty results and next 10 show up
//get /tasks?sortBy=createdAt_asc or desc sort by time going in ascending order or descending order
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {};

    if(req.query.completed) {
        match.completed = req.query.completed === 'true' //this checks to see if query hold the string value to true and then sets it as the bool val for match.completed 
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split('_'); //splits the query string for sortBy by the _ character to get the asc or desc value
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; //checks if createdAt is desc or something else. if desc sets createdAt to -1 else 1
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match, //object above is used as the value of match
            options: { //populate options provided by mongoose
                limit: parseInt(req.query.limit), //parses query string for limit and if a valid number than applies it to results
                skip: parseInt(req.query.skip), //parse allows string int to turn into int
                sort
                
                /*sort: { //sort based on time -1 represents descending 1 represents ascending
                    createdAt: -1
                }*/
            }
            /*match: { //object that specifies which tasks we're trying to match
                completed: false
            } */
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send(e);
    }


    /*Task.find({}).then((tasks) => {
        res.send(tasks);
    }).catch((e) => {
        res.status(500).send();
    }); */
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({_id, owner: req.user._id}); //only allows a task to be fetched if it is one that the owner created
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch(e) {
        res.status(500).send(e);
    }

    /* Task.findById(_id).then((task) => {
        if(!task) {
            return res.status(404).send();
        }
        res.send(task);
    }).catch((e) => {
        res.status(500).send();
    });
    console.log(req.params); */
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if(!isValidOperation) {
        return res.status(404).send({error: 'Invalid update parameter!!!'});
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        
        if(!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => {
            task[update] = req.body[update];
        });

        await task.save();

        //const task = await Task.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true})
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }

});

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {

        const task = await Task.findOneAndDelete({_id, owner: req.user._id});
        if(!task) {
            return res.status(404).send('Task not found');
        }
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});






module.exports = router;