"use strict"

//--- GRAPHICAL USER INTERFACE ---

var gui = {
	inventoryOpen: false,
	charInfoOpen: false,
	inventoryPanel: document.getElementById("inventory-panel"),
	characterPanel: document.getElementById("character-panel"),
	ToggleInventory: function() {
		if(this.inventoryOpen) {
			this.inventoryPanel.style.display = "none";
		} else {
			this.inventoryPanel.style.display = "block";
		}
		this.inventoryOpen = !this.inventoryOpen;
	}
}
