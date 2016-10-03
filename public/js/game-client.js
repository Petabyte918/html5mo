"use strict"

//---   ENGINE   ---

var engine = {
	data: {obj:{}}
};

//---   HELPERS   ---

function objectFindByKey(array, key, value) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] && array[i][key] == value) {
			return array[i];
		}
	}
	return null;
}

 $(document).ready(function() {
	DrawingInit();
	AddUIevents();
 });
