var bounds;
var parkingData;
var parkingMarkers = [];
var parkingMarkersFiltered = [];
var visibleMarkers = [];
var size = 40;
var liveStart = false;
var liveData = false;

function loadLiveData() {
	$.ajax({
		type:"get",
		url:'http://apps.odense.dk/parkeringrt/livetest.json'
		//url: 'parkeringsdata.json?v=1'
	}).done(function(data){
		
		if(liveData == false) {
			loadMarkerData();
			setTimeout(function(){
				liveUpdateTimer();
			}, 30000);
		}
		liveData = data;
		lastUpdateTime = getCurrentTime();
		//console.log(liveData);
		if(liveStart != false) {
			liveUpdate();
		}
		liveStart = true;
	});
}

function loadMarkerData() {
	$.ajax({
		type:"get",
		url: 'http://apps.odense.dk/cm/php/get_export_data.php?p=%27tag_parking_places%27&type=json'
		//url:'http://apps.odense.dk/parkingdata/'
		//url: 'parkeringsdata.json?v=1'
	}).done(function(data){
		//data = JSON.parse(data);
		//console.log(data);
		parkingData = L.geoJson(data, {
			onEachFeature: parkingfeature,
			
			pointToLayer: createIcon
		});
		
		addMarkers();
		
		map.on('dragend', checkMarkers);
		map.on('zoomend', checkMarkers);
		
	});
}

function createIcon(feature, latlng) {
	var iconClass = determineIconImage(feature);
	var iconText = determineIconText(feature);
	
	var parkingIcon = L.divIcon({
		iconSize: [size, size],
		html: '<div class="'+iconClass+' parkingIcon">'+iconText+'</div>'
	}); 
	
	var icon = L.marker(latlng, {icon: parkingIcon, opacity: 1});
	
	parkingMarkers.push(icon);
	
	return icon;
}

//Create iconImage based on object properties and user settings
function determineIconImage(feature) {
	var iconClass = '';
					
	//Antal ledige pladser
	if(liveData[feature.properties.free_parkingspaces]) {
		if(liveData[feature.properties.free_parkingspaces].freeCount === "" || liveData[feature.properties.free_parkingspaces].maxCount == 0) {
			iconClass += 'grey';
		}
		else if(liveData[feature.properties.free_parkingspaces].freeCount <= 2) {
			iconClass += 'pink';
		}
		else if(liveData[feature.properties.free_parkingspaces].freeCount >2 && liveData[feature.properties.free_parkingspaces].freeCount <=9) {
			iconClass += 'blue';
		}
		else if(liveData[feature.properties.free_parkingspaces].freeCount >= 10) {
			iconClass += 'green';
		}		
	}
	else {
		iconClass = 'grey';
	}
	
	//Kælder eller på anden måde overdækket
	if(feature.properties.outdoor[0].value == true) {
		iconClass += '_nocover';
	}
	else if(feature.properties.outdoor[0].value == false) {
		iconClass += '_cover';
	}
	
	return iconClass;
}

//Determine icon text
function determineIconText(feature) {
	var data = liveData[feature.properties.free_parkingspaces];
	
	var iconText = '';

	//Type visning
	if(readout == 'available') {
		if(data) {
			if(data.freeCount === "") {
				iconText = 'P';
				//alert(feature.properties.name+'- Freecount tom');
			}
			else if(data.freeCount <= 2) {
				if(data.freeCount == 0 && data.maxCount == 0) {
					iconText = 'P';
					//alert(feature.properties.name+'- FreeCount + maxcount = 0');
				}
				else {
					iconText = '0-2';
				}			
			}
			else if(data.freeCount > 2 && data.freeCount <=9) {
				iconText = '3+';
			}
			else if(data.freeCount >= 10) {
				iconText = '10+';
			}
		}
		else {
			//alert(feature.properties.name+'- Mangler data/freeCount');
			iconText = 'P';
		}
	}
	else if(readout == 'max') {
		if(feature.properties.max_count === "" || feature.properties.max_count == 0) {
			iconText = 'P';
		}
		else if(feature.properties.max_count < 20 && feature.properties.max_count != 0) {
			iconText = '10+';
		}
		else if(feature.properties.max_count >= 20 && feature.properties.max_count < 50) {
			iconText = '20+';
		}
		else if(feature.properties.max_count >= 50 && feature.properties.max_count < 100) {
			iconText = '50+';
		}
		else if(feature.properties.max_count >= 100 && feature.properties.max_count < 200) {
			iconText = '100+';
		}
		else if(feature.properties.max_count >= 200 && feature.properties.max_count < 300) {
			iconText = '200+';
		}
		else if(feature.properties.max_count >= 300) {
			iconText = '300+';
		}
	}
	else if(readout == "price") {
		if(feature.properties.price === "") {
			iconText = 'P';
		}
		else {
			iconText += feature.properties.price+'kr';
		}			
	}
	else if(readout == "payperiod") {
		if(feature.properties.pay_period == 'Ingen betalingsperiode') {
			iconText = 'Ingen';
		}
		else if(feature.properties.pay_period == '' || feature.properties.pay_period == undefined || feature.properties.pay_period == 'Ingen info') {
			iconText = 'P';
		}
		else if(feature.properties.pay_period == 'kl. 00.00 - 24.00') {
			iconText = '0-24';
		}
		else if(feature.properties.pay_period == 'Hverdage kl. 9.00 - 18.00, l&oslash;rdage kl. 9.00 - 14.00') {
			iconText = '9-18';
		}
		else {
			iconText = 'P';
		}
	}
	else if(readout == "type") {
		if(feature.properties.parking_type == 'Betalingsparkering') {
			iconText = 'B';
		}
		else if(feature.properties.parking_type == 'Gratis tidsubegr&aelig;nset parkering') {
			iconText = 'G';
		}
		else if(feature.properties.parking_type == 'Gratis parkering 15 minutter') {
			iconText = '15';
		}
		else if(feature.properties.parking_type == 'Gratis parkering 30 minutter') {
			iconText = '30';
		}
		else if(feature.properties.parking_type == 'Gratis parkering 1 time') {
			iconText = '1t';
		}
		else if(feature.properties.parking_type == 'Gratis parkering 2 timer') {
			iconText = '2t';
		}
		else if(feature.properties.parking_type == 'Gratis parkering 3 timer') {
			iconText = '3t';
		}
	}
	return iconText;
}

//Add markers to map
function addMarkers() {
	bounds = map.getBounds();
	
	updateIconsFilter();
	
	for(var i = 0; i < parkingMarkersFiltered.length; i++) {
		if(bounds.contains(parkingMarkersFiltered[i].getLatLng())) {				
			visibleMarkers.push(parkingMarkersFiltered[i]);
		}
	}

	for(var i = 0; i < visibleMarkers.length; i++) {
		var newMarker = new L.marker(visibleMarkers[i]._latlng);
		map.addLayer(visibleMarkers[i]);
	}
}

//Check om ikoner er indenfor det synlige område af kortet
function checkMarkers() {
	bounds = map.getBounds();
	
	for(var i = 0; i < visibleMarkers.length; i++) {
		map.removeLayer(visibleMarkers[i]);
	}
	
	visibleMarkers.length = 0;
	
	for(var i = 0; i < parkingMarkersFiltered.length; i++) {
		if(bounds.contains(parkingMarkersFiltered[i].getLatLng())) {				
			visibleMarkers.push(parkingMarkersFiltered[i]);
		}
	}
	updateVisibleMarkers();
}

//Update kortet så kun de ikoner som er indenfor det synlig område vises.
function updateVisibleMarkers() {
	for(var i = 0; i < visibleMarkers.length; i++) {
		var newMarker = new L.marker(visibleMarkers[i]._latlng);
		map.addLayer(visibleMarkers[i]);
	}
}

//Opdatere ikoner når visning/filter ændres
function updateIconsReadout() {
	for(var i = 0; i < parkingMarkers.length; i++) {
		var iconClass = determineIconImage(parkingMarkers[i].feature, parkingMarkers[i].getLatLng());
		var iconText = determineIconText(parkingMarkers[i].feature, parkingMarkers[i].getLatLng());
		
		var newParkingIcon = L.divIcon({
			iconSize: [size, size],
			html: '<div class="'+iconClass+' parkingIcon">'+iconText+'</div>'
		}); 
		
		parkingMarkers[i].setIcon(newParkingIcon);
	}
}
function updateIconsFilter() {
	parkingMarkersFiltered.length = 0;
	for(var i = 0; i < parkingMarkers.length; i++) {
		var done = false;
		
		if(parkingMarkers[i].feature.properties.price == 0) {
			parkingMarkersFiltered.push(parkingMarkers[i]);
				done = true;
		}
		if(localStorage.getItem('prepay-coin') == 'true' && done == false) {
			if(parkingMarkers[i].feature.properties.payment_options[0].pay == true) {
				parkingMarkersFiltered.push(parkingMarkers[i]);
				done = true;
			}
		}
		
		if(localStorage.getItem('payment-after-card') == 'true' && done == false) {
			for(var j = 0; j < parkingMarkers[i].feature.properties.payment_options.length; j++) {
				if(parkingMarkers[i].feature.properties.payment_options[j].paymenttype == 'Card' && parkingMarkers[i].feature.properties.payment_options[j].pay_after == true) {
					parkingMarkersFiltered.push(parkingMarkers[i]);
					done = true;
				}
			}
		}
		
		if(localStorage.getItem('prepay-card') == 'true' && done == false) {
			for(var j = 0; j < parkingMarkers[i].feature.properties.payment_options.length; j++) {
				if(parkingMarkers[i].feature.properties.payment_options[j].paymenttype == 'Card' && parkingMarkers[i].feature.properties.payment_options[j].pay_before == true) {
					parkingMarkersFiltered.push(parkingMarkers[i]);
					done = true;			
				}
			}
		}
		if(localStorage.getItem('easypark') == 'true' && done == false) {
			for(var j = 0; j < parkingMarkers[i].feature.properties.payment_options.length; j++) {
				if(parkingMarkers[i].feature.properties.payment_options[j].paymentoption == 'Easypark' && parkingMarkers[i].feature.properties.payment_options[j].pay == true) {
					parkingMarkersFiltered.push(parkingMarkers[i]);
					done = true;
				}
			}
		}
		if(localStorage.getItem('quickcard') == 'true' && done == false) {
			for(var j = 0; j < parkingMarkers[i].feature.properties.payment_options.length; j++) {
				if(parkingMarkers[i].feature.properties.payment_options[j].paymentoption == 'QuickCard' && parkingMarkers[i].feature.properties.payment_options[j].pay == true) {
					parkingMarkersFiltered.push(parkingMarkers[i]);
					done = true;
				}
			}
		}
		if(localStorage.getItem('monthly-card') == 'true' && done == false) {
			for(var j = 0; j < parkingMarkers[i].feature.properties.payment_options.length; j++) {
				if(parkingMarkers[i].feature.properties.payment_options[j].paymentoption == 'Subscription' && parkingMarkers[i].feature.properties.payment_options[j].pay == true) {
					parkingMarkersFiltered.push(parkingMarkers[i]);
					done = true;
				}
			}
		}
	}
	checkMarkers();
}

//Popup Content
function parkingfeature(feature, layer){
	layer.on('click', function() {
		toggleParkPopup(layer);
		resizeMapCanvas();
		setCenter(layer.feature.geometry.coordinates);
	});
}