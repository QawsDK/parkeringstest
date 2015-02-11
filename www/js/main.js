var userscreen_height;
var userscreen_width;
var map;
var watchId;
var posCircle;
var posRadius;
var activeGps = false;
/*GLOBAL VARS FOR MAPCANVASRESIZE*/
var zoomLevel;

var readout = 'available';
var routeProvider = 'routeOdense';

var locationRoute;
var locationPark;

var lastUpdateTime = '';
var openSpot;
var screenSize = 'full';
var parkAddress;
var hasPrePay = false;
var hasBackPay = false;
var addressesLoaded = false;
var direction = 'start';

var selectedAddress = new Array();
var selectedNumber = new Array();
var coords = new Array();

coords['start'] = '';
coords['end'] = '';

selectedAddress['start'] = '';
selectedAddress['end'] = '';

selectedNumber['start'] = '';
selectedNumber['end'] = '';

var mapMarker;
var startMarker;
var endMarker;

var startIcon = L.icon({
	iconUrl: 'http://apps.odense.dk/parkeringbeta/img/map-start.png?v=1',
	iconSize: [35, 35]
});

var endIcon = L.icon({
	iconUrl: 'http://apps.odense.dk/parkeringbeta/img/map-end.png?v=1',
	iconSize: [35, 35]
});

var routeData;
var routeLayer;

/*ROUTE STEP BY STEP GUIDE*/
var currentStep = 0;

/*MAP BOUNDARIES*/
var northWest = L.latLng(55.530825, 10.127607);
var southEast = L.latLng(55.275107, 10.630299);

var mapBounds = L.latLngBounds(northWest, southEast);

/*BOOTUP FUNCTIONS*/
window.onload = function(event) {
	setCanvasSize();
	initMap();
}

window.onresize = function(event) {
	setCanvasSize();
}

function setCanvasSize() {
	userscreen_width = $(window).width();
	userscreen_height = $(window).height();
	
	if($('#park-popup').hasClass('park-popup-closed')) {
		$('#map-canvas').css({'height': userscreen_height + 'px'});
		$('#map-canvas').css({'width': userscreen_width + 'px'});
		$('#menu').css({'height': userscreen_height + 'px'});
		$('.content-page').css({'height': userscreen_height + 'px'});
		$('.content').css({'height': userscreen_height-50 + 'px'});
		$('#tutorial-content').css({'height': userscreen_height-50 + 'px'});
		if(version == 'mobile') {
			$('.park-popup-open').css({'top': userscreen_height/2 + 'px'});
			/*$('.route-popup-open').css({'top': userscreen_height/2 + 'px'});*/
		}	
	}		
}

function createMenu() {
	if(version == 'mobile') {
		$('#menu').append('\
		<ul>\
			<li onclick="toggleOverlayPage(\'tutorial\');">Brugervejledning</li>\
			<li onclick="toggleOverlayPage(\'settings\');">Indstillinger</li>\
			<li onclick="toggleOverlayPage(\'about\');">Om siden</li>\
			<li onclick="toggleOverlayPage(\'contact\');">Kontakt</li>\
			<li onclick="toggleOverlayPage(\'share\');">Del på sociale medier</li>\
		</ul>');
	}
	else if(version == 'pc') {
		$('#menu').append('\
			<div class="content-top-bar">\
				<div class="back-btn" onclick="toggleMenu();"></div>\
				<div class="content-headline">Menu</div>\
			</div>\
			<div class="content">\
				<ul>\
					<li onclick="toggleOverlayPage(\'tutorial\');">Brugervejledning</li>\
					<li onclick="toggleOverlayPage(\'settings\');">Indstillinger</li>\
					<li onclick="toggleOverlayPage(\'about\');">Om siden</li>\
					<li onclick="toggleOverlayPage(\'contact\');">Kontakt</li>\
					<li onclick="toggleOverlayPage(\'share\');">Del på sociale medier</li>\
				</ul>\
			</div>\
		');
	}
}

function initMap() {
	var mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
	mapquestAttribution = '<p>© OpenStreetMap, Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>',
	subDomains = ['otile1','otile2','otile3','otile4'];	
	
	var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/odensekommune.zfv9rudi/{z}/{x}/{y}.png', {attribution: '<a href="http://www.openstreetmap.org/copyright">© OpenStreetMap</a>-bidragsydere'});
	
	//Initiate map
	map = new L.map('map-canvas', {
		center: new L.LatLng(55.397817, 10.385950),
		zoom: 15,
		layers: mapboxTiles,
		minZoom: 10,
		//layers: [mapquest],
		zoomControl: true, 
		maxBounds: mapBounds,
		panControl: wp
	});
	createMenu();
	loadSettings();
	loadLiveData();
	loadHistory();
}

function liveUpdateTimer() {
	setTimeout(function(){
		loadLiveData();
		liveUpdateTimer();
		lastUpdateTime = getCurrentTime();
	}, 30000);
}

function liveUpdate() {
	updateIconsReadout();
	if(!$('#park-popup').hasClass('hidden')) {
		$('#live-data').html('<p><strong>Antal ledige pladser: </strong>'+liveData[openSpot].freeCount+', sidst opdateret kl. '+lastUpdateTime+'</p>');
	}
}

function getCurrentTime() {
	var d = new Date();
	
	var time = d.getHours()+':'+addZero(d.getMinutes());
	
	return time;
}

function addZero(s){
	if(s < 10){
		s = '0'+s;
	}	
	return s;
}

/*BACKGROUND CLICK*/
function backgroundClick() {
	if($('#menu').hasClass('menu-open')) {
		toggleMenu();
	}
	else {
		toggleInfoPage();
	}
}

/*BUTTON HIGHLIGHTS*/
function btnAnimate(element) {
	$('#'+element.id).addClass('interface-btn-animate');
	setTimeout(function() {
		$('#'+element.id).removeClass('interface-btn-animate');
	}, 300);
}

function backAnimate(element) {
	$(element).addClass('back-btn-animate');
	setTimeout(function() {
		$(element).removeClass('back-btn-animate');
	}, 300);
}

/*MENU*/
function toggleMenu() {
	if($('#menu').hasClass('menu-closed')) {
		$('#menu').removeClass('hidden');
		$('#menu-bg').removeClass('hidden');
		$('#menu').removeClass('menu-closed');
		setTimeout(function() {
			$('#menu').addClass('menu-open');
		}, 100);
	}
	else {		
		$('#menu-bg').addClass('hidden');
		$('#menu').removeClass('menu-open');
		$('#menu').addClass('menu-closed');
		setTimeout(function() {
			$('#menu').addClass('hidden');
		}, 700);
	}
}

/*RESIZE MAP CANVAS*/
function resizeMapCanvas() {	
	if(screenSize == 'full') {
		zoomLevel = map.getZoom();
		var size;
		
		if(version == 'mobile') {
			$('#interface').addClass('hidden');
			size = userscreen_height/2;
			$('#map-canvas').css({'height': userscreen_height - size + 'px'});
			$('.leaflet-top.leaflet-right').addClass('hidden');
		}
		else {
			size = userscreen_width*0.30;
			$('#map-canvas').css({'width': userscreen_width - size + 'px'});	
		}
		setTimeout(function(){
			L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
		}, 300);
		
		screenSize = 'half';
		setTimeout(function() {
			var bounds = map.getBounds();
			map.setMaxBounds(bounds);
		}, 1500);
	}
	else if(screenSize == 'half') {
		setTimeout(function() {
			if(version == 'mobile') {
				setCanvasSize();
			}
			else {
				$('#map-canvas').css({'width': userscreen_width + 'px'});
			}	
			setTimeout(function(){
				L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
			}, 300);
			
			screenSize = 'full';
			map.setZoom(zoomLevel);
		}, 500);
		setTimeout(function() {
			$('#interface').removeClass('hidden');
			$('.leaflet-top.leaflet-right').removeClass('hidden');
			map.setMaxBounds(mapBounds);
		}, 500);	
	}
}

/*SET CENTER*/
function setCenter(Center) {
	var center = Center;
	setTimeout(function() {	
		map.setView(center.reverse(), 17);
		center.reverse();		
	}, 700);
}

/*OVERLAY PAGE OPEN*/
function toggleOverlayPage(id) {
	if($('#menu').hasClass('menu-open')) {
		toggleMenu();
	}
	if(id == 'route') {
		if($('#route-page').hasClass('route-open')) {
			setTimeout(function() {		
				$('#'+id+'-page').removeClass('route-open');
				setTimeout(function() {
					$('#'+id+'-page').addClass('hidden');
					$('#'+id+'-page').addClass('route-closed');
					$('#contact-parkingspot-div').addClass('hidden');
				}, 700);		
			}, 300);
		}
		else {
			$('#'+id+'-page').removeClass('hidden');
			$('#'+id+'-page').removeClass('route-closed');
			setTimeout(function() {		
				$('#'+id+'-page').addClass('route-open');
			}, 100);
		}
	}
	else {
		if($('.content-page').hasClass('content-open')) {
			setTimeout(function() {		
				$('#'+id+'-page').removeClass('content-open');
				setTimeout(function() {
					$('#'+id+'-page').addClass('hidden');
					$('#'+id+'-page').addClass('content-closed');
					$('#contact-parkingspot-div').addClass('hidden');
				}, 700);		
			}, 300);
		}
		else {
			$('#'+id+'-page').removeClass('hidden');
			$('#'+id+'-page').removeClass('content-closed');
			setTimeout(function() {		
				$('#'+id+'-page').addClass('content-open');
			}, 100);
		}
	}	
}

/*PARKING POPUP*/
function toggleParkPopup(layer) {
	if($('#park-popup').hasClass('park-popup-closed')) {
		$('#park-popup').html('');
		if($('#readout-page').hasClass('content-open')) {
			$('#readout-page').removeClass('content-open');
		}
		else if($('#filter-page').hasClass('content-open')) {
			$('#filter-page').removeClass('content-open');
		}
	
		parkingPlaceContent = getParkingContent(layer);
		$('#park-popup').append(parkingPlaceContent);
		
		if(hasBackPay == true) {
			$('#paymentBackCheck').addClass('check-green');
		}
		else if(hasBackPay == false) {
			$('#paymentBackCheck').addClass('negative-pink');
		}
		if(hasPrePay == true) {
			$('#paymentPreCheck').addClass('check-green');
		}
		else if(hasPrePay == false) {
			$('#paymentPreCheck').addClass('negative-pink');
		}
		
		$('#park-popup').removeClass('hidden');
		
		setTimeout(function() {
			$('#park-popup').removeClass('park-popup-closed');
			$('#park-popup').addClass('park-popup-open');
		}, 200);	
		
		map.once('click', toggleParkPopup);
		map.once('click', resizeMapCanvas);
	}
	else if($('#park-popup').hasClass('park-popup-open')) {
		$('#img-div').html('');
		$('#park-popup').removeClass('park-popup-open');
		$('#park-popup').addClass('park-popup-closed');
		if(!$('#route-popup').hasClass('route-popup-closed')) {
			toggleRoutePopup();
		}
		setTimeout(function() {
			$('#park-popup').addClass('hidden');
			$('#park-popup').html('');
			map.setMaxBounds(mapBounds);
		}, 500);
	}
}

/*GET PARKING CONTENT*/
function getParkingContent(layer) {
	var content = '<div class="park-popup-content"><ul>';
	var img = '';
	openSpot = layer.feature.properties.free_parkingspaces;
	
	var cover = '';
	if(layer.feature.properties.outdoor[0].value == false) {
		cover += ' i kælder/p-hus.';
	}
	
	content += '<div id="parking-more">\
						<div class="more-btn" id="route-here-btn" onclick="routeToInfo(\''+layer.feature.properties.name+'\','+layer._latlng.lat+','+layer._latlng.lng+'); toggleRoutePopup(); toggleParkPopup();">Rute</div>\
							<div class="more-btn" id="name-box"><strong>'+layer.feature.properties.name+'</strong><br><p style="font-size: 0.8em !important; margin: 0 !important">'+layer.feature.properties.parking_type+cover+'</p></div>\
						<div class="more-btn" id="report-error-btn" onclick="toggleParkPopup(); errorReport(\''+layer.feature.properties.name+'\'); setTimeout(function() {resizeMapCanvas();}, 500);">Tip os</div>\
					</div><li class="basic-info">';
	
	if(liveData[layer.feature.properties.free_parkingspaces]) {
		content += '<p><strong>Antal pladser i alt: </strong>'+liveData[layer.feature.properties.free_parkingspaces].maxCount+'</p><br>';
		content += '<div id="live-data"><p><strong>Antal ledige pladser: </strong>'+liveData[layer.feature.properties.free_parkingspaces].freeCount+', sidst opdateret kl. '+lastUpdateTime+'</p></div>';
	}
	else {
		content+= '<p><strong>Antal pladser i alt: </strong>'+layer.feature.properties.max_count+'</p><br>';
	}
	
	if(layer.feature.properties.price == 0) {
		content += '<p><strong>Pris: </strong>Gratis</p><br>';
	}	
	else {
		content += '<p><strong>Pris: </strong>'+layer.feature.properties.price+'kr/time</p><br>\
		<p><strong>Betalingsperiode: </strong>'+layer.feature.properties.pay_period+'</p><br>';
	}
	
	if(layer.feature.properties.price_extra_info || layer.feature.properties.max_height) {
		content += '<p><strong>Bemærk: </strong></p><br>';
		if(layer.feature.properties.please_note_danish) {
			content += '<p>'+layer.feature.properties.please_note_danish+'</p><br>';
		}	
		if(layer.feature.properties.price_extra_info) {
			content += '<p>'+layer.feature.properties.price_extra_info+'</p><br>';
		}
		if(layer.feature.properties.max_height) {
			content += '<p><strong>Max højde: </strong>'+layer.feature.properties.max_height+' meter</p><br>';
		}
	}
	
	content += '<div onclick="togglePaymentInfo(\'walking-distance\');"><strong>Gangafstande </strong><p class="blue-text" onclick="changeText(this)"> - Vis</p>\
			<div id="walking-distance" class="hidden info-li">';
	
	if(layer.feature.properties.distance_to_vestergade) {
		content += '<p><strong>Til Vestergade: </strong>'+layer.feature.properties.distance_to_vestergade+' meter</p><br>';
	}
	if(layer.feature.properties.distance_to_kongensgade) {
		content += '<p><strong>Til Kongensgade: </strong>'+layer.feature.properties.distance_to_kongensgade+' meter</p><br>';
	}
	if(layer.feature.properties.distance_to_flakhaven) {
		content += '<p><strong>Til Flakhaven: </strong>'+layer.feature.properties.distance_to_flakhaven+' meter</p><br>';
	}
	if(layer.feature.properties.distance_to_brandts) {
		content += '<p><strong>Til Brandts: </strong>'+layer.feature.properties.distance_to_brandts+' meter</p><br>';
	}
	if(layer.feature.properties.distance_to_koncerthuset) {
		content += '<p><strong>Til Koncerthuset: </strong>'+layer.feature.properties.distance_to_koncerthuset+' meter</p><br>';
	}
	
	content += '</div></div>';
	
	if(version == 'mobile') {
		img += '<div id="parking-img"><div id="parking-img-toggle" class="blue" onclick="toggleParkingImg();">+</div><img class="parking-img-thumb" onclick="toggleParkingImg();" src="img/asylgade.jpg" /></div>';
		setTimeout(function() {
			$('#img-div').append(img);
		}, 300);
	}
	
	content += '</li>';
	
	if(layer.feature.properties.price != 0) {
		
		var paymentBackCardInfo = '';
		paymentBackCardInfo += '<li onclick="togglePaymentInfo(\'card-back-info\');"><div id="paymentBackCheck"></div><strong>Bagudbetaling med kort </strong><p class="blue-text" onclick="changeText(this)">- Mere info</p>\
			<li id="card-back-info" class="hidden info-li italic">\
				På p-pladser med bagudbetaling betaler du kun for den tid, du parkerer. Og du behøver ikke skynde dig tilbage, fordi parkeringen er ved at løbe ud.\
				På nogle private p-pladser gælder der dog særlige regler vedr. minimumsbetaling med mere.\
				Se vejledninger på parkeringsautomaten og den stedlige skiltning. Billetter trukket med kort kan kun bruges på den pågældende p-plads.\
				<strong>OBS! Husk at stoppe din parkering ved at tjekke ud i automaten, før du forlader pladsen. Ellers fortsætter betalingen i op til 14 dage.</strong>\
			</li>\
		</li>\
		<li onclick="togglePaymentInfo(\'backCardOptions\');"><p onClick="changeText(this)" class="italic showOptions blue-text">Vis muligheder</p>\
				<li id="backCardOptions" class="hidden info-li">\
				<ul class="paymentOptions-ul">';
		
		var paymentPreCardInfo = '';
		paymentPreCardInfo += '<li onclick="togglePaymentInfo(\'card-pre-info\');"><div id="paymentPreCheck"></div><strong>Forudbetaling med kort </strong><p class="blue-text" onclick="changeText(this)">- Mere info</p>\
			<li id="card-pre-info" class="hidden info-li italic">\
				På p-pladser med forudbetaling skal du ved start af din parkering tage stilling til hvor længe du ønsker at parkere.\
				Pris for ikke anvendt parkeringstid refunderes ikke. Se vejledninger på parkeringsautomaten og den stedlige skiltning.\
				Billetter trukket med kort kan kun bruges på den pågældende p-plads.\
			</li>\
		</li>\
		<li onclick="togglePaymentInfo(\'preCardOptions\');"><p onClick="changeText(this)" class="italic showOptions blue-text">Vis muligheder</p>\
				<li id="preCardOptions" class="hidden info-li">\
				<ul class="paymentOptions-ul">';	
			
		for(var i = 0; i < layer.feature.properties.payment_options.length; i++) {
			/*MØNTER*/
			if(layer.feature.properties.payment_options[i].paymentoption == 'Coins') {
				var paymentCoin = '';
				if(layer.feature.properties.payment_options[0].pay == true) {
					paymentCoin += '<li onclick="togglePaymentInfo(\'coin-more-info\');"><strong>Mønter </strong><p class="blue-text" onclick="changeText(this)">- Mere info</p>';
				}		
				if(layer.feature.properties.payment_options[i].pay == true) {
					paymentCoin += '<div class="check-green"></div>';
				}
				else if(layer.feature.properties.payment_options[i].pay == false) {
					paymentCoin += '<div class="negative-pink"></div>';
				}
				paymentCoin += '<li id="coin-more-info" class="hidden info-li italic">\
						På betalingspladserne er der opstillet billetautomater. 1 kr., 2 kr., 5 kr., 10 kr., og 20 kr. kan anvendes.\
						En forudbetalt billet kan bruges i samme eller billigere takstzone på kommunale pladser samt på private pladser, hvor det fremgår af skiltningen.\
					</li>\
				</li>';
			}
			/*KORT BETALING BAGUD*/
			if(layer.feature.properties.payment_options[i].paymenttype == 'Card') {			
				if(layer.feature.properties.payment_options[i].pay_after == true) {
					paymentBackCardInfo += '<li>'+layer.feature.properties.payment_options[i].paymentoption+'<div class="check-green"></div></li>';
					hasBackPay = true;
				}
				else if(layer.feature.properties.payment_options[i].pay_after == false) {
					paymentBackCardInfo += '<li>'+layer.feature.properties.payment_options[i].paymentoption+'<div class="negative-pink"></div></li>';
				}		
			}
			/*KORT BETALING FORUD*/
			if(layer.feature.properties.payment_options[i].paymenttype == 'Card') {
				if(layer.feature.properties.payment_options[i].pay_before == true) {
					paymentPreCardInfo += '<li>'+layer.feature.properties.payment_options[i].paymentoption+'<div class="check-green"></div></li>';
					hasPrePay = true;
				}
				else if(layer.feature.properties.payment_options[i].pay_before == false) {
					paymentPreCardInfo += '<li>'+layer.feature.properties.payment_options[i].paymentoption+'<div class="negative-pink"></div></li>';
				}
			}
			/*EASYPARK*/
			if(layer.feature.properties.payment_options[i].paymentoption == 'Easypark') {
				var easypark = '';
				easypark += '<li onclick="togglePaymentInfo(\'easypark-info\');"><strong>Easypark </strong><p class="blue-text" onclick="changeText(this)">- Mere info</p>';
					
				if(layer.feature.properties.payment_options[i].pay == true) {
					easypark += '<div class="check-green"></div>';
				}
				else if(layer.feature.properties.payment_options[i].pay == false) {
					easypark += '<div class="negative-pink"></div>';
				}
				easypark += '<li id="easypark-info" class="hidden info-li italic">\
						Betal parkering via mobiltelefonen. Se <a href="http://www.easypark.dk" target="_blank">www.easypark.dk</a>\
					</li>\
				</li>';
			}
			/*QUICKCARD*/
			if(layer.feature.properties.payment_options[i].paymentoption == 'QuickCard') {
				var quickcard = '';
				quickcard += '<li onclick="togglePaymentInfo(\'quickcard-info\');"><strong>Quickcard </strong><p class="blue-text" onclick="changeText(this)">- Mere info</p>';
					
				if(layer.feature.properties.payment_options[i].pay == true) {
					quickcard += '<div class="check-green"></div>';
				}
				else if(layer.feature.properties.payment_options[i].pay == false) {
					quickcard += '<div class="negative-pink"></div>';
				}
				quickcard += '<li id="quickcard-info" class="hidden info-li italic">\
						Med QuickCard er det nemt at parkere i alle Q-Parks P-huse. Se <a href="http://www.q-park.dk/dk/parkering/quickcard" target="_blank">Quickcard</a>\
					</li>\
				</li>';
			}
			/*MÅNEDSKORT*/
			if(layer.feature.properties.payment_options[i].paymentoption == 'Subscription') {
				var subscriptionInfo = '';
				subscriptionInfo += '<li onclick="togglePaymentInfo(\'subscription-info\');"><strong>Månedskort </strong><p class="blue-text" onclick="changeText(this)">- Mere info</p>';
					
				if(layer.feature.properties.payment_options[i].pay == true) {
					subscriptionInfo += '<div class="check-green"></div>';
				}
				else if(layer.feature.properties.payment_options[i].pay == false) {
					subscriptionInfo += '<div class="negative-pink"></div>';
				}
				subscriptionInfo += '<li id="subscription-info" class="hidden info-li italic">\
						Der kan købes månedskort til henholdsvis rød og blå takstzone.\
						Månedskort til blå takstzone (8 kr./time) koster 800 kr. pr. måned og er gyldige i blå takstzone på kommunale pladser samt på private pladser, hvor det fremgår af skiltningen.\
						Månedskort til rød takstzone (12 kr./time) koster 1200 kr. pr. måned og er gyldige i rød og blå takstzone på kommunale pladser samt på private pladser, hvor det fremgår af skiltningen.\
						Du bestemmer selv startdatoen for gyldighedsperioden ved at skrabe felterne for henholdsvis dag, måned og år.\
						Månedskort kan købes her:<br>\
						BorgerServiceCenter<br>\
						Skulkenborg 1<br>\
						5000 Odense C.<br>\
						<a href="http://www.odense.dk/home/topmenu/borger/borgerservice/aabningstider" target="_blank">Åbningstider i Borgerservicecenter</a>\
					</li>\
				</li>';
			}
		}
		
		paymentBackCardInfo += '</ul></li></li>';
		paymentPreCardInfo += '</ul></li></li>';
			
		content += '<li><strong>Betalingsmuligheder: </strong>\
				<ul id="payment-options">\
					'+paymentCoin+'\
					'+paymentBackCardInfo+'\
					'+paymentPreCardInfo+'\
					'+easypark+'\
					'+quickcard+'\
					'+subscriptionInfo+'\
				</ul>\
				</li>';	
	}
					
	content += '<li><strong>Administrator:</strong> '+layer.feature.properties.admin_name+'</li>';
	content += '<li><strong>Administrator telefon:</strong> <a href="tel:+45 '+layer.feature.properties.admin_phone+'">+45 '+layer.feature.properties.admin_phone+'</a></li>';
	content += '<li><strong>Administrator link:</strong> <a href="'+layer.feature.properties.admin_link+'" target="_blank">'+layer.feature.properties.admin_link+'</a></li>';
	content += '<li></li>';
	
	content += '</ul></div>';
	
	return content;	
}

/*TOGGLE ROUTE POPUP*/
function toggleRoutePopup() {
	if($('#route-popup').hasClass('route-popup-closed')) {
		map.off('click', toggleParkPopup);
		map.once('click', toggleRoutePopup);
		$('#route-popup').removeClass('hidden');
		setTimeout(function(){
			$('#route-popup').removeClass('route-popup-closed');
		}, 100);
		setTimeout(function(){
			$('#route-start').attr('onclick', "toggleOverlayPage('route');");
			$('#route-start').html('Min position (Tryk for at ændre)');
			$('#route-end').attr('onclick', "");
		}, 500);
		/*setTimeout(function() {
			$('#route-end').html(selectedAddress['end']);
		}, 700);*/
	}
	else {
		$('#route-popup').addClass('route-popup-closed');
		map.off('click', toggleRoutePopup);
		setTimeout(function() {
			$('#route-popup').addClass('hidden');
		}, 500);
	}
}

/*SWITCHAROO*/
function swapPoints() {
	var tempCoords = coords['start'];
	var tempAddress = selectedAddress['start'];
	var tempNumber = selectedNumber['start'];
	
	coords['start'] = coords['end'];
	selectedAddress['start'] = selectedAddress['end'];
	selectedNumber['start'] = selectedNumber['end'];
	
	coords['end'] = tempCoords;
	selectedAddress['end'] = tempAddress;
	selectedNumber['end'] = tempNumber;

	if(direction == 'start') {
		direction = 'end';
		$('#route-start').attr('onclick', "");
		$('#route-end').attr('onclick', "toggleOverlayPage('route'); toggleParkPopup()");
	}
	else {
		direction = 'start';
		$('#route-start').attr('onclick', "toggleOverlayPage('route'); toggleParkPopup()");
		$('#route-end').attr('onclick', "");
	}
	
	var temp = $('#route-start').html();
	$('#route-start').html($('#route-end').html());
	$('#route-end').html(temp);
}

function toggleRouteOptions(id) {
	$('#route-popup-options').addClass('hidden');
	
	selectedNumber['start'] = '';
	selectedNumber['end'] = '';
	
	$('#confirm-btn').unbind('click');
	setTimeout(function() {
		$('#'+id).removeClass('hidden');
	}, 100);
	
	if(id == 'my-position') {
		$('#route-'+direction).html('Min position');	
		toggleOverlayPage('route');
		setTimeout(function() {
			$('#route-popup-options').removeClass('hidden');
		}, 500); 
	}
	
	if(id == 'address-search') {
		changeRouteHeader('<input type="text" id="search" placeholder="Søg..." onchange="searchAddress();"><div id="search-button" onclick="searchAddress();"></div>', id);
		$('#confirm-btn').on('click', function() {
			confirmSelection('address');
			//alert('adress');
		});
		if(addressesLoaded == false) {
			loading('Henter adresser...');
			var p = '';
			$.ajax({
			type: "GET",
			url: "http://webapi.aws.dk/vejnavne.json?kommunekode=0461",
			dataType: "jsonp"
			})
			.done(function(data){
				$("#address-ul").html("");
				$(data).each(function(i){
					$(data[i]).each(function(){						
						if(data[i].wgs84koordinat !== undefined && data[i].wgs84koordinat.bredde !== p){
							var id = data[i].navn.toLowerCase().replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, '');
							$("#address-ul").append('<li data-value="'+data[i].wgs84koordinat.bredde+','+data[i].wgs84koordinat.længde+'" id="'+id+'" class="list-object" onclick="selectObject(this,\'address\');">'+data[i].navn+'</li>');
							
							p = data[i].wgs84koordinat.bredde;
						}
					});
				});
				$("#address-ul").append('<li class="list-object"></li>');
				loading();
			});	
			
			addressesLoaded = true;
		}
	}
	else if(id == 'parkingspot') {
		changeRouteHeader('Parkeringspladser', id);
		$('#confirm-btn').on('click', function() {
			confirmSelection('place');
		});
	}
	else if(id == 'place') {
		changeRouteHeader('Steder', id);
		$('#confirm-btn').on('click', function() {
			confirmSelection('place');
		});
	}
	else if(id == 'highway') {
		changeRouteHeader('Indfaldsveje', id);
		$('#confirm-btn').on('click', function() {
			confirmSelection('place');
		});
	}
	else if(id == 'history') {
		changeRouteHeader('Historik', id);
		$('#confirm-btn').on('click', function() {
			confirmSelection('place');
		});
	}
}

/*SELECT ON MAP*/
function selectOnMap() {
	toggleOverlayPage('route');
	resizeMapCanvas();
	$('#route-popup').addClass('hidden');
	map.off('click', resizeMapCanvas);
	map.off('click', toggleRoutePopup);
	for(var i = 0; i < visibleMarkers.length; i++) {
		map.removeLayer(visibleMarkers[i]);
	}
	map.off('dragend', checkMarkers);
	map.off('zoomend', checkMarkers);
	setTimeout(function() {
		$('#interface').addClass('hidden');
	}, 500);
	
	map.once('click', function(e) {	
		if(direction == 'start') {
			mapMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: startIcon, draggable:true});
		}
		else if(direction == 'end') {
			mapMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: endIcon, draggable:true});
		}
		map.addLayer(mapMarker);
		$('#map-select-confirm').removeClass('hidden');
		$('#map-select-confirm').one('click', function() {
			coords[direction] = mapMarker._latlng.lat+','+mapMarker._latlng.lng;
			$.ajax({
				type: "GET",
				url: "http://webapi.aws.dk/adresser/"+mapMarker._latlng.lat+','+mapMarker._latlng.lng+".json",
				dataType: "jsonp"
			})
			.done(function(data) {
				selectedAddress[direction] = data.vejnavn.navn+' '+data.husnr;
				$('#route-'+direction).html(data.vejnavn.navn+' '+data.husnr);
				setTimeout(function() {
					$('#map-select-confirm').addClass('hidden');
					$('#interface').removeClass('hidden');
					resizeMapCanvas([mapMarker._latlng.lng, mapMarker._latlng.lat]);
					$('#route-popup').removeClass('hidden');
					map.on('dragend', checkMarkers);
					map.on('zoomend', checkMarkers);	
					updateVisibleMarkers();					
				}, 500);
			});
		});
	});
}
	
function selectObject(object, type) {
	$('#confirm-btn').removeClass('hidden');
	if($('.selected')[0]) {
		$('.selected').removeClass('selected');
	}
	
	$('#'+object.id).addClass('selected');
	coords[direction] = $(object).attr('data-value');
	if(type == 'address' || type == 'place') {
		selectedAddress[direction] = $(object).html();
	}
	else if(type == 'number') {
		if($(object).html() == 'Intet nummer') {
			selectedNumber[direction] = '';
		}
		else {
			selectedNumber[direction] = $(object).html();
		}		
	}
}

function confirmPoint() {
	
	$('#route-'+direction).html(selectedAddress[direction]+' '+selectedNumber[direction]);
	
	toggleOverlayPage('route');
	
	setTimeout(function(){
		$('#address-search, #number-search, #parkingspot, #place, #highway, #history, #confirm-btn').addClass('hidden');
		$('#route-menu-headline').html('Ruteberegning');
		$('#route-back-btn').attr("onclick", "backAnimate(this); toggleOverlayPage('route')");
		$('#route-popup-options').removeClass('hidden');
	}, 700);
}

function confirmSelection(type) {
	if(type == 'address') {	
		$('#confirm-btn').addClass('hidden');
		getHouseNumber();
	}
	else if(type == 'number' || type == 'place') {
		$('#confirm-btn').addClass('hidden');
		confirmPoint();
	}
}

function changeRouteHeader(headline, id) {
	$('#route-menu-headline').html(headline);
	$('#route-back-btn').attr("onclick", "routeBack(\'"+id+"\')");
}

function routeBack(id) {
	$('#route-menu-headline').html('Ruteberegning');
	$('#route-back-btn').attr("onclick", "backAnimate(this); toggleOverlayPage('route')");
	$('#route-popup-options').removeClass('hidden');
	$('#'+id).addClass('hidden');
	if(!$('#confirm-btn').hasClass('hidden')) {
		$('#confirm-btn').addClass('hidden')
	}	
}

function searchAddress(){
	var search = $("#search").val();
	if(search.length > 2){
		var o = document.getElementById('address-ul').getElementsByTagName('li');
		var l = o.length;
		for(var i = 0; i < l; i++){
			var v = o[i].id.indexOf(search.toLowerCase());
			if(v == 0){	
				if(version == 'mobile') {	
					if(wp == true) {				
						$('#address-ul').animate({
							scrollTop: $('#'+o[i].id).offset().top - 50
						}, 1000);									
					}
					else {
						$('html, body').animate({
							scrollTop: $('#'+o[i].id).offset().top - 50
						}, 1000);
					}
				}
				if(version == 'pc') {
					$('#route-content').animate({
						scrollTop: $('#'+o[i].id).offset().top - 50
					}, 1000);
				}			
				return false;
			}
		}
	}
}

function searchNumber(){
	var search = $("#search").val();
	if(search.length > 1){
		var o = document.getElementById('number-ul').getElementsByTagName('li');
		var l = o.length;
		for(var i = 0; i < l; i++){
			var v = o[i].id.indexOf(search.toLowerCase());
			if(v == 0){	
				if(version == 'mobile') {	
					if(wp == true) {				
						$('#number-ul').animate({
							scrollTop: $('#'+o[i].id).offset().top - 50
						}, 1000);									
					}
					else {
						$('html, body').animate({
							scrollTop: $('#'+o[i].id).offset().top - 50
						}, 1000);
					}
				}
				if(version == 'pc') {
					$('#route-content').animate({
						scrollTop: $('#'+o[i].id).offset().top - 50
					}, 1000);
				}			
				return false;
			}
		}
	}
}

function togglePaymentInfo(id) {
	if($('#'+id).hasClass('hidden')) {
		$('#'+id).removeClass('hidden');
	}
	else {
		$('#'+id).addClass('hidden');
	}
}

function changeText(element) {
	if(element.innerHTML == 'Vis muligheder') {
		element.innerHTML = 'Skjul muligheder';
	}
	else if(element.innerHTML == 'Skjul muligheder') {
		element.innerHTML = 'Vis muligheder';
	}
	
	if(element.innerHTML == '- Mere info') {
		element.innerHTML = '- Skjul info';
	}
	else if(element.innerHTML == '- Skjul info') {
		element.innerHTML = '- Mere info';
	}
	if(element.innerHTML == 'Vis') {
		element.innerHTML = 'Skjul';
	}
	else if(element.innerHTML == 'Skjul') {
		element.innerHTML = 'Vis';
	}
}

function getHouseNumber() {
	$('#confirm-btn').unbind('click');
	$('#address-search').addClass('hidden');
	$('#number-search').removeClass('hidden');
	
	$('#confirm-btn').on('click', function() {
		confirmSelection('number');
	});
	
	$('.search').val('');
	$('#search').attr('onchange', 'searchNumber()');
	$('#search-button').attr('onclick', 'searchNumber()');

	$.ajax({
	  type: "GET",
	  url: "http://webapi.aws.dk/adresser.json?vejnavn="+encodeURIComponent(selectedAddress[direction])+"&kommunekode=0461",
	  dataType: "jsonp"
	})
	.done(function(data){
		$("#number-ul").html("");
		
		$("#number-ul").append('<li id="intet-nummer" data-value="'+coords[direction]+'" class="list-object" onclick="selectObject(this,\'number\');">Intet nummer</li>');
		
		data.sort(function(a, b) { 
		  var re = /\D/g;
		  return (parseInt(a.husnr.replace(re, ""), 10) - parseInt(b.husnr.replace(re, ""), 10));
		});
		
		$(data).each(function(i){
			if(data[i].wgs84koordinat !== undefined){
				$("#number-ul").append('<li id="'+data[i].husnr+'" data-value="'+data[i].wgs84koordinat.bredde+','+data[i].wgs84koordinat.længde+'" class="list-object" onclick="selectObject(this,\'number\');">'+data[i].husnr+'</li>');
			}
		});
	});
}

function routeToInfo(name, lat, lng) {
	coords['end'] = lat+','+lng;
	$.ajax({
		type: "GET",
		url: "http://webapi.aws.dk/adresser/"+coords['end']+".json",
		dataType: "jsonp",
	})
	.done(function(data) {
		selectedAddress['end'] = name+' ('+data.vejnavn.navn+' '+data.husnr+')';
		$('#route-end').html(selectedAddress['end']);
	});
}

/*CALCULATE ROUTE*/
function calculateRoute() {
	if(routeProvider == 'routeOdense') {
		if($('#route-'+direction).html() == 'Min position (Tryk for at ændre)' || $('#route-'+direction).html() == 'Min position') {
			locateUser();
		}
		else {
			map.off('click', toggleRoutePopup);
			map.off('click', resizeMapCanvas);
			setTimeout(function() {
				if(mapMarker != undefined) {
					map.removeLayer(mapMarker);
				}		
				drawRoute(coords['start'], coords['end']);
				toggleRoutePopup();
				addToRouteHistory();
			
			}, 600);
		}
	}
	else if(routeProvider == 'routeGoogle') {
		if($('#route-'+direction).html() == 'Min position (Tryk for at ændre)' || $('#route-'+direction).html() == 'Min position') {
			if(direction == 'start') {
				window.open('https://maps.google.com?saddr=Current-Location&daddr='+coords["end"]);
			}
			else if(direction == 'end') {
				window.open('https://maps.google.com?saddr='+coords["start"]+'&daddr=Current-Location');
			}		
		}
		else {
			window.open('https://maps.google.com?saddr='+coords["start"]+'&daddr='+coords["end"]);
		}
	}
}

/*SAVE TO HISTORY*/
function addToRouteHistory() {
	if(!localStorage.getItem("history")) {
		var firstContent = '{"list": [{"address": "'+selectedAddress[direction]+'", "number": "'+selectedNumber[direction]+'", "coords": "'+coords[direction]+'"}]}';
		localStorage.setItem("history", firstContent);
	}
	else {
		var content = localStorage.getItem("history");
		if(content.search(coords[direction]) == -1) {
			var newContent = content.replace(']}', ',{"address": "'+selectedAddress[direction]+'", "number": "'+selectedNumber[direction]+'", "coords": "'+coords[direction]+'"}]}');
			localStorage.setItem("history", newContent);
		}
	}	
	loadHistory();
}

/*LOAD HISTORY*/
function loadHistory() {
	$('#history-ul').html('');
	if(localStorage.getItem("history")) {
		var history = JSON.parse(localStorage.getItem("history"));
		history.list.reverse();
		for(var i in history.list) {
			var id = history.list[i].address+' '+history.list[i].number+'historik';
			var idRefined = id.replace(/\s+/g, '');
			var object = '<li id="'+idRefined+'" class="list-object" data-value="'+history.list[i].coords+'" onclick="selectObject(this,\'place\');">'+history.list[i].address+' '+history.list[i].number+'</li>';
			$('#history-ul').append(object);
		}
	}
}

/*USE POSITION FOR ROUTE*/
function locateUser() {
	if(version == 'mobile') {
		loading('Finder position...');
		$('#spinner-div').css("height", "200");
		$('#position-error').removeClass('hidden');
		locationRoute = navigator.geolocation.watchPosition(userLocated, gpsError, { maximumAge: 1000, timeout: 10000, enableHighAccuracy: true });
	}
	else {
		locationRoute = navigator.geolocation.watchPosition(userLocated, gpsError, { maximumAge: 1000, timeout: 10000, enableHighAccuracy: true });
	}
}

function userLocated(position) {
	map.off('click', toggleRoutePopup);
	map.off('click', resizeMapCanvas);
	toggleRoutePopup();
	if(version == 'mobile') {
		if(position.coords.accuracy <= 10) {
			loading();
			$('#spinner-div').css("height", "100");
			$('#position-error').addClass('hidden');
			coords[direction] = [position.coords.latitude, position.coords.longitude];
			navigator.geolocation.clearWatch(locationRoute);
			setTimeout(function() {
				drawRoute(coords['start'], coords['end']);	
			}, 500);	
		}
	}
	else {
		coords[direction] = [position.coords.latitude, position.coords.longitude];
		navigator.geolocation.clearWatch(locationRoute);
		setTimeout(function() {
			drawRoute(coords['start'], coords['end']);	
		}, 500);	
	}
}

function cancelGPS() {
	navigator.geolocation.clearWatch(locationRoute);
	loading();
	$('#spinner-div').css("height", "100");
	$('#position-error').addClass('hidden');
}

function gpsError(error) {
	switch(error.code) {
		case error.PERMISSION_DENIED:
			alert('Fejl, brugeren accepterede ikke lokations forespørgelsen');
			break;
		case error.POSITION_UNAVAILABLE:
			alert('Din position er ikke tilgængelig på nuværende tidspunkt. Prøv igen');
			break;
		case error.UNKNOWN_ERROR:
			alert('Der opstod en ukendt fejl');
			break;
	}
}

/*IMAGES*/
function toggleParkingImg() {
	if($('#parking-img').hasClass('parking-img-open')) {
		$('#parking-img').removeClass('parking-img-open');
		$('#parking-img-toggle').html('+');
		$('.leaflet-control-zoom').removeClass('hidden');
	}
	else {
		$('#parking-img').addClass('parking-img-open');
		$('#parking-img-toggle').html('-');
		$('.leaflet-control-zoom').addClass('hidden');
	}
}

/*ERROR REPORT PARKINGSPACE*/
function errorReport(id) {
	//toggleParkPopup();
	toggleOverlayPage('contact');
	$('#contact-parkingspot-div').removeClass('hidden');
	$('#contact-parkingspot').html(id);
}

function sendErrorReport() {
	var parkingId = '';
	var msg;
	var email;
	var useragent = '';
	
	if(!$('#contact-parkingspot-div').hasClass('hidden')) {
		parkingId = $('#contact-parkingspot').html();
	}
	
	$('label[for="msg-content"]').removeClass('text-error').html('Besked');
	$('#msg-content').removeClass('error'); 
	$('label[for="msg-email"]').removeClass('text-error').html('Email');
	$('#msg-email').removeClass('error'); 
	
	msg = $('#msg-content').val();
	email = $('#msg-email').val();
	useragent += "<p>Browser Version: " + navigator.appVersion + "</p>";
	useragent += "<p>Cookies Enabled: " + navigator.cookieEnabled + "</p>";
	useragent += "<p>Browser Language: " + navigator.language + "</p>";
	useragent += "<p>Platform: " + navigator.platform + "</p>";
	useragent += "<p>User-agent header: " + navigator.userAgent + "</p>";
	
	var atpos=email.indexOf("@");
	var dotpos=email.lastIndexOf(".");
	
	if(msg == '') {
		$('label[for="msg-content"]').addClass('text-error').html('Indtast venligst din besked');
		$('#msg-content').addClass('error'); 
	}
	else if (atpos<1 || dotpos<atpos+2 || dotpos+2>=email.length) {
		$('label[for="msg-email"]').addClass('text-error').html('Indtast venligst en gyldig email');
		$('#msg-email').addClass('error'); 
	}
	else {
		$('#contact-btn').removeClass('blue');
		$('#contact-btn').addClass('green');
		$('#contact-btn').css("width", "90%");
		$('#contact-btn').html('Din besked blev sendt, tryk her for at lukke');
		$('#contact-btn').attr("onclick", "toggleOverlayPage('contact'), resetContactPage()");
		alert('Sendt');
	}
}

function resetContactPage() {
	setTimeout(function() {
		$('label[for="msg-content"]').html('Besked');
		$('label[for="msg-email"]').html('Email');
		$('#msg-content').val('');
		$('#contact-btn').removeClass('green');
		$('#contact-btn').addClass('blue');
		$('#contact-btn').css("width", "100");
		$('#contact-btn').html('Send besked');
		$('#contact-btn').attr("onclick", "sendErrorReport()");
	}, 1000);
}

/*INFO PAGE*/
function toggleInfoPage() {
	if($('#info-page').hasClass('info-open')) {
		$('#menu-bg').addClass('hidden');
		$('#info-page').removeClass('info-open');
		$('#info-page').addClass('info-closed');
		setTimeout(function() {
			$('#info-page').addClass('hidden');
		}, 700);
	}
	else {
		$('#info-content').html('');
		switch(readout) {
			case "available":
				$('#info-content').load('content/info-available.html');
				break;
			case "max":
				$('#info-content').load('content/info-total.html');
				break;
			case "price":
				$('#info-content').load('content/info-price.html');
				break;
			case "payperiod":
				$('#info-content').load('content/info-payperiod.html');
				break;
			case "type":
				$('#info-content').load('content/info-type.html');
				break;			
		}
			
		$('#info-page').removeClass('hidden');
		$('#info-page').removeClass('info-closed');
		$('#menu-bg').removeClass('hidden');
		setTimeout(function() {
			$('#info-page').addClass('info-open');
		}, 200);
	}
}

/*GEOLOCATION*/
function locate() {
	watchId = navigator.geolocation.watchPosition(centerPosition, gpsError, { maximumAge: 1000, timeout: 10000, enableHighAccuracy: true });
	$('#locate-btn').attr('onclick', 'stopLocate()');
	$('#locate-btn').css("background-image", "url('img/icons/ic_gps_fixed_white_18dp.png')");
}

function centerPosition(position) {	
	var zoom = map.getZoom();	
	map.setView([position.coords.latitude, position.coords.longitude], zoom);
	if(activeGps == false) {	
		posCircle = L.circleMarker([position.coords.latitude, position.coords.longitude]).addTo(map);
		posRadius = L.circleMarker([position.coords.latitude, position.coords.longitude], position.coords.accuracy).addTo(map);
		activeGps = true;
	}
	else {
		posCircle.setLatLng([position.coords.latitude, position.coords.longitude]);
		posRadius.setRadius(position.coords.accuracy);
	}
}

function stopLocate() {
	navigator.geolocation.clearWatch(watchId);
	activeGps = false;
	map.removeLayer(posCircle);
	map.removeLayer(posRadius);
	$('#locate-btn').attr('onclick', 'locate()');
	$('#locate-btn').css("background-image", "url('img/icons/ic_gps_not_fixed_white_18dp.png')");
}

function loading(text) {
	if($('#spinner-bg').hasClass('hidden')) {
		$('#spinner-bg, #spinner-div').removeClass('hidden');
		$('#spinner-text').html(text);
	}
	else {
		$('#spinner-bg, #spinner-div').addClass('hidden');
	}
}

/*SETTINGS*/
function loadSettings() {
	/*LOAD SETTINGS*/
	if(localStorage.getItem("defaultReadout") == 'last') {
		if(localStorage.getItem("readout") != null) {
			readout = localStorage.getItem("readout");
			$('#'+localStorage.getItem("readout")).prop("checked", true);
		}
	}
	else {
		if(localStorage.getItem("defaultReadout") != null) {
			readout = localStorage.getItem("defaultReadout");
			$('#'+readout).prop("checked", true);
			$('#settings'+readout).prop("checked", true);
		}
	}
	
	if( localStorage.getItem("routeProvider") != null) {
		routeProvider = localStorage.getItem("routeProvider");
		$('#'+routeProvider).prop("checked", true);
	}
	
	var handicapSettings = $("fieldset").find(".settingCheckbox");

	for(var i = 0; i < handicapSettings.length; i++) {
			
		var checked = localStorage.getItem(handicapSettings[i].id);

		if(checked == "true") {
			$('#'+handicapSettings[i].id).prop("checked", true);
		}
		else if(checked == "false") {
			$('#'+handicapSettings[i].id).prop("checked", false);	
		}
	}
	
	/*LOAD FILTER SETTINGS*/
	var filters = $("fieldset").find(".filter");

	for(var i = 0; i < filters.length; i++) {
		var checked = localStorage.getItem(filters[i].id);

		if(checked == "true") {
			$('#'+filters[i].id).prop("checked", true);
		}
		else if(checked == "false") {
			$('#'+filters[i].id).prop("checked", false);	
		}
		else if(checked == undefined) {
			localStorage.setItem(filters[i].id, $(filters[i]).is(":checked"));
		}
	}
	updateIconsFilter();
}

/*SETTINGS UPDATE*/
function updateSetting(element) {
	if($('#'+element.id).hasClass('settingRadio')) {
		localStorage.setItem("defaultReadout", element.value);
	}	
	else if($('#'+element.id).hasClass('routeProvider')) {
		localStorage.setItem("routeProvider", element.value);
		routeProvider = element.value;
	}
	else if($(element).hasClass('settingCheckbox')) {	
		localStorage.setItem(element.id, $(element).is(":checked"));
	}
}

/*READOUT UPDATE*/
function updateReadoutSettings(element) {
	localStorage.setItem("readout", element.value);
	readout = element.value;
	updateIconsReadout();
}

/*FILTER UPDATE*/
function updateFilterSettings(element) {
	localStorage.setItem(element.id, $(element).is(":checked"));
	updateIconsFilter();
}