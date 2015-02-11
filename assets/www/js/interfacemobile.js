/*PARK*/
var parkPopup;
var parkTime;
var userCircle;
var userRadius;
var userLocationShown = false;

function park() {
	var center = map.getCenter();
	for(var i = 0; i < visibleMarkers.length; i++) {
		map.removeLayer(visibleMarkers[i]);
	}
	map.off('dragend', checkMarkers);
	map.off('zoomend', checkMarkers);
	$('#park-div, #spinner-bg').removeClass('hidden');
	$('#interface').addClass('hidden');
	locationPark = navigator.geolocation.watchPosition(parkLocated, gpsError, { maximumAge: 1000, timeout: 10000, enableHighAccuracy: true });
}

function closePark() {
	map.off('dragstart', markerAnimation);	
	map.off('dragend', getAddress);	
	map.closePopup();
	map.on('dragend', checkMarkers);
	map.on('zoomend', checkMarkers);
	$('#park-div, #spinner-bg').addClass('hidden');
	$('#interface').removeClass('hidden');
	checkMarkers();
}

function parkLocated(position) {
	if(position.coords.accuracy <= 10) {
		map.setView([position.coords.latitude, position.coords.longitude], 17);
		navigator.geolocation.clearWatch(locationPark);
		getAddress();
		$('#spinner-bg').addClass('hidden');
	}
}

function stopParkLocate() {
	var center = map.getCenter();
	navigator.geolocation.clearWatch(locationPark);
	$('#spinner-bg').addClass('hidden');
	$('#park-div').addClass('hidden');
	parkPopup = L.popup({closeButton: false})
		.setLatLng(center)
		.setContent('Træk i kortet for at vælge din position og tryk så godkend')
		.openOn(map);
	map.on('dragstart', markerAnimation);	
	map.on('dragend', getAddress);	
}

function markerAnimation() {
	map.closePopup();
	$('#park-marker').removeClass('hidden');
	setTimeout(function() {
		$('#park-marker').addClass('park-marker-lifted');
		$('#park-marker-shadow').removeClass('hidden');
	}, 100);
}

function getAddress() {
	$('#park-marker').removeClass('park-marker-lifted');
	setTimeout(function() {
		$('#park-marker-shadow, #park-marker').addClass('hidden');
	}, 100);
	
	var addressCoords = map.getCenter();
	
	$.ajax({
		type: "GET",
		url: "http://webapi.aws.dk/adresser/"+addressCoords.lat+","+addressCoords.lng+".json",
		dataType: "jsonp"
	})
	.done(function(data) {
		parkAddress = data;
		parkPopup = L.popup({closeButton: false, minWidth: 120, closeOnClick: false})
			.setLatLng(addressCoords)
			.setContent(data.vejnavn.navn+' '+data.husnr+'<br><div class="park-button blue park-btn-small" onclick="acceptParkLocation();">Godkend</div>')
			.openOn(map);
	});
}

function acceptParkLocation() {
	map.off('dragstart', markerAnimation);	
	map.off('dragend', getAddress);
	parkTime = lastUpdateTime;
	//var center = map.getCenter();
	parkPopup.setContent('Du har parkeret på '+parkAddress.vejnavn.navn+' '+parkAddress.husnr+' kl. '+parkTime+'<br><div class="park-button blue park-btn-small" onclick="closePark();">Færdig</div><div class="park-button blue park-btn-small" onclick="showUserLocation();">Vis min position</div>');
}

function showUserLocation() {
	locationPark = navigator.geolocation.watchPosition(onLocationFound, gpsError, { maximumAge: 1000, timeout: 10000, enableHighAccuracy: true });
	$('#marker-self').addClass('hidden');
	$('#park-div, #spinner-bg, #user-stop').removeClass('hidden');
}

function onLocationFound(position) {
	 var radius = position.coords.accuracy / 2;
	 
	if(position.coords.accuracy <= 15) {
		if(userLocationShown == false) {
			$('#park-div, #spinner-bg, #user-stop').addClass('hidden');
			userCircle = L.circle([position.coords.latitude, position.coords.longitude], 50).addTo(map);
			userRadius = L.circle([position.coords.latitude, position.coords.longitude], radius).addTo(map);
			userLocationShown = true;
		}
		else {
			userCircle.setLatLng([position.coords.latitude, position.coords.longitude]);
			userRadius.setLatLng([position.coords.latitude, position.coords.longitude]);
			userRadius.setRadius(radius);
		}
	}
	parkPopup.setContent('Din parkering<br><div class="park-button blue park-btn-small" onclick="stopUserLocation();">Afbryd</div>');
}

function stopUserLocation() {
	navigator.geolocation.clearWatch(locationPark);
	if(userCircle != undefined) {
		map.removeLayer(userCircle);
		map.removeLayer(userRadius);
	}
	$('#marker-self').removeClass('hidden');
	$('#park-div, #spinner-bg, #user-stop').addClass('hidden');
	parkPopup.setContent('Du har parkeret på '+parkAddress.vejnavn.navn+' '+parkAddress.husnr+' kl. '+parkTime+'<br><div class="park-button blue park-btn-small" onclick="closePark();">Færdig</div><div class="park-button blue park-btn-small" onclick="showUserLocation();">Vis min position</div>');
}

/*ROUTE DESCRIPTION POPUP*/
function toggleRouteDescription() {
	if($('#route-description').hasClass('route-description-closed')) {
		$('#route-description-ul').html('');
		$('#route-description').removeClass('hidden');
		var size;
		
		$('#route-info').html(selectedAddress['start']+' til '+selectedAddress['end']);
		$('#show-route').attr('onclick', 'toggleRouteSteps()');
		
		$('#route-description-ul').append('<li class="route-list-object">'+routeData.km+'km - ca. '+routeData.time+' minutter uden for myldretid</li>');
		
		for(var i = 0; i < routeData.simpledescription.length; i++) {
			$('#route-description-ul').append('<li class="route-list-object">'+routeData.simpledescription[i]+'</li>');
		}
		
		size = userscreen_height*0.30;
		$('#interface').addClass('hidden');
		$('#map-canvas').css({'height': userscreen_height - size + 'px'});
			
		setTimeout(function(){
			L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
		}, 300);
		
		$('#route-description').removeClass('route-description-closed');
		$('#route-description').addClass('route-description-open');
		for(var i = 0; i < visibleMarkers.length; i++) {
			map.removeLayer(visibleMarkers[i]);
		}
		map.off('dragend', checkMarkers);
		map.off('zoomend', checkMarkers);
		map.setMaxBounds(mapBounds);
	}
	else if($('#route-description').hasClass('route-description-open')) {
		//setTimeout(function() {
				
			setCanvasSize();

			setTimeout(function(){
				L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
				screenSize = 'full';
			}, 300);
			
			$('#route-description').removeClass('route-description-open');
			$('#route-description').addClass('route-description-closed');
			
			setTimeout(function() {
				$('#route-description').addClass('hidden');
			}, 500);
			
		//}, 500);
		setTimeout(function() {
			$('#interface').removeClass('hidden');
			map.on('dragend', checkMarkers);
			map.on('zoomend', checkMarkers);
		}, 500);	
	}
}

/*STEP BY STEP ROUTE DESCRIPTION*/
function toggleRouteSteps() {
	if($('#route-steps').hasClass('route-steps-closed')) {
		currentStep = 0;
		$('#route-steps').removeClass('hidden');
		$('#route-steps-forward').removeClass('hidden');
		$('#route-description').removeClass('route-description-open');
		$('#route-description').addClass('route-description-closed');
		
		var totalSteps = routeData.firstCoords.length;
		$('#step-of-steps').html((currentStep+1)+' af '+totalSteps);
		$('#route-steps-info').html(selectedAddress['start']+' til '+selectedAddress['end']);
		$('#route-steps-description').html(routeData.simpledescription[currentStep]);
		map.setView(routeData.firstCoords[currentStep], 17);	
		
		setTimeout(function() {
			$('#route-description').addClass('hidden');
			$('#route-steps').removeClass('route-steps-closed');
			$('#route-steps').addClass('route-steps-open');
		}, 500);
	}
	else if($('#route-steps').hasClass('route-steps-open')) {
		$('#route-description').removeClass('hidden');
		$('#route-steps').removeClass('route-steps-open');
		$('#route-steps').addClass('route-steps-closed');		
		setTimeout(function() {
			$('#route-steps').addClass('hidden');
			$('#route-description').removeClass('route-description-closed');
			$('#route-description').addClass('route-description-open');
		}, 500);	
	}
}

function updateRouteSteps(direction) {
	if(direction == 'forward') {
		currentStep++;
	}
	if(direction == 'back') {
		currentStep--;
	}
	
	var totalSteps = routeData.firstCoords.length;
	$('#step-of-steps').html((currentStep+1)+' af '+totalSteps);
	$('#route-steps-description').html(routeData.simpledescription[currentStep]);
	map.setView(routeData.firstCoords[currentStep], 17);	
	
	if((currentStep+1) > 1) {
		$('#route-steps-back').removeClass('hidden');
	}
	else if((currentStep+1) <= 1) {
		$('#route-steps-back').addClass('hidden');
	}
	
	if((currentStep+1) == routeData.firstCoords.length) {
		$('#route-steps-forward').addClass('hidden');
	}
	else if((currentStep+1) < routeData.firstCoords.length) {
		$('#route-steps-forward').removeClass('hidden');
	}
}

function closeRoute() {
	map.removeLayer(routeLayer);
	map.removeLayer(startMarker);
	map.removeLayer(endMarker);
	toggleRouteDescription();
	setTimeout(function() {
		updateVisibleMarkers();
		map.setView([55.397817, 10.385950], 15);
		map.on('dragend', checkMarkers);
		map.on('zoomend', checkMarkers);	
	}, 500);
}

/*TUTORIAL SLIDER*/
var slideCount = 1;
var slidePosition = 0;

$('#prev-btn').click(function() {
	tutorialSlide('prev');
});

$('#next-btn').click(function() {
	tutorialSlide('next');
});

function tutorialSlide(direction) {
	if(direction == 'prev' && slideCount>1) {
		//alert('Tilbage');
		slidePosition +=100;
		$('#tutorial-content').css('left', +slidePosition+ '%');
		$('#circle-'+slideCount).removeClass('circle-active');
		slideCount--;
		$('#circle-'+slideCount).addClass('circle-active');
		//alert(slideCount);
	}
	else if(direction == 'next' && slideCount<5) {
		//alert('Fremad!');
		slidePosition -=100;
		$('#tutorial-content').css('left', +slidePosition+ '%');
		$('#circle-'+slideCount).removeClass('circle-active');
		slideCount++;
		$('#circle-'+slideCount).addClass('circle-active');
		//alert(slideCount);
	}
}
