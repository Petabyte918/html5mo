
// When user enters text, send it to the server as chat message
$('form').submit( function() {
	socket.emit('chat', { 
		msg: $('#m').val(),
		timestamp: Date.now()
	});
	// clear the input box
	$('#m').val('');
	return false;
});
