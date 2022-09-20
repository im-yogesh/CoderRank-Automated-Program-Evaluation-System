
var contestName = localStorage.getItem('contestname'); //Contest Name

// clear code area & setting contestname
document.querySelector('.code-area').innerHTML = '';
document.querySelector('#problem-title-area>div>span').innerHTML = contestName;

// Taking elements
var langSelector = document.getElementById('language-selector');
var blankContainer = document.querySelector('.blank-container');
var uploadBtn = document.querySelector('#upload-btn');
var runCodeBtn = document.getElementById('run-code');
var statusSpinner = document.querySelector('.status');


// output elements
var outputBox = document.querySelector('#output-section>div>div>div>div:nth-child(3)');
var compileTitle = document.querySelector('.success-error-label');
var compileMsg = document.querySelector('.compile-message');

// Event Listeners
langSelector.addEventListener('change', changeFileName);
uploadBtn.addEventListener('change', uploadFile);
blankContainer.addEventListener('click', editFileName);
runCodeBtn.addEventListener("click", validateProgram);

window.onload = () => {
    listProblems(contestName, localStorage.getItem('token'));

    getLanguages();
}

async function getProblemStatement(problemId) {

    const result = await fetch(`/getProblemStatement/${contestName}/${problemId}`).then((res) => res.json())

    if (result.status == 'ok') {

        document.getElementById('problem').innerHTML = result.html;

    } else {
        alert('Something went wrong!')
    }

}

async function listProblems(cname, token) {

    const result = await fetch(`/listProblems/${cname}/${token}`).then((res) => res.json())

    if (result.status == 'ok') {

        var element = '';

        for (problem in result.problems) {
            element = element + `
            <h5 class="p-3 pt-3 me-2" onclick="changeProb(this)">${result.problems[problem].id}</h5>
            `;
        }

        document.getElementById('problems').innerHTML = element;
        document.querySelector('#problems>h5').classList.add('activeProb');
        getProblemStatement(result.problems[0].id);

    } else {
        alert('Something went wrong!')
    }

}

function changeProb(ctx) {
    if (ctx.classList.contains('activeProb')) {

    } else {
        document.querySelector('#problems .activeProb').classList.remove('activeProb');
        ctx.classList.add('activeProb');

        getProblemStatement(ctx.textContent);
    }

}

async function getLanguages() {
    const result = await fetch(`/getLanguages/${contestName}`).then((res) => res.json())

    if (result.status == 'ok') {
        var languageExtensions = '';
        var options = '';

        for (let index = 0; index < result.languages.length; index++) {
            const element = result.languages[index];

            options = options + `<option value="${element.extension}">${element.id}</option>`;

            if (result.languages.length != index + 1) {
                languageExtensions = languageExtensions + `.${element.extension}, `
            } else {
                languageExtensions = languageExtensions + `.${element.extension}`
            }

        }

        uploadBtn.setAttribute("accept", languageExtensions)
        langSelector.innerHTML = options;

    } else {
        alert('Something went wrong!');
    }
}

function uploadFile() {
    alert('File Successfully Uploaded!')
    var file = document.getElementById('upload-btn').files[0];
    var fileName = document.getElementById('upload-btn').files[0].name;
    var fileExtension = fileName.split('.').pop();
    var selectIndex = document.querySelector(`#language-selector [value="${fileExtension}"]`).index;

    var reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function (e) {

        langSelector.selectedIndex = selectIndex;
        document.querySelector('.code-area').value = e.target.result;
        blankContainer.querySelector('span').textContent = fileName.split('.')[0];
        blankContainer.querySelector('span').removeAttribute("contenteditable");
        blankContainer.querySelector('span:nth-child(2)').textContent = "." + fileExtension;

    }
}

function changeFileName() {
    document.querySelector('.code-area').innerHTML = '';
    var fileExt = langSelector.value;
    blankContainer.querySelector('span').blur();
    blankContainer.querySelector('span').textContent = 'untitled';
    blankContainer.querySelector('span').setAttribute("contenteditable", "true");
    blankContainer.querySelector('span:nth-child(2)').textContent = "." + fileExt;
}

function editFileName() {
    blankContainer.addEventListener('keydown', (event) => {
        if (event.keyCode == 13) {
            event.preventDefault()
            var newFileName = blankContainer.querySelector('span').innerHTML;
            blankContainer.querySelector('span').blur();
            blankContainer.querySelector('span').textContent = newFileName;
        }

    })
}

async function validateProgram(event) {
    event.preventDefault()
    if (document.querySelector('.code-area').value == '') {

        var popup = document.getElementById("myPopup");
        popup.classList.toggle("show");
        setTimeout(() => {
            popup.classList.toggle("show");
        }, 2000);

    } else {


        if (document.querySelector('.status').innerHTML != '') {
            statusSpinner.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div>
        <strong>Loading...</strong>`;
        }

        var statusText = document.querySelector('.status strong');

        runCodeBtn.classList.remove('btn-light');
        runCodeBtn.setAttribute('disabled', '');
        statusSpinner.querySelector('div').removeAttribute("style");
        statusText.removeAttribute('style');
        document.querySelector('.status strong').innerHTML = "Validating...";
        statusSpinner.style.visibility = "visible";

        var filename = blankContainer.querySelector('span').textContent + blankContainer.querySelector('span:nth-child(2)').textContent;

        var program = document.querySelector('.code-area').value;

        var inputs = document.querySelector('.input-text-area>textarea').value;

        var logintoken = localStorage.getItem('token');

        var problemId = document.querySelector('#problems .activeProb').textContent;

        const result = await fetch('/validateProgram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename,
                program,
                contestName,
                logintoken,
                inputs,
                problemId
            })
        }).then((res) => res.json())



        uploadBtn.type = "text";
        uploadBtn.type = "file";

        if (result.status == 'ok') {

            document.querySelector('.status strong').innerHTML = "VALIDATED";
            statusSpinner.querySelector('div').style.display = "none";
            document.querySelector('.status strong').style.color = "#4DAA4E";
            runCodeBtn.classList.add('btn-light');
            runCodeBtn.removeAttribute('disabled');


            if (result.publicTestCase) {

                showSampleTestCasePassedBox(result.data);

            } else {

                showCompileSuccessBox(result.data);
                document.getElementById("output-section").removeAttribute("style");
            }



        } else if (result.status == 'Compile Time Error') {

            runCodeBtn.classList.add('btn-light');
            runCodeBtn.removeAttribute('disabled');
            statusText.innerHTML = result.status;
            statusSpinner.querySelector('div').style.display = "none";
            statusText.style.color = 'red';
            document.getElementById("output-section").removeAttribute("style");
            showCompileErrorBox(result.data)
        }
        else if (result.status == 'notok') {
            runCodeBtn.classList.add('btn-light');
            runCodeBtn.removeAttribute('disabled');
            alert('Something went wrong!')
        }

    }

}

function showCompileSuccessBox(data) {

    outputBox.classList.add("p-4", "bg-white");
    outputBox.classList.remove("row");
    compileTitle.innerHTML = "Compilation Successful :)";
    compileMsg.innerHTML = "Click the Submit Code button to run your code against all the test cases.";
    outputBox.style.borderBottom = "2px solid #4DAA4E";
    compileTitle.classList.replace("px-4", "px-1");
    compileTitle.classList.remove("text-danger", "bg-white");
    var element =
        `
        <div class="input-box">
            <span class="fs-6">Input (stdin)</span>
            <div class="input-container bg-light p-4">
               
                ${getInputs()}
            </div>
        </div>
        <div class="space my-5"></div>
        <div class="output-box">
            <span class="fs-6">Your Output (stdout)</span>
            <div class="output-container bg-light p-4">
                ${getOutputs()}
            </div>
        </div> 
    `;

    function getInputs() {
        var inputs = '';
        for (let index = 0; index < data.inputs.length; index++) {
            const element = data.inputs[index];
            inputs = inputs + element + '<br>';
        }
        return inputs;
    }

    function getOutputs() {

        var outputs = '';

        for (element in data.outputs) {
            outputs = outputs + data.outputs[element] + '<br>';
        }
        return outputs;
    }

    outputBox.innerHTML = element;

    document.querySelector('#output-section').scrollIntoView({
        behavior: 'smooth'
    });
}

function showSampleTestCasePassedBox(data) {

    var totalTestCases = 0;
    var testCasePass = 0;
    var testCaseFail = 0;
    var object = data;


    for (const property in object) {

        if (object[property].isPassed) {
            testCasePass = testCasePass + 1;
        } else if (object[property].isPassed == false) {
            testCaseFail = testCaseFail + 1;
        }
        totalTestCases = totalTestCases + 1;

    }

    outputBox.classList.remove("p-4", "bg-white");
    outputBox.classList.add("row");
    if (testCaseFail > 0) {
        compileTitle.innerHTML = "Wrong Answer :(";
        compileTitle.classList.replace("px-1", "px-4");
        compileTitle.classList.add("text-danger", "bg-white");
        compileMsg.innerHTML = `${testCaseFail}/${totalTestCases} Test Cases Failed`;
        outputBox.style.borderBottom = "2px solid red";
    } else {
        compileTitle.innerHTML = "Congratulations!";
        compileTitle.classList.replace("px-4", "px-1");
        compileTitle.classList.remove("text-danger", "bg-white");
        compileMsg.innerHTML = "You have passed the sample test cases. Click the submit button to run your code against all the test cases.";
        outputBox.style.borderBottom = "2px solid #4DAA4E";
    }

    var element =
        `
        <div class="col-lg-4 align-self-start p-0 shadow" style="overflow: auto;">

            ${createSampleTestCaseBox()}

        </div>
        <div class="col-lg-8 align-self-start bg-white p-4 shadow">

            <div class="input-box">

                <span class="fs-6">Input (stdin)</span>
                
                ${createInputBox()}
            </div>
            <div class="space my-4"></div>
            <div class="output-box">
                <span class="fs-6">Your Output (stdout)</span>
                
                ${createOutputBox()}
            </div>
            <div class="space my-4"></div>
            <div class="expected-output-box">
                <span class="fs-6">Expected Output (stdout)</span>
                
                ${expectedOutputBox()}
            </div>
        </div>
    `;

    function createInputBox() {
        var element = '';

        Object.entries(data).forEach(([key, value], index) => {

            element = element + `<div class="input-container-${index} bg-light p-3 ${index == 0 ? 'show' : 'hide'}">
                ${value.input}
       </div>`
        });
        return element;
    }

    function createOutputBox() {
        var element = '';

        Object.entries(data).forEach(([key, value], index) => {

            element = element + `<div class="your-output-container-${index} bg-light p-3 ${index == 0 ? 'show' : 'hide'}">
            ${value.yourOutput}
        </div>`
        });

        return element;
    }

    function expectedOutputBox() {
        var element = '';

        Object.entries(data).forEach(([key, value], index) => {

            element = element + `<div class="expected-output-container-${index} ${index == 0 ? 'show' : 'hide'} bg-light p-3">
            ${value.expectedOutput}
        </div>`
        });

        return element;
    }

    function createSampleTestCaseBox() {
        var ele = '';

        Object.entries(data).forEach(([key, value], index) => {
            // console.log(`${index}: ${key} = ${value}`);
            var textColor;
            var icon;
            if (value.isPassed) {
                textColor = 'text-primary';
                icon = 'far fa-check-circle';
            } else if (value.isPassed == false) {
                textColor = 'text-danger';

                icon = 'fas fa-times';
            }
            ele = ele + `<div class="sample-test-case-${index} ${index == 0 ? 'bg-white shadow' : ''} p-3" style="height: fit-content; cursor: pointer;" onclick="switchTestCase(this)" id="${index}">
            <i class="${icon} px-2 ${textColor}"></i>
            <span class="${textColor}">Sample Test Case ${index}</span>
            </div>`
        });

        return ele;
    }


    outputBox.innerHTML = element;
    document.getElementById("output-section").removeAttribute("style");

}

function showCompileErrorBox(data) {

    console.log(data);

    data.result = data.result.replaceAll(`${data.cId}/`, '<br>')
    data.result = data.result.replace(`<br>`, '')

    outputBox.classList.add("p-4", "bg-white");
    outputBox.classList.remove("row");
    compileTitle.innerHTML = "Compilation error :(";
    compileMsg.innerHTML = "Check the compiler output, fix the error and try again.";
    compileTitle.classList.replace("px-1", "px-4");
    compileTitle.classList.add("text-danger", "bg-white");
    outputBox.style.borderBottom = "2px solid red";

    var element =
        `
        <div class="input-box">
            <span class="fs-6">Compile Message</span>
            <div class="input-container bg-light p-4">
               
                ${data.result}
            </div>
        </div>
        <div class="space my-5"></div>
        <div class="output-box">
            <span class="fs-6">Exit Status</span>
            <div class="output-container bg-light p-4">
                1
            </div>
        </div> 
    `;

    outputBox.innerHTML = element;

    document.querySelector('#output-section').scrollIntoView({
        behavior: 'smooth'
    });

}

function switchTestCase(ctx) {

    if (ctx.classList.contains('bg-white')) {

    } else {

        var index = ctx.getAttribute('id');
        var sampleTest = outputBox.querySelector('div');
        var input = outputBox.querySelector('div:nth-child(2) > .input-box');
        var yourOutput = outputBox.querySelector('div:nth-child(2) > .output-box');
        var expectedOutput = outputBox.querySelector('div:nth-child(2) > .expected-output-box');


        sampleTest.querySelector('.bg-white').classList.remove('shadow', 'bg-white')
        sampleTest.querySelector(`.sample-test-case-${index}`).classList.add('bg-white', 'shadow')

        input.querySelector('.show').classList.replace('show', 'hide')
        input.querySelector(`.input-container-${index}`).classList.replace('hide', 'show');

        yourOutput.querySelector('.show').classList.replace('show', 'hide')
        yourOutput.querySelector(`.your-output-container-${index}`).classList.replace('hide', 'show');

        expectedOutput.querySelector('.show').classList.replace('show', 'hide')
        expectedOutput.querySelector(`.expected-output-container-${index}`).classList.replace('hide', 'show');
    }

}

setTimeout(() => {
    refreshToken(localStorage.getItem('token'));
}, 3000000);

async function refreshToken(token) {
    const result = await fetch(`/refreshToken/${token}`).then((res) => res.json())

    if (result.status == 'ok') {
        alert(result.token)
        localStorage.setItem('token', result.token)
    } else {
        alert('Session Expired!!')
    }
}