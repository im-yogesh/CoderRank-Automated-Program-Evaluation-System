getContest();
async function getContest() {

    const result = await fetch('/listContest').then((res) => res.json())
    if (result.status == 'ok') {
        generateContestCard(result.data);

    } else {
        alert('Something Went Wrong!')
    }
}

function generateContestCard(data) {
    var cardElement = '';

    for (let index = 0; index < data.length; index++) {
        const element = data[index];

        cardElement = cardElement + `<div class="contest-card rounded-1 p-5 d-flex flex-column my-3">
        <span class="text-body title">${element.id} <i class="fas fa-star px-2"></i></span>
        <span class="detail text-body mt-2"><b>Organizes:</b> ${element.organizes}</span>
        <span class="detail text-success mt-2">Open: ${formatDate(element.open)}</span>
        <span class="detail text-danger mt-2">Close: ${formatDate(element.close)}</span>
        <button type="button" class="btn rounded-1 ms-0 ps-0 mt-5" onclick="enterContest(this)" id="enter-contest">Enter Contest</button>
    </div>`;


    }

    document.querySelector('.cards-container > div').innerHTML = cardElement;
}

function formatDate(date) {
    return new Date(date * 1000).toLocaleDateString("en-US") + " " + new Date(date * 1000).toLocaleTimeString("en-US");
}

function logout() {
    localStorage.clear()
    window.location.href = '/logout';
}

async function enterContest(ctx) {

    // var contestName = document.querySelector('.contest-card>.title').textContent;
    var contestName = ctx.parentElement.querySelector('.title').textContent;

    const result = await fetch(`/enterContest/${contestName}`).then((res) => res.json())

    if (result.status == 'ok') {

        var contestName = result.data.contestname;

        var token = result.data.token;
        localStorage.setItem('contestname', contestName)
        localStorage.setItem('token', token)
        window.location.href = `/contest/${contestName}/${token}`;
    } else {
        alert('Something went wrong!!')
    }

}


