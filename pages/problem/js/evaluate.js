var contestName = localStorage.getItem('contestname');
var submitBtn = document.getElementById('submit-code');
var blankContainer = document.querySelector('.blank-container');
var statusSpinner = document.querySelector('.status');
var statusText = document.querySelector('.status strong');
var uploadBtn = document.querySelector('#upload-btn');

// output elements
var outputBox = document.querySelector('#output-section>div>div>div>div:nth-child(3)');
var compileTitle = document.querySelector('.success-error-label');
var compileMsg = document.querySelector('.compile-message');

submitBtn.addEventListener('click', evaluateProgram);
async function evaluateProgram(event) {
    event.preventDefault()
    if (document.querySelector('.code-area').value == '') {
        var popup = document.getElementById("myPopup1");
        popup.classList.toggle("show");
        setTimeout(() => {
            popup.classList.toggle("show");
        }, 2000);

    } else {

        if (document.querySelector('.status').innerHTML != '') {
            statusSpinner.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div>
        <strong>Loading...</strong>`;
        }

        submitBtn.setAttribute('disabled', '');
        statusSpinner.style.visibility = "visible";
        document.querySelector('.status strong').innerHTML = "Evaluating...";

        //Getting Inputs
        var filename = blankContainer.querySelector('span').textContent + blankContainer.querySelector('span:nth-child(2)').textContent;

        var program = document.querySelector('.code-area').value;

        var logintoken = localStorage.getItem('token');

        var problemId = document.querySelector('#problems .activeProb').textContent;

        const result = await fetch('/evaluateProgram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename,
                program,
                contestName,
                logintoken,
                problemId
            })
        }).then((res) => res.json())

        uploadBtn.type = "text";
        uploadBtn.type = "file";

        if (result.status == 'ok') {
            document.getElementById("output-section").style.display = 'none';
            result.data.feedback = result.data.feedback.replaceAll('<td>', '');
            var arr = result.data.feedback.split('</tr>');

            for (i in arr) {
                if (arr[i].includes('</a>')) {
                    delete arr[i];
                } else if (arr[i].includes('</th>')) {
                    delete arr[i];
                } else if (arr[i].includes('</table>')) {
                    delete arr[i];
                } else if (arr[i].includes('<tr>')) {
                    arr[i] = arr[i].replace('<tr>', '')
                }

            }
            var filtered = arr.filter(e => e != null);

            var obj = [];
            for (index in filtered) {
                var arr2 = filtered[index].split('</td>');
                for (k in arr2) {
                    if (!isNaN(arr2[k]) || (arr2[k].includes('Accepted') || arr2[k].includes('Wrong Answer'))) {

                    } else {
                        delete arr2[k];
                    }
                }
                obj.push(arr2.filter(e => e != null));
            }

            var element = `
            
                <div class="d-flex">
                    ${createTestCaseElement(obj)}
                </div>`;

            document.querySelector('.status').innerHTML = element;
            submitBtn.removeAttribute('disabled');

        } else if (result.status == 'Compile Time Error') {

            document.querySelector('.status strong').innerHTML = result.status;
            submitBtn.removeAttribute('disabled');
            statusSpinner.querySelector('div').style.display = "none";
            document.querySelector('.status strong').style.color = 'red';
            document.getElementById("output-section").removeAttribute("style");
            showCompileErrorBox(result.data)

        } else if (result.status == 'notok') {
            submitBtn.removeAttribute('disabled');
            alert('Something went wrong!')
            window.location.reload()
        }
    }


}

function createTestCaseElement(data) {
    var element = '';

    for (idx in data) {
        var iconClass = '';
        var passOrFail = '';
        var color = '';

        if (data[idx][1].includes('Accepted')) {
            iconClass = 'far fa-check-circle';
            passOrFail = 'Passed';
            color = 'text-primary';
        } else if ('Wrong Answer') {
            iconClass = 'fas fa-times';
            passOrFail = 'Failed';
            color = 'text-danger';
        }
        element = element + `<div class="test-case-${parseInt(idx) + 1} px-2">
                                <i class="${iconClass} ${color}"></i>
                                <span class="${color}">Test Case ${parseInt(idx) + 1} ${passOrFail}</span>
                            </div> `;

    }

    return element;
}


function showCompileErrorBox(data) {

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