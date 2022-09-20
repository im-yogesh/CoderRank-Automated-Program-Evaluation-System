const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const auth = require('./middleware/auth')
const axios = require('axios');
require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET;
const url = process.env.MOOSHAK_URL;

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})

const port = process.env.PORT;
const app = express()
app.use(express.json())
app.use(cookieParser())
require('./routes.js')(app);

app.use('/', express.static(path.join(__dirname, 'pages/login')));

app.post('/api/register', async (req, res) => {
    const { username, password: plainTextPassword } = req.body

    if (!username || typeof username !== 'string') {
        return res.json({ status: 'error', error: 'Invalid username' })
    }

    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({ status: 'error', error: 'Invalid password' })
    }

    if (plainTextPassword.length < 5) {
        return res.json({
            status: 'error',
            error: 'Password too small. Should be atleast 6 characters'
        })
    }

    const password = await bcrypt.hash(plainTextPassword, 10);

    try {

        const response = await User.create({
            username,
            password
        })
        console.log('User created successfully: ', response)

    } catch (error) {

        if (error.code === 11000) {
            // duplicate key
            return res.json({ status: 'error', error: 'username already in use' })
        }
        throw error
    }

    res.json({ status: 'ok' })
})

app.post('/api/login', async (req, res) => {

    const { username, password } = req.body

    const user = await User.findOne({ username }).lean()

    if (!user) {
        return res.json({ status: 'error', error: 'Invalid username/password' })
    }

    if (await bcrypt.compare(password, user.password)) {
        // the username, password combination is successful

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username
            },
            JWT_SECRET
        )

        res.cookie('login', token, {
            httpOnly: true
        })
        res.cookie('username', user.username, {
            httpOnly: true
        })
        return res.json({ status: 'ok', username: user.username })

    }

    res.json({ status: 'error', error: 'Invalid username/password' })
})

app.use('/dashboard', auth, express.static(path.join(__dirname, 'pages/dashboard')));

app.get('/logout', (req, res) => {

    res.clearCookie('login');
    res.clearCookie('username');
    res.redirect('/')
})

app.get('/verify', auth, (req, res) => {
    res.json({ status: 'ok' })
})

app.get('/listContest', async (req, res) => {

    var config = {
        method: 'get',
        url: `${url}/data/contests`,
        headers: {
            'Accept': 'application/json'
        }
    };

    axios(config)
        .then(function (response) {
            var arr = []
            for (let index = 0; index < response.data.length; index++) {
                const element = response.data[index];
                if (element.id == 'proto_icpc' || element.id == 'ToPAS14') {

                } else {
                    arr.push(element);
                }

            }
            getContest(arr, res);
        })
        .catch(function (error) {

            return res.json({ status: 'notok' })
        });


})

function getContest(contestList, res) {

    var data = JSON.stringify({
        "username": "admin",
        "password": "admin"
    });

    var config = {
        method: 'post',
        url: `${url}/auth/login/`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: data
    };

    axios(config)
        .then(function (response) {

            var contestdetail = [];
            for (let index = 0; index < contestList.length; index++) {
                const element = contestList[index];
                contestDetails(element, response.data.token, function (detail) {

                    contestdetail.push({
                        id: detail.id,
                        designation: detail.designation,
                        organizes: detail.organizes,
                        open: detail.open,
                        close: detail.close
                    })

                }, res);

            }

            setTimeout(() => {
                return res.json({ status: 'ok', data: contestdetail })
            }, 1000);


        })
        .catch(function (error) {
            return res.json({ status: 'notok' })
        });

}

function contestDetails(element, token, callback, res) {
    var config = {
        method: 'get',
        url: `${url}/data/contests/${element.id}`,
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    axios(config)
        .then(function (response) {

            return callback(response.data);
        })
        .catch(function (error) {

            return res.json({ status: 'notok' })
        });
}

app.get('/enterContest/:contestname', async (req, res) => {
    var contestName = req.params.contestname;

    const user = jwt.verify(req.cookies.login, JWT_SECRET);
    loginContest(user.username, contestName, res);

})

function loginContest(username, contestName, res) {

    var data = JSON.stringify({
        "contest": contestName,
        "username": username,
        "password": username
    });

    var config = {
        method: 'post',
        url: `${url}/auth/login/`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: data
    };

    axios(config)
        .then(function (response) {

            // console.log(JSON.stringify(response.data));
            res.json({ status: 'ok', data: { token: response.data.token, contestname: contestName } })
        })
        .catch(function (error) {

            if (error.response.status === 403) {

                registerContest(username, contestName, res);
            } else {
                return res.json({ status: 'notok' })
            }

        });

}

function registerContest(username, contestName, res) {
    var data = JSON.stringify({
        "contest": contestName,
        "name": username,
        "username": username,
        "password": username
    });

    var config = {
        method: 'post',
        url: `${url}/auth/enroll/`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: data
    };

    axios(config)
        .then(function (response) {
            // console.log(JSON.stringify(response.data));
            res.json({ status: 'ok', data: { token: response.data.token, contestname: contestName } })
        })
        .catch(function (error) {

            return res.json({ status: 'notok' })
        });

}

app.listen(port, () => {
    console.log(`Server up at http://localhost:${port}`);
});