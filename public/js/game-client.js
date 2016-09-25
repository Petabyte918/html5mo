"use strict"

//---   ENGINE   ---

var engine = {
	data: {obj:{}}
};

// When user enters text, send it to the server as chat message
$('form').submit( function() {
	sendData('chat', {
		msg: $('#m').val(),
		timestamp: Date.now()
	});
	// clear the input box
	$('#m').val('');
	return false;
});

//---   HELPERS   ---

function objectFindByKey(array, key, value) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] && array[i][key] == value) {
			return array[i];
		}
	}
	return null;
}
