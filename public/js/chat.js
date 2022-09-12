const socket = io()

const messageForm = document.querySelector('#form')
const messageFormButton = document.querySelector('#btn1')
const messageFormInput = document.querySelector('#msg1')
const locationButton = document.querySelector('#location')
const messages = document.querySelector('#messages')

const tempelate= document.querySelector('#tempelate').innerHTML
const locationTempelate = document.querySelector('#locationTempelate').innerHTML
const sidebarTempelate = document.querySelector('#sidebarTempelate').innerHTML

const { username,room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () =>{
    messages.scrollTop = messages.scrollHeight
    // const newMessage = messages.lastElementChild

    // const newMessageStyles = getComputedStyle(newMessage)
    // const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    // const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // const visibleHeight = messages.offsetHeight

    // const containerHeight = messages.scrollHeight

    // const scrollOffset = messages.scrollTop + visibleHeight

    // if (containerHeight - newMessageHeight <=scrollOffset) {
    //     messages.scrollTop = messages.scrollHeight
    // }
}

socket.on('message', (message)=>{
    console.log(message.text)
    const html = Mustache.render(tempelate, {
        username: message.username,
        message : message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url)=>{
    const html = Mustache.render(locationTempelate, {
        username: url.username,
        url:url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTempelate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    messageFormButton.setAttribute('disabled', 'disabled')

    let msg1 = e.target.elements.message.value
    socket.emit('sendMessage',msg1, (error)=>{
        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('message Delivered!')
    })
})

locationButton.addEventListener('click', ()=>{
   if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
   }
   locationButton.setAttribute('disabled', 'disabled')
   navigator.geolocation.getCurrentPosition((position)=>{
         console.log([position.coords.latitude,position.coords.longitude])
         socket.emit('sendLocation', [position.coords.latitude,position.coords.longitude], ()=>{

            locationButton.removeAttribute('disabled')
            console.log('location shared!')
         })
   })
})

socket.emit('join', {username,room}, (error)=>{
    if(error) {
        alert(error)
        location.href = '/'
    }
})