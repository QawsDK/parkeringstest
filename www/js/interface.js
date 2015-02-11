var stepMarker;

/*ROUTE DESCRIPTION POPUP*/
function toggleRouteDescription() {
	if($('#route-description').hasClass('route-description-closed')) {
		currentStep = 0;
		$('#route-description').removeClass('hidden');
		var size;
		
		var totalSteps = routeData.firstCoords.length;
		var routeSteps = '<li onclick="showWholeRoute();" class="route-list-object"><p class="blue-text">Zoom til hele ruten</p></li>';
		$('#show-route').html((currentStep+1)+' af '+totalSteps);
		$('#route-info').html(selectedAddress['start']+' til '+selectedAddress['end']);
		map.setView(routeData.firstCoords[currentStep], 17);
		stepMarker = L.popup({closeButton: false, minWidth: 300, closeOnClick: false})
			.setLatLng(routeData.firstCoords[currentStep])
			.setContent('<div id="route-steps-back-popup" onclick="updateRouteSteps(\'back\');" class="hidden"></div>'+routeData.simpledescription[currentStep]+'<div id="route-steps-forward-popup" onclick="updateRouteSteps(\'forward\');"></div>')
			.openOn(map);
		
		for(var i = 0; i < totalSteps; i++) {
			var step = '<li id="route-step-'+i+'" class="route-list-object" value="'+i+'" onclick="goToStep(this)">'+routeData.simpledescription[i]+'</li>';
			routeSteps += step;
		}
		
		$('#route-description-ul').html(routeSteps);
		
		$('#route-step-0').addClass('blue-highlight');
		
		size = userscreen_width*0.30;
		$('#map-canvas').css({'width': userscreen_width - size + 'px'});	
		
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
			
		$('#map-canvas').css({'width': userscreen_width + 'px'});
		
		setTimeout(function(){
			L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
			screenSize = 'full';
		}, 300);
		
		$('#route-description').removeClass('route-description-open');
		$('#route-description').addClass('route-description-closed');
		
		setTimeout(function() {
			$('#route-description').addClass('hidden');
		}, 500);
			
		setTimeout(function() {
			$('#interface').removeClass('hidden');
			map.on('dragend', checkMarkers);
			map.on('zoomend', checkMarkers);
		}, 500);	
	}
}

/*STEP BY STEP ROUTE DESCRIPTION*/
/*function toggleRouteSteps() {
	if($('#route-steps').hasClass('route-steps-closed')) {
		$('#route-steps').removeClass('hidden');
		$('#route-description').removeClass('route-description-open');
		$('#route-description').addClass('route-description-closed');
		
		var totalSteps = routeData.firstCoords.length;
		var routeSteps = '<ul><li onclick="showWholeRoute();" class="route-list-object">ZoomZoom</li>';
		$('#step-of-steps').html((currentStep+1)+' af '+totalSteps);
		$('#route-steps-info').html(selectedAddress['start']+' til '+selectedAddress['end']);
		map.setView(routeData.firstCoords[currentStep], 17);
		stepMarker = L.popup({closeButton: false, minWidth: 300})
			.setLatLng(routeData.firstCoords[currentStep])
			.setContent('<div id="route-steps-back-popup" onclick="updateRouteSteps(\'back\');" class="hidden"></div>'+routeData.simpledescription[currentStep]+'<div id="route-steps-forward-popup" onclick="updateRouteSteps(\'forward\');"></div>')
			.openOn(map);
		
		for(var i = 0; i < totalSteps; i++) {
			var step = '<li id="route-step-'+i+'" class="route-list-object" value="'+i+'" onclick="goToStep(this)">'+routeData.simpledescription[i]+'</li>';
			routeSteps += step;
		}
		
		routeSteps += '</ul>';
		
		$('#route-steps-description').html(routeSteps);
		
		$('#route-step-0').addClass('blue-highlight');
		
		setTimeout(function() {
			$('#route-description').addClass('hidden');
			$('#route-steps').removeClass('route-steps-closed');
			$('#route-steps').addClass('route-steps-open');
		}, 500);
	}
	else if($('#route-steps').hasClass('route-steps-open')) {
		//$('#route-description').removeClass('hidden');
		$('#route-steps').removeClass('route-steps-open');
		$('#route-steps').addClass('route-steps-closed');		
		setTimeout(function() {
			$('#route-steps').addClass('hidden');
			$('#route-description').removeClass('route-description-closed');
			$('#route-description').addClass('route-description-open');
		}, 500);	
	}
}*/

function goToStep(element) {
	currentStep = element.value;
	updateRouteSteps();	
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
	
	if($('.blue-highlight')[0]) {
		$('.blue-highlight').removeClass('blue-highlight');
	}

	$('#route-step-'+currentStep).addClass('blue-highlight');
	map.closePopup();
	
	stepMarker = L.popup({closeButton: false, minWidth: 300, closeOnClick: false})
			.setLatLng(routeData.firstCoords[currentStep])
			.setContent('<div id="route-steps-back-popup" onclick="updateRouteSteps(\'back\');"></div>'+routeData.simpledescription[currentStep]+'<div id="route-steps-forward-popup" onclick="updateRouteSteps(\'forward\');"></div>')
			.openOn(map);
	
	map.setView(routeData.firstCoords[currentStep], 17);	
	
	if((currentStep+1) > 1) {
		$('#route-steps-back-popup').removeClass('hidden');
	}
	else if((currentStep+1) <= 1) {
		$('#route-steps-back-popup').addClass('hidden');
	}
	
	if((currentStep+1) == routeData.firstCoords.length) {
		$('#route-steps-forward-popup').addClass('hidden');
	}
	else if((currentStep+1) < routeData.firstCoords.length) {
		$('#route-steps-forward-popup').removeClass('hidden');
	}
}

function showWholeRoute() {
	map.fitBounds(routeLayer);
}

function closeRoute() {
	map.removeLayer(routeLayer);
	map.removeLayer(startMarker);
	map.removeLayer(endMarker);
	map.closePopup();
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