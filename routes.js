const request = require('request')
const express = require('express')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')
const auth = require('./middleware/auth')
const fs = require('fs')
require('dotenv').config()

module.exports = function (app) {

    const url = process.env.MOOSHAK_URL;

    app.use('/contest/:cName/:token', auth, express.static(path.join(__dirname, 'pages/problem')))

    app.get('/getProblemStatement/:contestname/:pId', (req, res) => {
        var contestName = req.params.contestname;
        var pId = req.params.pId;
        getToken(function (token) {
            var options = {
                'method': 'GET',
                'url': `${url}/data/contests/${contestName}/problems/${pId}/statement`,
                'headers': {
                    'Accept': 'text/html',
                    'Authorization': `Bearer ${token}`
                }
            };
            request(options, function (error, response) {

                if (error) throw new Error(error);

                return res.json({ status: 'ok', html: `${response.body}` })
            });


        });

    })

    app.get('/listProblems/:cname/:token', async (req, res) => {
        var contestName = req.params.cname;
        var token = req.params.token;

        var config = {
            method: 'get',
            url: `${url}/data/contests/${contestName}/problems/`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        axios(config)
            .then(function (response) {

                return res.json({ status: 'ok', problems: response.data })
            })
            .catch(function (error) {

                return res.json({ status: 'notok' })
            });

    })


    app.get('/getLanguages/:contestname', (req, res) => {
        var contestName = req.params.contestname;
        getToken(function (token) {
            var options = {
                'method': 'GET',
                'url': `${url}/data/contests/${contestName}/languages/`,
                'headers': {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                var langArray = JSON.parse(response.body)
                var language = [];

                for (let index = 0; index < langArray.length; index++) {
                    const element = langArray[index];
                    language.push({ id: element.id, extension: element.extension })
                }

                return res.json({ status: 'ok', languages: language })

            });


        });

    })

    app.post('/validateProgram', (req, res) => {

        const validationData = {
            filename: req.body.filename,
            program: req.body.program,
            contestName: req.body.contestName,
            logintoken: req.body.logintoken,
            inputs: req.body.inputs,
            problemId: req.body.problemId
        }

        var programPath = __dirname + '/tmp/' + validationData.filename;

        fs.writeFile(programPath, validationData.program, function (err) {
            if (err) {
                return res.json({ status: 'notok' })
            } else {

                if (validationData.inputs == '') {
                    validationData.res = res;
                    validationData.path = programPath;
                    getPublicTestCase(validationData);
                } else {
                    publicTestCase = false;
                    validationData.inputArr = validationData.inputs.split('\n');
                    validationData.res = res;
                    validationData.path = programPath;
                    delete validationData.inputs;
                    delete validationData.program;

                    validateWithCustomInput(validationData, publicTestCase);
                }
            }
        });

    })

    //Program Evaluation
    app.post('/evaluateProgram', (req, res) => {

        const evaluationData = {
            filename: req.body.filename,
            program: req.body.program,
            contestName: req.body.contestName,
            logintoken: req.body.logintoken,
            problemId: req.body.problemId
        }

        var programPath = __dirname + '/tmp/' + evaluationData.filename;

        fs.writeFile(programPath, evaluationData.program, function (err) {
            if (err) {
                return res.json({ status: 'notok' })
            } else {

                var data = new FormData();
                data.append('program', fs.createReadStream(programPath));

                var config = {
                    method: 'post',
                    url: `${url}/data/contests/${evaluationData.contestName}/problems/${evaluationData.problemId}/evaluate`,
                    headers: {
                        'Authorization': `Bearer ${evaluationData.logintoken}`,
                        ...data.getHeaders()
                    },
                    data: data
                };

                axios(config)
                    .then(function (response) {

                        setTimeout(() => {
                            getSubmission(response.data.id, evaluationData, res, programPath);
                        }, 1000);
                    })
                    .catch(function (error) {

                        return res.json({ status: 'notok', error: error.response.data });
                    });
            }
        })



    })

    app.get('/getRank/:contestname/:logintoken', (req, res) => {
        var contestName = req.params.contestname;
        var loginToken = req.params.logintoken;

        var config = {
            method: 'get',
            url: `${url}/data/contests/${contestName}/rankings`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${loginToken}`
            }
        };

        axios(config)
            .then(function (response) {
                console.log(response.data);
                return res.json({ status: 'ok', data: response.data })

            })
            .catch(function (error) {
                console.log(error);
                return res.json({ status: 'notok', error: error })
            });

    })

    function getSubmission(id, evaluationData, res, path) {

        var config = {
            method: 'get',
            url: `${url}/data/contests/${evaluationData.contestName}/submissions/${id}/evaluation-summary`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${evaluationData.logintoken}`
            }
        };

        axios(config)
            .then(function (response) {

                fs.unlink(path, function (err) {
                    if (err) throw err;

                });

                var data = response.data;

                if (data.status == 'Accepted' || data.status == 'Wrong Answer') {

                    return res.json({ status: 'ok', data: { marks: data.mark, feedback: data.feedback } });

                } else if (data.status == 'Compile Time Error') {

                    var searchExpr = `/home/mooshak/data/contests/${evaluationData.contestName}/submissions/`;
                    const searchRegExp = new RegExp(searchExpr, 'g');
                    const error = response.data.observations.replace(searchRegExp, '');
                    return res.json({ status: data.status, data: { cId: id, result: error } });

                } else {

                    return res.json({ status: 'notok' });
                }
            })
            .catch(function (error) {

                return res.json({ status: 'notok' });
            });

    }

    function getPublicTestCase(validationData) {

        var config = {
            method: 'get',
            url: `${url}/data/contests/${validationData.contestName}/problems/${validationData.problemId}/public-tests/`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${validationData.logintoken}`
            }
        };

        axios(config)
            .then(function (response) {
                publicTestCase = true;
                var inputStr = '';
                var outputStr = ''
                for (object in response.data) {

                    inputStr = inputStr + response.data[object].input;
                    outputStr = outputStr + response.data[object].output;

                }
                validationData.inputArr = inputStr.trim().split('\n');
                validationData.outputArr = outputStr.trim().split('\n');
                validateWithCustomInput(validationData, publicTestCase)

            })
            .catch(function (error) {
                console.log(error);
            });

    }

    function validateWithCustomInput(validationData, publicTestCase) {
        const { path, inputArr, contestName, logintoken, res } = validationData;

        var data = new FormData();
        data.append('program', fs.createReadStream(path));
        data.append('consider', 'false');

        for (let index = 0; index < inputArr.length; index++) {
            const element = inputArr[index];
            data.append('input', `${element}`);
        }


        var config = {
            method: 'post',
            url: `${url}/data/contests/${contestName}/problems/${validationData.problemId}/evaluate`,
            headers: {
                'Authorization': `Bearer ${logintoken}`,
                ...data.getHeaders()
            },
            data: data
        };

        axios(config)
            .then(function (response) {

                setTimeout(() => {
                    evaluationSummary(response.data.id, validationData, publicTestCase);
                }, 1000);
            })
            .catch(function (error) {
                console.log(error.response.data);
                return res.json({ status: 'notok', error: error.response.data });
            });

    }

    function evaluationSummary(id, validationData, publicTestCase) {
        const { contestName, logintoken, path, res } = validationData;
        var config = {
            method: 'get',
            url: `${url}/data/contests/${contestName}/validations/${id}/evaluation-summary`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${logintoken}`
            }
        };

        axios(config)
            .then(function (response) {

                fs.unlink(path, function (err) {
                    if (err) throw err;

                });

                if (response.data.status == 'Compile Time Error') {

                    var searchExpr = `/home/mooshak/data/contests/${contestName}/validations/`;
                    const searchRegExp = new RegExp(searchExpr, 'g');
                    const error = response.data.observations.replace(searchRegExp, '');

                    return res.json({ status: response.data.status, data: { cId: id, result: error } });

                } else {
                    if (publicTestCase) {

                        var out = response.data.outputs;

                        var dataToSend = {}

                        for (let index = 0; index < validationData.outputArr.length; index++) {
                            const element = validationData.outputArr[index];

                            if (element == out[index].replace('\n', '')) {

                                dataToSend[`${index}`] = {
                                    isPassed: true,
                                    input: validationData.inputArr[index],
                                    yourOutput: out[index].replace('\n', ''),
                                    expectedOutput: validationData.outputArr[index]

                                }
                            } else {
                                dataToSend[`${index}`] = {
                                    isPassed: false,
                                    input: validationData.inputArr[index],
                                    yourOutput: out[index].replace('\n', ''),
                                    expectedOutput: validationData.outputArr[index]
                                }

                            }
                        }


                        return res.json({ status: 'ok', data: dataToSend, publicTestCase: this.publicTestCase });



                    } else {

                        var dataToSend = { inputs: validationData.inputArr, outputs: response.data.outputs }
                        return res.json({ status: 'ok', data: dataToSend, publicTestCase: this.publicTestCase });
                    }

                }

            })
            .catch(function (error) {
                console.log(error);
                return res.json({ status: 'notok', error: error.response.data });
            });

    }

    // Function for generating token by login as admin
    function getToken(callback) {
        var options = {
            'method': 'POST',
            'url': `${url}/auth/login/`,
            'headers': {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                "username": "admin",
                "password": "admin"
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            token = JSON.parse(response.body).token;
            return callback(token)
        });

    }

    app.get('/refreshToken/:token', async (req, res) => {
        var token = req.params.token;

        var options = {
            'method': 'POST',
            'url': `${url}/auth/refresh/`,
            'headers': {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        request(options, function (error, response) {

            if (error) {
                return res.json({ status: 'notok' })
            }
            if (JSON.parse(response.body).status) {
                return res.json({ status: 'notok' })
            }
            return res.json({ status: 'ok', token: JSON.parse(response.body).token })
        });


    })

    app.get('/listSubmissions/:contestName/:loginToken', async (req, res) => {
        var cName = req.params.contestName
        var token = req.params.loginToken
        var config = {
            method: 'get',
            url: `${url}/data/contests/${cName}/submissions/`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        axios(config)
            .then(function (response) {
                // console.log(typeof (response.data));

                return res.json({ status: 'ok', data: response.data })

            })
            .catch(function (error) {
                // console.log(error);
                return res.json({ status: 'notok', error: error })
            });
    })

}
