var x = window.matchMedia("(max-width: 991px)")
var codeUtilities = document.querySelector(".code-utilities");
var runCodeBtn = document.getElementById('run-code');
var submitBtn = document.getElementById('submit-code');
var customInput = document.getElementById('custom-input-checkbox');
document.getElementById("output-section").style.display = "none";

customInput.addEventListener("click", showCustomInputArea);

x.addListener(changingClass);

window.onload = function () {
    changingClass();
};

function showCustomInputArea() {
    document.getElementById('custom-input-text-area').toggleAttribute('hidden');

    if (customInput.checked) {
        localStorage.checked = true;

    } else {
        localStorage.checked = false;
        document.getElementById('custom-input-text-area').value = '';
    }
}

function changingClass() {
    if (x.matches) {
        codeUtilities.classList.remove("ms-auto");
        runCodeBtn.classList.add('btn-sm');
        submitBtn.classList.add('btn-sm');
        runCodeBtn.parentElement.classList.add('pe-3');
        codeUtilities.classList.replace("col-lg-3", "col-lg-4");
        codeUtilities.classList.replace("pe-0", "pe-3");
    } else {
        codeUtilities.classList.add("ms-auto");
        runCodeBtn.classList.remove('btn-sm');
        submitBtn.classList.remove('btn-sm');
        runCodeBtn.parentElement.classList.remove('pe-3');
        codeUtilities.classList.replace("col-lg-4", "col-lg-3");
        codeUtilities.classList.replace("pe-3", "pe-0");
    }
}