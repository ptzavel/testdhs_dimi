var apikey = ''

function redirectToGsis() {
  window.location.href = '/auth'
}

function getIrisCredentials() {
  fetch('/getIrisToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Replace with your credentials
  })
    .then((response) => response.json())
    .then((data) => {
      apikey = data.key
      console.log('Success:', apikey)
    })
    .catch((error) => {
      console.error('Error:', error)
    })
}
function getIrisRecipients() {
  fetch('/getIrisRecipients', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Replace with your credentials
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Data:', data)
    })
    .catch((error) => {
      console.error('Error:', error)
    })
}

function getIrisInbox() {
  fetch('/getIrisInbox', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Replace with your credentials
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Data:', data)
      const detailDivs = document.querySelectorAll('.details')
      detailDivs.forEach((div) => div.remove())
      let container = document.getElementById('documentContainer')
      console.log('container=', container)
      data.forEach((doc) => {
        const div = document.createElement('div')
        div.classList.add('doc-item')
        div.innerHTML = `
                                    <p>${doc.Id}</p>
                                    <p>${doc.Description}</p>
                                    <button onclick="getDocumentDetails('${doc.Id}', this)">Get Document</button>
                        `
        container.appendChild(div)
      })
    })
    .catch((error) => {
      console.error('Error:', error)
    })
}

const getDocumentDetails = (docId, buttonElement) => {
  console.log('Getting details for:', docId)
  fetch(`/getDocumentDetails/${docId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Replace with your credentials
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Data:', data)
      const detailsDiv = document.createElement('div')
      detailsDiv.classList.add('details')
      detailsDiv.style.paddingLeft = '20px'
      // Populate the container with details from the API response
      data.forEach((detail) => {
        const detailDiv = document.createElement('div')
        detailDiv.innerHTML = `
                        <br/>
                        <p>${detail.Description}</p>
                        <button onclick="getDocumentDetails('${detail.Id}', this)">Get Details</button>
                        <br/>
                        <br/>
                    `
        detailsDiv.appendChild(detailDiv)
      })

      // Insert the details container after the button that was clicked
      buttonElement.parentNode.insertBefore(detailsDiv, buttonElement.nextSibling)
    })
    .catch((error) => {
      console.error('Error:', error)
    })
}
const getDocumentFile = (docId) => {
  console.log('Fetching file for document:', docId)
  // Implement file fetching logic here
}

const uploadTestPdfs = () => {
  fetch('/uploadDocumentToIris', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('uploadTestPdfs Success:', data)
    })
    .catch((error) => {
      console.error('uploadTestPdfs Error:', error)
    })
}

const queryString = window.location.search
console.log(queryString)
const urlParams = new URLSearchParams(queryString)
const s = urlParams.get('s') ?? null

localStorage.setItem('socket_id', s)
console.log('localStorage socket_id=', localStorage.getItem('socket_id'))

