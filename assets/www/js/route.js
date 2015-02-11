function drawRoute(startpoint, endpoint) {
	var c = '';
	var n = 1;
	var error = 'none';
	var firstCoords = new Array();
	$.ajax({	
	type: "GET",
		url: "http://apps.odense.dk/routeplanner/rwnetserver.php?network="+n+"&via="+startpoint+";"+endpoint+"&routetype=SETFASTEST",
		dataType: "xml"
	})
		.done(function(data) {
		if(data == null){
			error = 'Kan ikke beregne rute. Vi er måske ved at opdatere rutenetværket. Hvis problemet fortsætter så tip os venligst';
			var values = {
				error: error
			}	
			//return values;
			drawStuffOnMap(values, map);
		}
		else{
			var t = $(data).find('_SHAPE_');
			var name = data.getElementsByTagName('Name');
			var dist = data.getElementsByTagName('Dist');
			var tdist = data.getElementsByTagName('TotalDist');
			var totaltime = data.getElementsByTagName('TotalTime');
			var turn = data.getElementsByTagName('Turn');
			var test = document.getElementById('test');
			
			var sd = new Array();
			
			var fd  = (Math.round($(tdist[name.length - 1]).text() * 10 ) / 10);
			var tt = 0;
			if(n > 4){
				if(!speed){
					speed = 1;
				}
				
				//Math.ceil((fd/parseInt(speed)) * 60);
				
				tt = Math.ceil($(totaltime[name.length - 1]).text());
				
				tt = Math.ceil(tt * speedArray[speed]);
				
			}
			else{
				tt = Math.ceil($(totaltime[name.length - 1]).text());
			}
			
			var fullDesc = '';
			
			
			sd.push('Start på '+$(name[0]).text());
			
			fullDesc += '<div style="margin: 5px 0 5px 0; overflow: auto;"><img src="img/desc_start.png"> Start på '+$(name[0]).text()+' </div>';
			
			for(var i = 0; i < name.length; i++){
				var rt = $(t[i]).find('MultiLineString').find('lineStringMember').find('LineString').find('coordinates');
				
				var rie = rt.context.textContent || rt.context.text;
				
				var r = rie.split(" ");
				
				var meter = parseInt($(dist[i]).text() * 1000);
				
				var turn2 = '';
				
				if($(turn[i]).text() >= 0 && $(turn[i]).text() <= 22){
					sd.push('Efter '+meter+'m: Kør lige ud ad '+$(name[i+1]).text());
					turn2 = '<img src="img/straightahead_small.png"> Efter '+meter+'m: Kør lige ud ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() >= 23 && $(turn[i]).text() <= 67){
					sd.push('Efter '+meter+'m: Lille sving til venstre ad '+$(name[i+1]).text());
					turn2 = '<img src="img/right_small.png"> Efter '+meter+'m: Lille sving til venstre ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() >= 68 && $(turn[i]).text() <= 112){
					sd.push('Efter '+meter+'m: Drej til venstre ad '+$(name[i+1]).text());
					turn2 = '<img src="img/left_small.png"> Efter '+meter+'m: Drej til venstre ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() >= 113 && $(turn[i]).text() <= 157){
					sd.push('Efter '+meter+'m: Skarpt sving til venstre ad '+$(name[i+1]).text());
					turn2 = '<img src="img/left_small.png"> Efter '+meter+'m: Skarpt sving til venstre ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() >= 158 && $(turn[i]).text() <= 202){
					sd.push('U-sving');
					turn2 = 'U-sving';
				}
				else if($(turn[i]).text() >= 203 && $(turn[i]).text() <= 247){
					sd.push('Efter '+meter+'m: Skarpt sving til højre ad '+$(name[i+1]).text());
					turn2 = '<img src="img/right_small.png"> Efter '+meter+'m: Skarpt sving til højre ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() >= 248 && $(turn[i]).text() <= 292){
					sd.push('Efter '+meter+'m: Drej til højre ad '+$(name[i+1]).text());
					turn2 = '<img src="img/right_small.png"> Efter '+meter+'m: Drej til højre ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() >= 293 && $(turn[i]).text() <= 337){
					sd.push('Efter '+meter+'m: Lille sving til højre ad '+$(name[i+1]).text());
					turn2 = '<img src="img/right_small.png"> Efter '+meter+'m: Lille sving til højre ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() >= 338 && $(turn[i]).text() <= 359){
					sd.push('Efter '+meter+'m: Kør lige ud ad '+$(name[i+1]).text());
					turn2 = '<img src="img/straightahead_small.png"> Efter '+meter+'m: Kør lige ud ad '+$(name[i+1]).text();
				}
				else if($(turn[i]).text() > 360){
					sd.push('Tag udkørsel nr. '+($(turn[i]).text() - 360)+' i rundkørslen');
					turn2 = 'Tag udkørsel nr. '+($(turn[i]).text() - 360)+' i rundkørslen';
				}
				else if($(turn[i]).text() == -3){
					sd.push('Du er ankommet til din destination');
					turn2 = '<img src="img/desc_end.png"> Du er ankommet til din destination';
				}
				
				
				var imeter = $(tdist[i]).text() * 1000;
				
				var evenrow = '';
				
				if((i%2) == 0){
					evenrow = 'background-color: #eeeeee';
				}
				
				//$('.'+map+' .desc').append('<div style="margin: 5px 0 5px 0; overflow: auto; '+evenrow+'">'+turn2+' (i alt '+parseInt(imeter)+'m)');
				fullDesc += '<div style="margin: 5px 0 5px 0; overflow: auto; '+evenrow+'">'+turn2+' (i alt '+parseInt(imeter)+'m)</div>';			
				
				if(i == 0){
					if(r[i] != undefined){
						var m_start = r[i].split(',');
					}
					
				}
						
				for(var a = 0; a < r.length; a++){
					if(r[a] != '' && r[a+1] != undefined){
						c += r[a] + '],[';
					}
					//Det første punkt i hvert linjestykke
					if(a == 0){
						var coords = r[a].split(',');
						coords[0] = parseFloat(coords[0]);
						coords[1] = parseFloat(coords[1]);
						var center = coords.reverse();
						firstCoords.push(center);
					}	
				}
				if(t[i] == t[t.length - 1]){
					var m_end = r[r.length - 2].split(',');
				//	var coords = r[a].split(',');
					m_end[0] = parseFloat(m_end[0]);
					m_end[1] = parseFloat(m_end[1]);
					var coords = m_end;					
					firstCoords.push(coords);					
				}				
			}
			
			route = '{"type":"Feature","properties": {"name": "rute"},"geometry": {"type": "LineString","coordinates":[['+c+']]';
			route = route.substring(0, route.length - 4);
			route += ']}}';
			
			route = JSON.parse(route);
			
			var values = {
				route: route,
				startcoords: m_start,
				endcoords: m_end,
				simpledescription: sd,
				fulldescription: fullDesc,
				km: fd,
				time: tt,
				network: n,
				error: error,
				firstCoords: firstCoords
			}
	
			drawStuffOnMap(values);
		}
	});
}

function drawStuffOnMap(values) {
	var routeLine = values.route;
	routeLayer = L.featureGroup();
	routeData = values;
	
	var startCoords = values.startcoords.reverse();
	var endCoords = values.endcoords.reverse();
	
	startMarker = L.marker(startCoords, {icon: startIcon, draggable: false});
	endMarker = L.marker(endCoords, {icon: endIcon, draggable: false});
	
	map.addLayer(startMarker);
	map.addLayer(endMarker);
	
	routeLine = L.geoJson(routeLine, {style: {"color":"rgb(0,180,215)", "opacity": 0.8}});
	
	routeLayer.addLayer(routeLine);
	map.fitBounds(routeLayer);
	
	map.addLayer(routeLayer);
	toggleRouteDescription();
}