"use strict"

module.exports = {
//---  HELPER FUNCTIONS   ---

	// Two-dimensional vector constructor
	V2: function(x,y) {
		return {x:x,y:y};
	},

	// Find object in array by its key value
	objectFindByKey: function(array, key, value) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] && array[i][key] == value) {
				return array[i];
			}
		}
		return null;
	},

	// Find objects index in array by its key value
	indexFindByKey: function(array, key, value) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] && array[i][key] == value) {
				return i;
			}
		}
		return null;
	},

	replaceAll : function(str, search, replacement) {
		return str.replace(new RegExp(search, 'g'), replacement);
	}
};
