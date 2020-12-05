const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button'); 
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate =  document.querySelector('#message-template').innerHTML;
const locationMessageTemplate =  document.querySelector('#location-template').innerHTML;
const sidebarTempalte = document.querySelector('#sidebar-template').innerHTML;
//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
    //New Message Element
    const $newMessage = $messages.lastElementChild;

    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin//offsetHeight doesn't include margins

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //Height of messages container
    const containerHeight = $messages.scrollHeight;//the total height we can scroll to

    //scrollTop = gives us the amount we scrolled from the top
    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

    console.log( )
}

//Render user message to HTML
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text, //shorthand for message: message
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);  //beforeend - put it at the bottom of the element
    autoScroll()
});

//Render location url HTML
socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message .createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll( )
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTempalte, {
        room,
        users
    });
    document.querySelector("#sidebar").innerHTML = html
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    $messageFormButton.setAttribute('disabled', 'disabled'); //disable button while msg being sent

    const message = e.target.elements.message.value //target is the form

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) {
            return console.log(error);
        } 
        console.log('Message delivered!');
    }); 
});

$sendLocationButton.addEventListener('click', () => {
     if(!navigator.geolocation) {
         return alert('GEO Location is not supported by your browser!');
     }

     $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
         socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
         },
         () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location Shared!');
         });
     });
});

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/'
    }
});
