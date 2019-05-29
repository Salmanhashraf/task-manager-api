const sgMail = require('@sendgrid/mail');



sgMail.setApiKey(process.env.SENDGRID_API_KEY); //sets api key for sendgrid mail 
//created env var for api key. To do this create config folder and a dev.env file in that name them and then we use them by running npm run dev command also we save env-cmd as a dev dependency. env-cmd allows for env vars to be properly used on all OS's since they have a different process to do so on each platform
sgMail.send({
    to: 'salman.ashraf2012@gmail.com',
    from: 'salman.ashraf2012@gmail.com',
    subject: 'This is my test email',
    text: 'Test message body'
});

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'test-email@gmail.com',
        subject: 'Thanks for joining Task Manager',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.` //using back ticks allows us to inject vars into string
    });
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'test-email@gmail.com',
        subject: 'Task Manager Cancellation',
        text: `We hope you enjoyed using the Task Manager app, ${name}. Please let us know if there was anything we could do to improve our service.` //using back ticks allows us to inject vars into string
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}