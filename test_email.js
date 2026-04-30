const nodemailer = require('nodemailer');

async function test() {
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    let info = await transporter.sendMail({
        from: '"EduHostel" <admin@eduhostel.edu>',
        to: "ireshamaduwnthi9@gmail.com",
        subject: "Payment Reminder Test",
        text: "Dear Parent, this is a test reminder for Iresha Gunasekara.",
    });

    console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
}

test();
