const jwt = require('jsonwebtoken')

const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk';

const auth = async (req, res, next) => {

    try {
        const token = req.cookies.login;
        jwt.verify(token, JWT_SECRET);
        next();

    } catch (error) {
        res.redirect('/');
    }
}

module.exports = auth;