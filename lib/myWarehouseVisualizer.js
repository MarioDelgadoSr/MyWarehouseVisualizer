//My Warehouse Visualizer	
const appVersion = "1.1";																											
var timeOutVar = null;																												//Used by Color Scale Slider and mdvScales		

var pstyle = 'background-color: #F5F6F7; border: 1px solid #dfdfdf; padding: 5px;';   												//Panel styling		
	
var languageIndex = 0;																												//Initially set to English(0)

var parentLayout, appLayout; 																										//Global Reference to Application Layout child to parentLayout

var appWarehouses = [{warehouseName:"Upload..."},{warehouseName:"CSV URLs..."}];													//Array of objects for demo and uploaded visuals

var initalBackgroundColor = "#d9dccb";		
var edgeMaterial;

$(document).ready(function(){

	warehouseList.forEach(function(warehouse){  																					//demos	
			
		appWarehouses.push({	
								warehouseName: warehouse,
								layoutData: null,
								inventoryData: null 

							});
		
	});
	
	$(document.body).css({"margin":"0px", "position": "absolute", width: "100%", "height": "100%"});																								// https://github.com/vitmalina/w2ui/issues/105#issuecomment-17793381
	var appDiv = $(document.createElement("div"))																					// Work around: https://github.com/vitmalina/w2ui/issues/1844
		.css({"position": "absolute", width: "100%", "height": "100%"})
		.appendTo(document.body); 
	
	
	parentLayout = 
		$().w2layout(																											
				{	
					name: "parentLayout",
					box: appDiv,
					panels: 
					  [																											
						{ type: 'main', size: "100%", resizable: false, style: pstyle, 
							toolbar: {	
								items:[	
									{ type: "menu-radio", id: "warehouse", tooltip: "Select Warehouse",
									  items: appWarehouses.map (function (appVisual, index) { return { id: index, text: appVisual.warehouseName} }),
									  //Find index programmatically with: w2ui.parentLayout.get("main").toolbar.items.find(function(item){return item.id == "warehouse"}).selected
									  selected: -1,
									  lastSelected: -1,	
									  text: function (item){
												return "Warehouse: " + (item.selected <= 0 ? "" : item.items[item.selected].text);
											}
									},
									{type: 'break'},									
									{type: "button", id:"toggleAnalyzer", tooltip: "Show/hide Inventory Grid", text:"Toggle Inventory Grid"},										
									{type: 'break'},									
									{type: "button", id:"toggleVisualGrid", tooltip: "Show/hide Warehouse Layout Grid", text:"Toggle Warehouse Layout Grid"},	
									{type: 'break'},						
									{ type: "menu-radio", id: "language", tooltip: "Select Language",
									  items: languages.map(function (language,index) { return {id: index ,text: language.text, tooltip: language.tooltip} }),  
									  //Find index programmatically with: w2ui.parentLayout.get("main").toolbar.items.find(function(item){return item.id == "warehouse"}).selected
									  selected: languageIndex,
									  text: function (item){
												return "Language: " + item.items[item.selected].text;
											}	
									},
									{type: 'break'},
									{ type: "menu", id: "Help", text: fnGetTranslatedText, tooltip: "Help",
									  items: [
											{ id: "documentation", text: "Documentation"},									  
											{ id: "quickKeys", text: "Quick Keys"},
											{ id: "webgl", text: "WebGL"},
											{ id: "gltf", text: "glTF"},
											{ id: "threejs", text: "three.js"},
											{ id: "d3js", text: "d3.js"},
											{ id: "w2ui", text: "w2ui"},
											{ id: "about",     text: translate("About")}
									   ]	
									}
								],
								onClick: function(event){
									event.done( function () {
									
										var aTargets = event.target.split(":");
										if (aTargets.length == 1 && ["upload", "toggleVisualGrid", "toggleAnalyzer"].indexOf(aTargets[0]) == -1) return; //Menu, not menu item, clicked on option
										switch(aTargets[0]) {
	
											case "warehouse":   //Find programmatically with: w2ui.toolbar.items.find(function(item) {return item.id == "warehouse"}).selected

												var vDropDown = this.items.find(function(item){return item.id == "warehouse"});
												var selected = vDropDown.selected;
												if (vDropDown.selected <= 1){ 
													vDropDown.selected = vDropDown.lastSelected;
													vDropDown.lastSelected = selected;
													switch(selected){
														case -1:
														case  0:
															fnGetFileUploads();
															break;
														case  1:
															fnGetCsvUrls();
															break;
													} //switch
												} //if 
												else {
													w2utils.lock(document.body, { spinner: true, opacity : 0 });
													vDropDown.lastSelected = selected;
													vDropDown.text = "Warehouse: " + vDropDown.items[selected].text;
													fnShowMyWarehouseVisualizerDemo();
												} //else
												break;													
												
											case "toggleVisualGrid":
											
												var mainPanel = this.owner.get("main").content;

												if (mainPanel.get("preview").mdvPreHideSize) {
													
													mainPanel.sizeTo("preview",mainPanel.get("preview").mdvPreHideSize);				//Must operate on preview, not main (bug)
													mainPanel.sizeTo("left",mainPanel.get("left").mdvPreHideSize);
													delete mainPanel.get("preview").mdvPreHideSize;										
													delete mainPanel.get("left").mdvPreHideSize;										//Handling final sizing of preview
												
												} //if
												else {
												
													mainPanel.get("preview").mdvPreHideSize = mainPanel.get("preview").size;
													mainPanel.get("left").mdvPreHideSize = mainPanel.get("left").size;
													mainPanel.sizeTo("preview","100%");	
												
												} //else
												
												break;	
					
											case "toggleAnalyzer":
											
												var mainPanel = this.owner.get("main").content;
												
												if (!mainPanel.get("left").hidden)														//Handling final sizing of preview
													mainPanel.get("left").mdvPreHideSize = mainPanel.get("left").size;	
												
												mainPanel.toggle("left");
												
												if (!mainPanel.get("left").hidden) {													//Handling final sizing of preview
													
													mainPanel.sizeTo("left",mainPanel.get("left").mdvPreHideSize);
													delete mainPanel.get("left").mdvPreHideSize;		
												
												} //if
												
												break;	
											
											case "language":
											
												fnSetLanguageIndex(aTargets[1]);
												break;
											
											case "Help"	:
												
												switch (aTargets[1]){
													case "quickKeys":
													
														var helpText = translate("HelpText1") +  translate("HelpText2")  + translate("HelpText3") + translate("HelpText4");			  
														fnPopUp(document.body, translate("Help"),helpText,3,2.5);									
														break;
														
													case "about":
													
														fnPopUp(document.body, translate("AppTitle") + " (" + appVersion +")",translate("AboutText"),3,5);
														break;
													
													case "documentation":		
													case "webgl":
													case "gltf":
													case "threejs":
													case "d3js":
													case "w2ui":
															var links = { 
																		"documentation": "https://github.com/MarioDelgadoSr/MyWarehouseVisualizerDoc#my-warehouse-visualizer-documentation",																																																																					
																		"webgl": "https://en.wikipedia.org/wiki/WebGL",
																		"gltf" : "https://www.khronos.org/gltf/",
																		"threejs": "https://threejs.org/",
																		"d3js": "https://d3js.org/",
																		"w2ui": "http://w2ui.com/"
																		};	
															window.open(links[aTargets[1]],"_blank"); 
														break;
												
												} //switch
												break;
									
									} //switch
										
										//Display pop-up Window
										function fnPopUp(appContainer, title,html,wf,hf){ 
										
											var width = $(appContainer).width() == 0 ? appContainer.parentElement.clientWidth :  $(appContainer).width();
											var height = $(appContainer).height() == 0 ? appContainer.parentElement.clientHeight :  $(appContainer).height();	
											
											w2popup.open({	title: title,
															body: html,
															buttons   : '<button onclick="w2popup.close();">' + translate("PopUpClose") + '</button>',	
															showMax: false,
															showClose: true,
															width: width/wf,
															height: height/hf,
															modal: false
														 });
										} // fnPopUp	
										
									}); // event.done
									
								} //onClick
							} //toolbar
						}  //main											
							
					], //panels
					onRender: function(event){event.done(function(event){ fnShowMyWarehouseVisualizerDemo(); });}
				}					
			); //parentLayout
			
			
	parentLayout.get("main").toolbar.tooltip = "top|right";																				// http://w2ui.com/web/docs/1.5/w2toolbar.tooltip
	parentLayout.render();   																											//onRender event continues with fnShowMyWarehouseVisualizerDemo()

}); //document ready
		
function fnShowMyWarehouseVisualizerDemo(){
	
	if (appLayout) 
		appLayout.destroy();
		
	var warehouseIndex = parentLayout.get("main").toolbar.items.find(function(item){return item.id == "warehouse"}).selected;
	
	if (warehouseIndex <= 0){   																										//Show Demo Instructions
		
		parentLayout.content("main", "<div id='demoInstructions'></div");
		$("#demoInstructions").load("demoInstructions.html");
		parentLayout.get("main").toolbar.disable("toggleAnalyzer");			
		parentLayout.get("main").toolbar.disable("toggleVisualGrid");																											
		return;
		
	}
	
	var warehouseName =  appWarehouses[warehouseIndex].warehouseName;
	
	if (!appWarehouses[warehouseIndex].layoutData){
	
		d3.csv( "data/" + warehouseName + "/layout.csv", fnParse ) //https://github.com/d3/d3-fetch#csv
		.then(function(layoutData){
			
			var warehouseScene =  {scene: fnBuildWarehouse(layoutData)};
			if (warehouseScene){
				
				fnLoadWarehouseData(warehouseName, warehouseScene, layoutData);	
				
			} //if
			
		});
		//.catch(function (error){
		//	w2alert("Error Loading File: " + "data/" + warehouseName + "/layout.csv");
		//	return;
		//});
		

		function fnLoadWarehouseData(warehouseName, warehouseScene, layoutData){
		
			d3.csv( "data/" + warehouseName + "/inventory.csv", fnParse ) //https://github.com/d3/d3-fetch#csv
			.then(function(inventoryData){
				
				fnShowWarehouse(warehouseName, warehouseScene, inventoryData, layoutData);
				
			});
			
			
		} // fnLoadWarehouseData
	
	} //ifnewRow
	else {
		
		var warehouseScene =  {scene: fnBuildWarehouse(appWarehouses[warehouseIndex].layoutData)};
		if (warehouseScene){
			
			fnShowWarehouse(warehouseName, warehouseScene, appWarehouses[warehouseIndex].inventoryData, appWarehouses[warehouseIndex].layoutData);
			
		} //if
		
	} //else
	
	
	function fnShowWarehouse(warehouseName, warehouseScene, inventoryData, layoutData){ 
	
		//var gltfURL = appWarehouses[warehouseIndex].blob ? URL.createObjectURL(appWarehouses[warehouseIndex].blob) : appWarehouses[warehouseIndex].url;
		//var warehouseData = appWarehouses[warehouseIndex].data ? $.extend(true,[],appWarehouses[warehouseIndex].data) : null;  //Deep, unique clone of data
	
			
		var warehouseVisual =  new dataVisual();	
		
		warehouseVisual.warehouseName = warehouseName;	
		warehouseVisual.layoutData =  layoutData;
		
		if (inventoryData) {	
		
			var dataKey =  Object.keys(inventoryData[0])[0]; //Always first column for both data and layout    		
			const visualKey = "name";						 //Assigned name when scene was built
						
			warehouseVisual.joinDataToVisual( inventoryData, warehouseScene, dataKey, visualKey); 			//warehouseVisual.joinDataToVisual(gltfDataFromFile);  //testing with no data	
		
			//Pallets are created opaque...they're dependent on actual inventory.  Join takes care of that logic.
			warehouseVisual.join.forEach( (join) => {join.visualObj.children[1].material.opacity =  1;}  ); //children[1] == pallet
		
		
		} //if


		warehouseVisual.selectionLinks = [];
					
		
		var container = typeof(parentLayout) != 'undefined' ? parentLayout : 								//Container can be a div or layout.  If layout, app placed in 'main' panel
						$(document.createElement("div"))
								.appendTo($(document.body).css({"margin":"0px"})); 							//Layout Height Design Pattern: https://github.com/vitmalina/w2ui/issues/105 
	

		
		appLayout = new applicationLayout();
		appLayout.display(container, warehouseVisual);															
		
		var vDropDown = parentLayout.get("main").toolbar.items.find(function(item){return item.id == "warehouse"});
		vDropDown.text = "Warehouse: " + warehouseVisual.warehouseName;
		parentLayout.get("main").toolbar.refresh();

	} //fnShowWarehouse
	
	//Build a Three.js group of warehouse slots. 
    //Discussion on Model, View and Projection matrices: http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/#the-model-view-and-projection-matrices	
	//The slot geomemtry verticies are built using provided x,y,z,width,depth,height,color and meshType (wire/flat) attributes into the properties' 'group';
	function fnBuildWarehouse(layoutData) {
	
		var warehouse = new THREE.Group();  															//Containing the whole image allows for possible complete transforms later
		warehouse.name = "warehouseGroup";
																										//In Threejs space, image is laid out relative to 0,0,0		

		var uniqueMaterial = [];																		//arrays to optimize/reuse material and geometry
		var uniqueGeometry = [];
		
		var geometriesMap = new Map();																	//https://www.cloudhadoop.com/2018/08/es6-map-class-tutorials-with-javascript.html
		//var edgeColor = new THREE.Color( 'white' );
		//edgeColor setup as a global so that it can be changed dynamically with Background color changes	
		edgeMaterial = new THREE.LineBasicMaterial( { color: fnGetBackGroundColorInvert(initalBackgroundColor), transparent: true, opacity: 0.2} ); // 0xffffff Can't control linewidth: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth				
	
		//Re-use unique geometries.
		//Related discussion: https://stackoverflow.com/questions/16820806/three-js-performance	
		for (var i = 0; i < layoutData.length; i++) {
				
				
				/* https://threejs.org/docs/index.html#api/en/geometries/BoxBufferGeometry
				   https://stackoverflow.com/questions/49956422/what-is-difference-between-boxbuffergeometry-vs-boxgeometry-in-three-js
				BoxBufferGeometry(width : Float, height : Float, depth : Float, widthSegments : Integer, heightSegments : Integer, depthSegments : Integer)

					width  Width of the sides on the X axis. Default is 1.
					height  Height of the sides on the Y axis. Default is 1.
					depth  Depth of the sides on the Z axis. Default is 1.
					widthSegments  Optional. Number of segmented faces along the width of the sides. Default is 1.
					heightSegments  Optional. Number of segmented faces along the height of the sides. Default is 1.
					depthSegments  Optional. Number of segmented faces along the depth of the sides. Default is 1. 
				
				*/		

				var geometryKey = 	layoutData[i]["WIDTH"] + ":" +
									layoutData[i]["HEIGHT"] + ":" +
									layoutData[i]["DEPTH"];

				
				if (geometriesMap.has(geometryKey)) {
					
					var geometries = geometriesMap.get(geometryKey);
					var cubeGeometry = geometries.cubeGeometry;
					var edgeGeometry = geometries.edgeGeometry;	
				
				} //if
				else {
				
					var cubeGeometry =   new THREE.BoxBufferGeometry(	layoutData[i]["WIDTH"],
																		layoutData[i]["HEIGHT"], 
																		layoutData[i]["DEPTH"]
																	); // the visual width(x-axis),height(y-axis) depth(z-axis)
					var edgeGeometry = 	 new THREE.EdgesGeometry( cubeGeometry ); //  https://stackoverflow.com/questions/31539130/display-wireframe-and-solid-color/31541369#31541369
					geometriesMap.set(geometryKey,{cubeGeometry: cubeGeometry, edgeGeometry: edgeGeometry});
				
				} //else
 				
				var cubeMaterial = new THREE.MeshBasicMaterial( {transparent: true,  wireframe: false});
						
				// https://stackoverflow.com/questions/41031214/javascript-threejs-3d-draw-solid-cubic-with-border		

				var edge = new THREE.LineSegments( edgeGeometry, edgeMaterial ); // Can't control linewidth: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth
				edge.renderOrder = 0; //https://threejs.org/docs/index.html#api/en/core/Object3D.renderOrder
				edge.userData.type = "edge";
				//edge.userData.opacity =  edge.material.opacity;
				//edge.userData.color = edge.material.color;
				//edge.userData.palletNum = 0;
				
				var pallet = new THREE.Mesh(cubeGeometry, cubeMaterial);
				pallet.material.opacity = 0.2;		//Initially not visible	needed for raycasting; can't raycast on invisible object
				//pallet.userData.opacity = 0;		//Initially not visible			
				//pallet.userData.palletNum = 0;	
				pallet.userData.type = "pallet";
				//pallet.userData.selected =  false;
				pallet.renderOrder = 1;
				//pallet.name = layoutData[i][Object.keys(layoutData[i])[0]];   //First column should always be the key				
				
				
				var slot = new THREE.Group();					
				slot.add(edge);				// child[0]		
				slot.add(pallet);		// child[1]		

				slot.name = layoutData[i][Object.keys(layoutData[i])[0]];		//.name is used as unique key for getObjectByName method. Eg: properties.warehouseGroup.getObjectByName("someName")
				//Translatiing slot warehouse coordinates to WebGL screen coordinates
				slot.position.x = layoutData[i]["X"] + (layoutData[i]["WIDTH"] / 2)  ; 
				slot.position.y = layoutData[i]["Z"] + (layoutData[i]["HEIGHT"] / 2); 								
				slot.position.z =  layoutData[i]["Y"] + (layoutData[i]["DEPTH"] / 2);  
				slot.userData.aisle = layoutData[i]["AISLE"];
				slot.userData.aisleSide = layoutData[i]["AISLESIDE"];
				slot.userData.centerAxis = layoutData[i]["CENTERAXIS"]
				slot.userData.bay = layoutData[i]["BAY"];
				slot.userData.type = "slot"; 
				slot.userData.numPallets = 1;
				slot.userData.selected = false;
			
				warehouse.add(slot);
				
				layoutData[i].visualObj = slot;  //Reference to the visualObj
								
		} //for
		
		return warehouse;
		
	} //fnBuildWarehouse	
	

} //fnShowMyDataVisualizer	

function fnSetLanguageIndex(newIndex){
	
	languageIndex = parseInt(newIndex);
	parentLayout.refresh();	
	
} // setLanguageIndex	

function fnGetFileUploads(){

	w2popup.load({
				width   : $(document.body).width() * .9,
				height  : $(document.body).height() * .9,
				style	: 'background-color: white;',
				title   : 'Upload',
				modal:    true,
				url: 	  'fileUpload.html',
				onOpen:  function(event){event.done(function(event){fnSetUploadHandlers()}); },	
				onClose:  function(){window.clearInterval(timeOutVar)},
				buttons : '<button class="w2ui-btn" onclick="w2popup.close()">Cancel</button>'
			});		
							
	function fnSetUploadHandlers(){
		
	//https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
	//https://www.frontendjournal.com/javascript-es6-learn-important-features-in-a-few-minutes/
	
	// ************************ Drag and drop ***************** //
	let dropArea = $("#drop-area");		
		dropArea.on("dragenter dragover dragleave drop",(event) => {event.preventDefault(); event.stopPropagation(); });						
		dropArea.on("dragenter dragover", () => {dropArea.addClass('highlight')});
		dropArea.on("dragleave drop", () => {dropArea.removeClass('highlight')});
		
	dropArea.on("drop",fnHandleFileUploads);  
	
	fnSetPredefinedScales();	
	
	} //fnSetUploadHandlers

} //fnGetFileUploads

function fnGetCsvUrls(){

	w2popup.load({
				width   : $(document.body).width() * .9,
				height  : $(document.body).height() * .6,
				style	: 'background-color: white;',
				title   : 'URLs for Layout and Inventory Data in CSV Format',
				modal:    true,
				url: 	  'csvUrls.html',
				onOpen:  function(event){event.done(function(event){fnSetPredefinedScales()}); },	
				onClose:  function(){window.clearInterval(timeOutVar)},
				buttons : '<button class="w2ui-btn" onclick="fnHandleCsvUrls()">OK</button> <button class="w2ui-btn" onclick="w2popup.close()">Cancel</button>'
			});		
							

} //fnGetCsvUrls

function fnHandleFileUploads (event) {				
  
	//Edge issue with split operator: https://github.com/MicrosoftEdge/Status/issues/453
	//https://stackoverflow.com/questions/46671833/why-isnt-ms-edge-working-with-spread-element-and-queryselector
	//var files = [...event.originalEvent.dataTransfer.files]    //Spread operator: https://zendev.com/2018/05/09/understanding-spread-operator-in-javascript.html
	var files = Array.from(event.originalEvent.dataTransfer.files);
	
	if (files.length != 2) { 
		
		w2alert("Upload a Layout and Inventory file.");
		return;
	
	} 
	
	var csvLayoutFile  = files[0].name.toLowerCase().indexOf("layout") != -1 ? files[0] : files[1].name.toLowerCase().indexOf("layout") != -1 ? files[1] : null;

	var csvInventoryFile = files[0] == csvLayoutFile ? (files[1].name.toLowerCase().indexOf("inventory") != -1 ? files[1] : null) 
													 : (files[0].name.toLowerCase().indexOf("inventory") != -1 ? files[0] : null);

	if (!csvLayoutFile && !csvInventoryFile){
		
		w2alert("Files must have 'Inventory' and 'Layout' in there names to distinguish them.")
		
		return;
		
	} //if			
				
	w2popup.lock(translate("LoadingMsg"), true);
				
	let layoutReader = new FileReader(); //https://w3c.github.io/FileAPI/#filereader-interface
		layoutReader.readAsText(csvLayoutFile);

	layoutReader.onloadend = function() {			//https://w3c.github.io/FileAPI/#filereader-result
				
		var layoutData = d3.csvParse(this.result, fnParse);	
		
		let inventoryReader = new FileReader();		
			inventoryReader.readAsText(csvInventoryFile);
			

					
		inventoryReader.onloadend = function() {	
			
							var inventoryData = d3.csvParse(this.result, fnParse);	
		
							appWarehouses.push({	
													warehouseName: csvLayoutFile.name.split(".csv")[0],
													layoutData: layoutData,
													inventoryData: inventoryData 
											});	


							parentLayout.get("main").toolbar.get("warehouse").items.push({id: appWarehouses.length - 1, text: csvLayoutFile.name.split(".csv")[0], checked: true});
							parentLayout.get("main").toolbar.get("warehouse").selected = appWarehouses.length - 1;
								
							w2popup.unlock();	
							w2popup.close();				
							
							fnShowMyWarehouseVisualizerDemo();
		
		} //onloadend

	}	//onloadend				
		
	
} //fnHandleFileUploads

function fnHandleCsvUrls(){

	var layoutURL = $('#layoutCSV').val()
	var inventoryURL = $('#inventoryCSV').val();

	if (layoutURL == ""  || inventoryURL == "") { 
		
		w2alert("Both Layout and Inventory URLs must be provided.");
		return;
	
	} 

	w2popup.lock(translate("LoadingMsg"), true);
						
	d3.csv(layoutURL, fnParse)  //https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#csv
      .then(function(layoutData){
		 
		d3.csv(inventoryURL, fnParse)
		  .then(function(inventoryData){
			appWarehouses.push({	
									warehouseName: "layoutURL",
									layoutData: layoutData,
									inventoryData: inventoryData 
							});	


			parentLayout.get("main").toolbar.get("warehouse").items.push({id: appWarehouses.length - 1, text: "layoutURL", checked: true});
			parentLayout.get("main").toolbar.get("warehouse").selected = appWarehouses.length - 1;
				
			w2popup.unlock();	
			w2popup.close();				
			
			fnShowMyWarehouseVisualizerDemo();			  
		  })
		  .catch(function(error){ //https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
				w2popup.unlock();
				w2alert(error + " Loading Inventory Data from URL: " + inventoryURL);
				return;
		  });
		 
	  })
	  .catch(function(error){ //https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
		w2popup.unlock();
		w2alert(error + " Loading Layout Data from URL: " + layoutURL);
		return;
	 });	

} //fnHandleCsvUrls

function fnSetPredefinedScales(){
	//The animated scales in both Upload and URLs popup
	
	var mdvScales = $("#mdvScales");
	var scaleIndex = 0;
	var scaleDirection = 0;
	const maxScaleIndex =  fnGetD3Scales().length - 1;
	fnBuildPredefinedScales(mdvScales, {scaleIndex: scaleIndex , direction: scaleDirection++ });

	
	timeOutVar = window.setInterval( function(){   
	
				fnBuildPredefinedScales(mdvScales, {scaleIndex: scaleIndex , direction: scaleDirection });
				scaleIndex = scaleIndex + (scaleDirection % 2)  >  maxScaleIndex ? (scaleDirection++, 0) : scaleIndex + (scaleDirection++ % 2)  ;
				
		} , 2000);
	
} //fnHandlePredefinedScales
		
function applicationLayout(){
	

	var app  = this;
	
	app.dataVisual = undefined;
	
	app.myDataVisualizer = undefined;
	
	app.display = function(container, dataVisual){
		
		
		if ( !WEBGL.isWebGLAvailable() ) { //https://threejs.org/docs/index.html#manual/en/introduction/WebGL-compatibility-check

			var warning = WEBGL.getWebGLErrorMessage();
			w2alert(warning);
			return;

		} 		

	
		app.dataVisual = dataVisual;
		
		var mdvLayoutProperties = 
							{	name: dataVisual.warehouseName + "_mainPanel", 																	//http://w2ui.com/web/docs/1.5/layout
								panels: 
								[																												//Tool Bar Handle by Main Panel
									{ type: 'left', size: '50%', resizable: true, style: pstyle },  											//Data Analyzer
									{ type: 'main',  resizable: true,  style: pstyle},															//Warehouse GRID	
									{ type: 'preview',  size: '75%', resizable: true }  														//The display panel for the image
								
								] //panels
							}	
		
		
		if (w2ui[container.name]){
			
			var mdvLayout = $().w2layout(mdvLayoutProperties); 
				container.content("main", mdvLayout );			
			
		} //if
		else {

			$(container).css({"position": "absolute", "width": "100%", "height": "100%"})  															//https://github.com/vitmalina/w2ui/issues/105					
				mdvLayoutProperties.box = $(container);	
					var mdvLayout = $().w2layout(mdvLayoutProperties); //mdvLayout
		
		} //else
			
		app.myDataVisualizer = new myDataVisualizer();
		app.myDataVisualizer.display(mdvLayout, dataVisual)		
				

	} //display

	app.refresh = function(){
		
		//To Do Refresh...for example change in laguageIndex	
		//Refresh only the specific w2ui sub-component that have languge components.  Layout Headers, Grid toolbars
		//Pattern: w2ui['dataGrid'].toolbar.get('styleGrid').text = "vvvvv Grid"  MUST USE .text not .caption.... there's a bug
		// w2ui['dataGrid'].toolbar.refresh()        
		
	}
	
	app.destroy =  function (){
		
		app.myDataVisualizer.destroy();
		app.myDataVisualizer = null;
		
		//Known issue with resize: https://github.com/vitmalina/w2ui/commit/f77b14876604f2d5eed98f416d76b2541307aa0c 
		
		
		Object.keys(w2ui).forEach( function (objKey){  																				//Remove all w2ui instances for this object
									if ( objKey.indexOf(app.dataVisual.warehouseName + "_") != -1 )  w2ui[objKey].destroy(); 
									} );  		


		appLayout = null;
		
	} //destroy



} //applicationLayout

function myDataVisualizer(){	
	
	var mdv = this; 																												//Reference this with methods	
	
	mdv.appVersion = 1.1;

	mdv.visualizer = undefined;
	mdv.dataGrid = undefined;
	mdv.visualGrid = undefined;
	
	mdv.destroy =  function (){
		
		mdv.visualizer.destroy();
		
	} //destroy

	mdv.display = function(mdvLayout, dataVisual){
																						

		//Build 2 panel Analyzer, Data Grid in main panel, Scale Control and Legend in preview panel	
		
		var analyzerLayout = $().w2layout({ 	name: dataVisual.warehouseName  +  '_analyzerLayout',
						panels: [
							{ type: 'main', overflow: "auto", size: "70%", resizable: true, style: pstyle },							
							{ type: 'preview', size:"30%", style: pstyle, overflow: "auto", resizable: true }
						],
						onRender: function(event){
							event.done(function() {    																				//http://w2ui.com/web/docs/1.5/utils/events
								//fnGetObjectListAndLoad(warehouseIndex, languageIndex);
							
							}); //event.done
						}
		});
		

		//Scale Control	

		var scaleControlLayout = $().w2layout({
												name: dataVisual.warehouseName  + '_scaleControlLayout',
												panels: [
													{ type: 'left', resizable: true, size: "50%", style: pstyle, title:'Visualization Color Scale'}, 
													{ type: 'main', resizable: true, style: pstyle, title: "Legend" }
												]
											}
									);		
	
		
		var predefinedScale = $(document.createElement("div")).addClass("wrapper");													//Slider and scale hosted in html table	
			var table = $(document.createElement("table")).appendTo(predefinedScale);
				var tableRow = $(document.createElement("tr")).appendTo(table);
					var scaleTd = $(document.createElement("td")).appendTo(tableRow);				
				var tableRow = $(document.createElement("tr")).appendTo(table);		
					var sliderTd = $(document.createElement("td")).appendTo(tableRow);												   
	
		mdvLayout.content("left",analyzerLayout);	
			analyzerLayout.content("preview", scaleControlLayout);
				scaleControlLayout.content("left", predefinedScale[0]);


		var legendContainer =  document.createElement("div");
		scaleControlLayout.content("main", legendContainer);
			
			
		dataVisual.legendContainer = legendContainer;


		//Need size of visualization container, Color Scale and Legend before building them, so render first
		scaleControlLayout.onRender = function (event){ event.done(function(event){fnFinshLayout();}); } 						 	//onRender
		
		/*	Debugging Leave Here
		 
			//mdvLayout.on('*', function (event) {
			mdvLayout.on('resize', function (event) {
				console.log('Event: '+ event.type + ' Target: '+ event.target);
				console.log(event);
			});		
			

			analyzerLayout.on('*', function (event) {
				console.log('Event: '+ event.type + ' Target: '+ event.target);
				console.log(event);
			});		
			
			scaleControlLayout.on('*', function (event) {
				console.log('Event: '+ event.type + ' Target: '+ event.target);
				console.log(event);
			});	

		*/



		var visualizerDiv = document.createElement("div")	 																			
			mdvLayout.content("preview", visualizerDiv);		
			mdvLayout.render();																												//Continues with fnFinshLayout
		
		function fnFinshLayout(){
			
			//scaleControlLayout render gets called twice, one for each panel, so following if test is needed
			if (mdv.visualizer) return;

			mdv.visualizer = fnBuildDataVisualizer(mdvLayout.content("preview"), dataVisual);												//Warehouse Scene in visualizer object
	

				mdvLayout.showToolbar('preview');
				//mdvLayout.get("preview").title = dataVisual.warehouseName;	
				//$(mdvLayout.get("preview").content).closest(".w2ui-panel").find(".w2ui-panel-title").css("text-align", "center");
				
				var toolbar = fnGetGridToolbar(dataVisual, mdv.visualizer,"preview");
				
					toolbar.name =  dataVisual.warehouseName + "_visualToolbar";
					//toolbar.items.splice(0,2); //Remove Visualize Grid Option

					mdvLayout.assignToolbar("preview",$().w2toolbar(toolbar));	
	
	
			
			if (dataVisual.data.length == 0){  																								//No Data, just image
					
				parentLayout.get("main").toolbar.disable("toggleVisualGrid");																//Disable warehouse grid and analyzerbutton						
				parentLayout.get("main").toolbar.disable("toggleAnalyzer");																						
					
				mdvLayout.hide('left');   																									//Hide Data Analyzer Panel
				mdvLayout.hide('main');
				mdvLayout.get("preview").size = "100%";		
		
			} //if
			else {																															//Build Data Analyzer	

				parentLayout.get("main").toolbar.enable("toggleVisualGrid");																// Enable show/hide warehouse grid button											
				parentLayout.get("main").toolbar.enable("toggleAnalyzer");				
				
				mdv.visualizer.setIntersectsSelectedCallback(fnSearchIntersects);															//Object on the warehouse selected Handler (ctrl Mouse Click or Double Click)
			
				//dataVisual.dataTypes = fnGetDataTypes(dataVisual); 																		//Used by Data and Warehouse Grid
				fnGetDataTypes(dataVisual,"inventory"); 																					//Used by Data and Warehouse Grid
				fnGetDataTypes(dataVisual,"warehouse"); 																					//Used by Data and Warehouse Grid
				

				// Data Grid
				mdv.dataGrid = fnBuildGrid(dataVisual, mdv.visualizer, "data");
					analyzerLayout.content('main',mdv.dataGrid); 																			//http://w2ui.com/web/docs/1.5/utils/plugins
					dataVisual.dataGrid = mdv.dataGrid;		
	
				// Warehouse Grid	
				mdv.visualGrid = fnBuildGrid(dataVisual, mdv.visualizer, "visual");															//Warehouse Scene's GRID
					mdvLayout.content("main", mdv.visualGrid);		
					dataVisual.visualGrid = mdv.visualGrid;

	
				//Add Predefined Scale Canvas and Scale Slider
				dataVisual.activeGridColumn = {grid: dataVisual.dataGrid, column: dataVisual.dataKey };																			//First column to be visualized	

				//If being programamatically controlled, this would set initial scaling	
				dataVisual.selectedScale = {scaleIndex: 0, direction: 0};																	//The index into the scale array built by 
																																			//fnGetD3Scales, direction: 0: LowHigh, 1: HighLow
				//Build color scale and the slider to allow user to change scale
				fnBuildScaleSlider(scaleTd, sliderTd, dataVisual);
				
				//Visualize using dataVisual's properties
				fnVisualize(dataVisual);																									//Where the rubber hits the road!
				
				// Refresh Handler
				fnRefreshGrid= function(event) {  																							//Refresh grids on
				
										for (var i = 0; i < mdv.visualGrid.columns.length; i++) {											//Clear column selection
											mdv.visualGrid.columns[i].style =  "";
										} //for

										for (var i = 0; i < mdv.dataGrid.columns.length; i++) {												//Clear column selection
											mdv.dataGrid.columns[i].style =  "";
										} //for											

										fnGridSelectColumn(dataVisual);
									};	
				
				mdv.visualGrid.on("refresh", fnRefreshGrid);
				mdv.dataGrid.on("refresh", fnRefreshGrid);		
		
				w2ui.parentLayout.get("main").toolbar.click("toggleVisualGrid");															//Initially Hide Warehouse Grid	
				
			} //else dataVisual has data
			
			
			// Resize Handler
			fnResizeMdvLayout = function(event) {  																							//Resize visualizer on layout's resize
									event.done(function(event) {																			//http://w2ui.com/web/docs/1.5/utils/events
										mdv.visualizer.resize(); 																			//Exposed by dataVisualizer for resizing 
									});
								};				
			
			mdvLayout.refresh();
			
			mdvLayout.on("resize", fnResizeMdvLayout);
				mdvLayout.resize();
			
			
		} //fnFinshLayout

		function fnSearchIntersects(intersects, bSearch){
			
			if (intersects == "reset"){

				dataVisual.layoutData.forEach(function (layoutRow){ layoutRow.visualObj.visible = true});
				dataVisual.dataGrid.searchReset(false);  //http://w2ui.com/web/docs/1.5/w2grid.searchReset
				dataVisual.visualGrid.searchReset(false);			
				//fnVisualize(dataVisual);			
					
			} //if
			else {
					
				var slotRow =  fnFindDataRow(intersects);
				
				if (slotRow && slotRow[dataVisual.dataKey] == dataVisual.visualGrid.last.search && bSearch){  //Toggle isolation searching	
					fnSearchIntersects("reset");
					return slotRow;
				
				}
				
				if (slotRow && bSearch){
					
					//dataVisual.visualGrid.searchReset(false);  //Reset search (trigger search logic), but don't refresh the grid http://w2ui.com/web/docs/1.5/w2grid.searchReset
					//dataVisual.visualGrid.search(dataVisual.dataKey, slotRow[dataVisual.dataKey]); //http://w2ui.com/web/docs/1.5/w2grid.search
					
					w2utils.lock(document.body, { spinner: true, opacity : 0 });
					setTimeout(function(){
											dataVisual.visualGrid.searchReset(false);  //Reset search (trigger search logic), but don't refresh the grid http://w2ui.com/web/docs/1.5/w2grid.searchReset
											dataVisual.visualGrid.search(dataVisual.dataKey, slotRow[dataVisual.dataKey]); //http://w2ui.com/web/docs/1.5/w2grid.search
										}
								, 1); 
					

				}
				
				return slotRow;

					
			} //else 
				
						
			function fnFindDataRow(intersects){
				
				//Use dataVisual.layouData to determine keyValue, if interesect contain one of the visualization objects
				var slotRow = null;
		
				for (var i = 0; i < intersects.length; i++){
					
					var data = dataVisual.activeGridColumn.grid.name.indexOf("visualGrid") != -1 ? dataVisual.layoutData : dataVisual.join ;
					
					var bFoundMatch = data.some(function(row){
								
														 if ( isSlotObj(row.visualObj, intersects[i].object) ) {
															slotRow =  dataVisual.activeGridColumn.grid.name.indexOf("visualGrid") != -1 ? row : row.dataRow;
															return true; 
														 }	 
										
										}); //some				

					if (bFoundMatch) break;
					
				}	

				return slotRow;
				
				
				function isSlotObj(visualObj, intersectObj){
					
					var bVisualObj = visualObj === intersectObj;
					
					if (bVisualObj) return true;   //Continues to next line if bVisualObj == false
					
					intersectObj.traverseAncestors(function(node){
							
							bVisualObj = bVisualObj ? bVisualObj : visualObj === node;  //Keep checking ancestors/parents to determine if instersect is a child of a visualObj			
								
							
					});
					
					return bVisualObj;
					
				} //isSlotObj
						
				
			} //fnFindDataRow
				
			
		} //fnSearchIntersects

		function fnBuildDataVisualizer(container, dataVisual){
			
			//PREPARE THE VISUAL OPTIONS 
			var objVisualizeSettings = {
					//scene: {background: "#d9dccb"},
					scene: {background: initalBackgroundColor},
					//boundingBox:{visible:true, color:"white"},
					boundingBox:{visible:true, color:fnGetBackGroundColorInvert(initalBackgroundColor)},
					axesHelper: {visible:false},
					gridHelper: {visible:true},
				};						 
		 
			//INSTANTIATE NEW VISUAL WITH OPTIONS
			var visualizer =  new dataVisualizer(objVisualizeSettings);
			visualizer.setVisual(dataVisual.visual);
						
			visualizer.display(container);       	//Build threejs scene into the container and builds the 'visualize' Objects grid
			
			return visualizer;

			function dataVisualizer (overrideProperties) {

				var properties = {//Default warehouse layout props; attributes can be changed with attributes in ojb3dProperties
					version: 1.1,
					id: "Warehouse" + uuidv4(),																    //UniqueID
																												//Prefix in warehouseData column that designates a column as a predefined color
					container: null,																			//Assigned in fnDisplay
					containerWidth: undefined,																	//Default width (px) or (%)			
					containerHeight: undefined,																	//Defualt height (px) 	   

					//ThreeJS specific objects
					scene: 	{	obj:null, 																		//https://threejs.org/docs/index.html#api/scenes/Scene
								background:"black"
							},	
																												//background: any color acceptable to THREE.Color: https://threejs.org/docs/index.html#api/math/Color				
					camera: {	obj:null,																		//https://threejs.org/docs/index.html#api/cameras/Camera
								fov:45
							},
					renderer:{ 	obj:null},																		//https://threejs.org/docs/index.html#api/renderers/WebGLRenderer
					controls: { obj:null,																		//https://threejs.org/docs/index.html#examples/controls/OrbitControls
								maxPolarAngle: 90,																//90 degrees: Don't rotate below Y = 0 plane, > 90 degrees camera can go -Y 
								zoomSpeed: 1, 																    //https://threejs.org/docs/index.html#examples/controls/OrbitControls.zoomSpeed
								panSpeed: 1  																    //https://threejs.org/docs/index.html#examples/controls/OrbitControls.panSpeed

							  } ,	   
					mouse: new THREE.Vector2(),																	//RayCasting mouse object
					tooltipInteresected: null,																	//Tooltip object last intersected ojbect					
					raycaster: new THREE.Raycaster(),
					boundingBox: {	obj:null,
									boundingRange: null,														//A Three.js Vector with +/- lengths along x,y,z axis relative to scene/world 0,0,0	
									visible:true,
									color:"white"
								},			
					axesHelper: {	obj:null,
									visible:false
								},	
					gridHelper: {	obj:null,
									gridSize:null,	
									visible:false,																//Set to true to see grid and minimum warehouse y for image									
									colorGrid:"green",															//Default CSS color for grid
									colorCenter:"white",														//Default CSS color for grid's centerline
									divisions:10
								}, 	
					stats: null, 																			    //Stats Performance display									

					visualGroup: null,																			//All the objects displayed in the scene.  It's a child of sceneGroup
					sceneGroup: null,																			//Collection of of sub objects for easy transformation

					animationFrame: null,																		//Animation Frame used for rendering //https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/

					//Methods specific to threejs scene 													
					rebuildGridHelper: fnRebuildGridHelper,														//Rebuild the visualization grid helper
					showBirdsEyeView: fnShowBirdsEyeView,														//Bird's Eye View
					rotate: fnRotate,																			//Rotate the image in the visualization	
					


					warehouse: null,																			//The gltf file to be loaded
					keyVisualName: "name",																		//The key vale for the warehouse file, defaults to name property of objects, but can be overrriden				
					visualizeProp: "visualize",																	//The property in the GLTF file that designates meshes to visulize

					fnSearchIntersects: function(){},                                                            //Callback function handling object selection 

					//Methods			
					setVisual: fnSetVisual,
					setIntersectsSelectedCallback: fnSetInteresectsCallBack,
					display: fnDisplay,																			//Invoked to render thes scene
					resize: null, 																				//resize method...callback assigned by fnGetResizeCallback() at initialization of the dataVisualizer	
					destroy: fnDestroy,																			//Used at initialization and if loading different files by interface to clean-out the current visualization
					
					
				} //properties


				// SET SCENE PROPERTIES
				if (overrideProperties) 
					fnSetSceneProperties(overrideProperties);													//Use Override properties if they were set
				
				return properties;																				//Return the complete properties object to caller

				/////////////////////////////////////////////////////////////////M E T H O D S ////////////////////////////////////////////////////////////////////////////////////

				
				function fnGetResizeCallback(){
					
					//Add Window resize event and return callback so that properties.resize() can be invoked for non windows resize events.
					//Invoked after the scene is created
					
					var callback	= function(){
						
						if (!properties.renderer.obj || !properties.camera.obj  ) return; //Can't resize something that doesn't exist yet
						
						var containerWidthHeight = fnGetContainerWidthHeight(properties.container);
						
						properties.containerWidth  = containerWidthHeight.width;
						properties.containerHeight = containerWidthHeight.height;				
						
						// notify the renderer of the size change
						properties.renderer.obj.setSize( properties.containerWidth, properties.containerHeight );
						
						// update the camera
						properties.camera.obj.aspect = properties.containerWidth / properties.containerHeight;
						properties.camera.obj.updateProjectionMatrix();

					}; //callback
					
					// bind the resize event
					window.addEventListener('resize', callback, false);

					
					return callback;
					
					
				} //fResize
				
				function fnSetInteresectsCallBack(fnCallBack){
						
					properties.fnSearchIntersects = fnCallBack;
					
				}
				
				
				function fnGetContainerWidthHeight(container){

					var width = $(container).width() == 0 ? container.parentElement.clientWidth :  $(container).width();
					var height = $(container).height() == 0 ? container.parentElement.clientHeight :  $(container).height();
					return { width: width,  height: height };
					
				} //fnGetContainerWidthHeight	
				

				function fnSetVisual(warehouse){
					properties.warehouse = warehouse;	
				} //fnSetVisual

				
				// DISPLAY
				function fnDisplay(container) {
					
						if (!container){ 
							w2alert("Error: No container for visualizer specified"); 
							return;
						} //if  
						
						fnBuildPerformanceStats(properties)						
						
						properties.container = container;
						
						var containerWidthHeight = fnGetContainerWidthHeight(properties.container);
						properties.containerWidth = containerWidthHeight.width;
						properties.containerHeight = containerWidthHeight.height;			
						
						fnBuildScene();																						//Build the scene; calls fnBuildVisual

						properties.resize =  fnGetResizeCallback(container);												//Set resize logic, fnGetResizeCallback is called once at startup (after scene is built) 
																															// and returns a callback used with exposed 'resize' method of the Data Visualizer		
						
						fnSetBirdsEyeView();	
												
						//So that properties.sceneGroup.obj.matrixWorld get updated;
						properties.renderer.obj.render( properties.scene.obj, properties.camera.obj );
				
						animate();
						
				
				} //fnDisplay

				function fnBuildPerformanceStats(properties){
							
						//PERFORMANCE https://www.reddit.com/r/threejs/comments/7g15ff/datgui_how_did_they_get_the_fps_chart_in_the_gui/
						//https://github.com/mrdoob/stats.js#readme
						//Customized for Height
						properties.stats = new Stats();
						//ALREADY 3 STATS, DISPLAY THEM ALL
						for (var i = 0; i < properties.stats.domElement.children.length; i++) { properties.stats.domElement.children[i].style.display = ""; }
						properties.stats.domElement.style.position = "static";
						properties.stats.domElement.style.cursor = "auto";

						
				} //fnBuildPerformanceStats	
				
						

				// SET THE ENVIRONMENT
				function fnDestroy() {
					
					//Remove window event listeners that reference fnfnHandleKeyMouse so reference to 'propeties' is freed-up
					if (typeof properties.fnHandleKeyMouse != "undefined") {

							
							document.removeEventListener( 'keydown', properties.fnHandleKeyMouse );									
							properties.renderer.obj.domElement.removeEventListener( 'mousedown', properties.fnHandleKeyMouse);
							properties.renderer.obj.domElement.removeEventListener( 'mousemove', properties.fnHandleKeyMouse);			
							properties.renderer.obj.domElement.removeEventListener( 'mouseup', properties.fnHandleKeyMouse);
							properties.renderer.obj.domElement.removeEventListener( 'dblclick', properties.fnHandleKeyMouse);						
							
							
							
					} //if	
					

					if (properties.animationFrame) window.cancelAnimationFrame(properties.animationFrame);
					if (properties.scene.obj) {
						fnClear(properties.scene.obj); 
						fnDispose(properties.scene.obj);
					}
					if (properties.renderer.obj) {
						properties.container.removeChild(properties.renderer.obj.domElement);
						properties.renderer.obj.dispose();
						properties.renderer.obj.forceContextLoss();     //https://threejs.org/docs/index.html#api/renderers/WebGLRenderer.forceContextLoss
						properties.renderer.obj.context=undefined;
						properties.renderer.obj.domElement=undefined;
					}	
					
					//NULL-OUT any .obj PROPERTY
					for (var prop in properties){
						
						if (properties[prop] && properties[prop].hasOwnProperty("obj")) 
							properties[prop].obj = null;
					
					} //for
						
					// CLEAR (see https://github.com/mrdoob/three.js/issues/385 )
					function fnClear(obj){
					
						var children = obj.children;
						
						for(var i = children.length - 1; i >= 0; i--){
							var child = children[i];
							fnClear(child);
							obj.remove(child);
						};					
						
						
					} //fnClear
				
				
				
					//https://stackoverflow.com/questions/22565737/cleanup-threejs-scene-leak
					function fnDispose (obj){
						
						if (obj !== null){
							for (var i = 0; i < obj.children.length; i++){
								fnDispose(obj.children[i]);
							} //for
							if (obj.geometry){
								obj.geometry.dispose();
								obj.geometry = undefined;
							}
							if (obj.material){
								if (obj.material.map){
									obj.material.map.dispose();
									obj.material.map = undefined;
								}
								obj.material.dispose();
								obj.material = undefined;
							}
						}
						obj = undefined;
					} //fnDispose
				
				
				} //fnDestroy	
				
				// SET SCENE PROPERTIES
				function fnSetSceneProperties(overrideProperties) {
					
					properties.warehouseData = overrideProperties.warehouseData ? overrideProperties.warehouseData : properties.warehouseData;					//Use override data/schema if they exists.
					properties.schema = overrideProperties.schema ? overrideProperties.schema : properties.schema;
							
					$.extend(true,properties,overrideProperties);														//Deep extend: http://api.jquery.com/jQuery.extend/
							
					
				} //fnSetSceneProperties	
				
				
				// REBUILD GRIDHELPER BASED ON  dat.GUI SETTINGS
				function fnRebuildGridHelper() {

					var settings = {x: 				properties.gridHelper.obj.position.x,										
									y: 				properties.gridHelper.obj.position.y, 
									z: 				properties.gridHelper.obj.position.z, 
									size: 			properties.gridHelper.gridSize,
									divisions: 		properties.gridHelper.divisions, 
									colorCenter: 	properties.gridHelper.colorCenter,
									colorGrid:		properties.gridHelper.colorGrid, 
									visible:  		properties.gridHelper.visible 
									};
					fnBuildGridHelper(settings);			
				
				} //fnRebuildGridHelper		
				
					
				// ANIMATE
				function animate() {
						
											
						properties.animationFrame = window.requestAnimationFrame( animate );							//https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/			
						properties.renderer.obj.render( properties.scene.obj, properties.camera.obj );		
												
						properties.controls.obj.update();
						properties.stats.update();

				}

			
				// beyeV ORBITAL CONTROL
				function fnShowBirdsEyeView() {
					
					// if (properties.camera.obj.position.y != properties.gridHelper.gridSize) {
					
						properties.controls.obj.reset();
					
					// }
				
				} //fnShowBirdsEyeView

				//Rotate the imagage
				function fnRotate() {
				
					//rotate clockwize
					properties.camera.obj.position.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI / 2); //rotate clockwize 90 degrees
					properties.controls.obj.update();		
					
				}
				
				// SET BIRDSEYE VIEW
				function fnSetBirdsEyeView(){
					
					//Discussion on Camera lookat: https://stackoverflow.com/questions/15696963/three-js-set-and-read-camera-look-vector/15697227#15697227
					properties.camera.obj.position.set(0, properties.gridHelper.gridSize, properties.gridHelper.gridSize);
					properties.camera.obj.lookAt(properties.scene.obj.position);	
					properties.controls.obj.update();		
					properties.controls.obj.saveState();
				
				} //fnSetBirdsEyeView
				
				// BUILD GRIDHELPER	
				function fnBuildGridHelper (settings) {
					
					if (properties.gridHelper.obj) 
						properties.sceneGroup.remove(properties.gridHelper.obj);
					
					properties.gridHelper.obj = null;
					
					properties.gridHelper.obj = new THREE.GridHelper(settings.size, 
												settings.divisions, 
												settings.colorCenter, 
												settings.colorGrid);
					properties.gridHelper.obj.position.set(settings.x,settings.y,settings.z);
					properties.gridHelper.obj.material.visible = settings.visible;						
					properties.sceneGroup.add(properties.gridHelper.obj);		
				
				} //fnBuildGridHelper		
					
				
				// BUILD SCENE
				function fnBuildScene() {	
				
					// CONTAINER
					var container = properties.container;
					
					
					// PARENT GROUP	
					properties.sceneGroup = new THREE.Group();	
					properties.sceneGroup.name =  "sceneGroup";
							
					// SCENE
					properties.scene.obj = new THREE.Scene();
					properties.scene.name = "scene";
					properties.scene.obj.background  = new THREE.Color(properties.scene.background);	
					
					
					
					//Warehouse
					
					// SCENE COMPONENTS
					// Adds objects to  properties.visualGroup.  The fnBuildVisual method is set in fnBuildVisual and is data dependent
					// Objects are built color-less	
					///		
					properties.visualGroup = fnBuildVisual();

					
					//Add warehouse created during join to the scene's parent group
					properties.sceneGroup.add(properties.visualGroup);	
					
					
					//*******************************************************************************************************************************	
					
					// BOXHELPER																						//A boundingBox for the complete group is then calculated. Its center is used to re-center the group relative to the scene's 0,0,0 coordiante. 
					properties.boundingBox.obj = 
							new THREE.BoxHelper(properties.visualGroup, properties.boundingBox.color); 					//Used to get the group's coordinates	
					properties.boundingBox.obj.geometry.computeBoundingBox();                         					//https://threejs.org/docs/index.html#api/core/BufferGeometry.computeBoundingBox
					properties.boundingBox.obj.visible = properties.boundingBox.visible;	
					
					var bBox = properties.boundingBox.obj.geometry.boundingBox;											//Save in properties for possbile future reference
					var bSphere= 
						properties.boundingBox.obj.geometry.boundingSphere;												//Save in properties for possible future reference
					properties.gridHelper.gridSize = Math.ceil(bSphere.radius) * 2.25;									//The grid size is 25% larger than the diameter (r*2)
							
					properties.boundingBox.boundingRange = new THREE.Vector3 (											// +/- x,y,z length values; Divide by 2 because group is centered in scene
						(bBox.max.x - bBox.min.x) / 2, 																	//Used to set orbit controls' target, which is a function of major axis orientation
						(bBox.max.y - bBox.min.y) / 2,       
						(bBox.max.z - bBox.min.z) / 2); 		
					
						
					var x = bSphere.center.x;
					var y = bSphere.center.y;
					var z = bSphere.center.z;
					var minY = bBox.min.y; 
																 
					properties.sceneGroup.add(properties.boundingBox.obj);	


					// LIGHT
					properties.scene.obj.add(new THREE.HemisphereLight(0xffffff,0xffffff,0.5));
					
					
					// CAMERA
					var width = properties.containerWidth;
					var height = properties.containerHeight;
					
					var fieldOfView = properties.camera.fov.number;
					var aspectRatio = width / height;
					//var perspectiveNear = 0.1, perspectiveFar = 20000;		
					var perspectiveNear = 0.1, 
						perspectiveFar = properties.gridHelper.gridSize * 2;		
					
					properties.camera.obj = new THREE.PerspectiveCamera( fieldOfView, aspectRatio, perspectiveNear, perspectiveFar);
					
					properties.camera.obj.add(new THREE.AmbientLight(0xffffff,0.5));
					
					var directionLight = new THREE.DirectionalLight(0xffffff,0.25);
						directionLight.position.set(0.5, 0, 0.866); // ~60Âº
					properties.camera.obj.add(directionLight);
				
					
					
					properties.scene.obj.add(properties.camera.obj);
					

					// RENDERER
					if ( Detector.webgl )
						properties.renderer.obj = new THREE.WebGLRenderer( {antialias:true} );
					else
						properties.renderer.obj = new THREE.CanvasRenderer(); 

					//https://threejs.org/docs/index.html#examples/en/loaders/GLTFLoader
					//properties.renderer.obj.gammaOutput = true;
					//properties.renderer.obj.gammaFactor = 2.2;
					
					properties.renderer.obj.setSize(width, height);
					
					var zIndex = parseFloat($(container).css("z-index")) ?  parseFloat($(properties.container).css("z-index"))  : 0;
					
					$(properties.renderer.obj.domElement).css({"z-index": zIndex - 2, "position": "absolute", "top": 0, "left": 0} );		
					
					container.appendChild( properties.renderer.obj.domElement );
						
					// ORBIT CONTROLS
					properties.controls.obj = new THREE.OrbitControls( properties.camera.obj, properties.renderer.obj.domElement ); 			
					properties.controls.obj.enableKeys = true;
					properties.controls.obj.enablePan = true;
					properties.controls.obj.screenSpacePanning = false;	
					properties.controls.obj.panSpeed = properties.controls.panSpeed;	
					properties.controls.obj.zoomSpeed = properties.controls.zoomSpeed;	
					properties.controls.obj.maxPolarAngle = properties.controls.maxPolarAngle * (Math.PI / 180)  ;											
					

					// GRIDHELPER
					fnBuildGridHelper({x: x, y: minY, z: z, size: properties.gridHelper.gridSize, 
												   divisions: properties.gridHelper.divisions, colorCenter: properties.gridHelper.colorCenter,
												   colorGrid:properties.gridHelper.colorGrid, visible:  properties.gridHelper.visible  });
					
				
					// AXESHELPER														
					properties.axesHelper.obj = new THREE.AxesHelper( properties.gridHelper.gridSize );			//Add x,y,z axis helper at scenes 0,0,0
					properties.axesHelper.obj.position.set(-properties.boundingBox.boundingRange.x, -properties.boundingBox.boundingRange.y, -properties.boundingBox.boundingRange.z )
					properties.axesHelper.obj.visible = properties.axesHelper.visible;
					properties.scene.obj.add( properties.axesHelper.obj );
						
				
					properties.sceneGroup.position.x = -x; 														    //Center image relative to scene's x:0,y:0,z:0 
					properties.sceneGroup.position.y = -y;																
					properties.sceneGroup.position.z = -z;
					
				
					properties.scene.obj.add(properties.sceneGroup);
					
					properties.controls.obj.maxDistance = properties.gridHelper.gridSize * 1.5;						//Don't allow orbital control to go out beyond the 150% of gridSize		
							


					//Tooltip 
					
					properties.toolTipDiv = $(document.createElement("div"));    									//A jQuery object

					properties.toolTipDiv.css({
										  position: "absolute",
										  left: 0,
										  top: 0,
										  "text-align": "center",
										  padding: "2px 2px",
										  "font-family": "Verdana,Arial,sans-serif",
										  "font-size": "11px",
										  background: "#ffffff",
										  display: "none",
										  opacity: 0,
										  border: "1px solid black",
										  "box-shadow": "2px 2px 3px rgba(0, 0, 0, 0.5)",
										  "border-radius": "3px"
										});


					$(container).append(properties.toolTipDiv);

					
					// KEY AND MOUSE HANDLER
					properties.fnHandleKeyMouse = function (event){
					
						event = event || window.event;			
											
						if (!event.target === properties.renderer.obj.domElement) return; //Only handle events for visualization;
						
						properties.offsetX= event.offsetX;
						properties.offsetY = event.offsetY;
						

						switch(event.type){   //Based on document, so offset is relative to doucument if the intent is to use event.offsetX/offsetY
							case "keydown":
								if (!event.ctrlKey) {
									//http://www.asciitable.com/
									switch(event.keyCode) {
										case 66: 				//key = 'b'
											fnShowBirdsEyeView();
											break;
										case 27:                //key = 'Escape'			
										case 67:				//key = 'c'
											properties.fnSearchIntersects("reset");	
											break;	
									} //switch
								}// if
								break;						
							case "mouseup":
								break;
							case "mousedown":
									if (!event.ctrlKey) break;
							case "dblclick":
							
								var intersects = fnGetRayCasterIntersects(properties);
								
								if (intersects) {
									
									var dataRow = properties.fnSearchIntersects(intersects, !event.ctrlKey);
									
									if (!dataRow) return;
									
									if (event.ctrlKey) {    //Navigate to link, if any
										
										if (dataVisual.selectionLinks.length > 0 || !$.isEmptyObject(dataVisual.getJoinByKey(dataRow[dataVisual.dataKey]).selectionLink)) {
																				
											var selectName = dataVisual.warehouseName + "_links_" + dataRow[dataVisual.dataKey];
												
											$("[name='" + selectName + "']").clone().appendTo(properties.toolTipDiv);

										} //if 

									} //if
									
									//w2utils.unlock(document.body);							
									
									
								} //if
								else {
									properties.fnSearchIntersects("reset");	
								}//else
									
									
									
								break;
							case "mousemove":	  //https://stackoverflow.com/questions/39177205/threejs-tooltip http://jsfiddle.net/UberMario/60xkg97p/4/
							
									fnHandleMouseMove(properties.toolTipDiv);		

							default:	
						} //switch
						
						function fnHandleMouseMove(toolTip) {
							
										
							var renderer =  properties.renderer.obj;
							var camera = properties.camera.obj;

							var intersects = fnGetRayCasterIntersects(properties);
							
							if (intersects) {
								
								var dataRow = fnSearchIntersects(intersects, false);				
													
								if (dataRow){
									
									var column = dataVisual.activeGridColumn.column;
									
									var split = column.split(dataVisual.colorPrefix);
									var colorColumn = split[split.length - 1];					//Reference to origial column to get it's unique categories, not the column with the colors		
									//var columnText0 = column == "recid" || column == dataVisual.dataKey || column == " " + dataVisual.visualKey ? "" : colorColumn.trim() + " ";
									var columnText0 = column == "recid" || column == dataVisual.dataKey  ? "" : colorColumn.trim() + " ";
									var text = dataVisual.activeGridColumn.grid.columns.find(function(col){return col.field == column}).caption;
									
									var columnText = (fnIsPresetColor(column) || dataVisual.data[0][dataVisual.colorPrefix + column] != undefined ) ? columnText0 + text : text;
									var formattedValue = dataVisual.dataTypes[column].type != "text" ? 
																fnFloatFormat(dataVisual,dataVisual.activeGridColumn.column, dataRow[dataVisual.activeGridColumn.column]) :
																	dataRow[dataVisual.activeGridColumn.column];
									var text =  column == dataVisual.dataKey || column == dataVisual.visualKey ? 
															dataRow[dataVisual.dataKey] :
																dataRow[dataVisual.dataKey] + ": " + columnText + ": " + formattedValue;
	

									fnShowToolTip(text, intersects[0].point);
								}

							} //if
							else {
									hideTooltip();	
							} //else
							
							
				
							// This will immediately hide tooltip
							function hideTooltip() {

								toolTip.css({ display: "none"});

							} //hideTooltip				
							
							// This will move tooltip to the current mouse position and show it by timer.
							function fnShowToolTip(text, latestMouseProjection) {
							
								if (toolTip && latestMouseProjection) {

									toolTip.empty();
									toolTip.text(text);

									var canvasHalfWidth = renderer.domElement.offsetWidth / 2;
									var canvasHalfHeight = renderer.domElement.offsetHeight / 2;

									//Normalized with 0,0,0 centered on the scene 
									var tooltipPosition = latestMouseProjection.clone().project(camera);   

									//Relative to the renderer		
									tooltipPosition.x = (tooltipPosition.x * canvasHalfWidth) + canvasHalfWidth ;
									tooltipPosition.y = -(tooltipPosition.y * canvasHalfHeight) + canvasHalfHeight;	

									toolTip.css({	
										//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
										left: `${tooltipPosition.x - toolTip.outerWidth() / 2 }px`,   
										top:  `${tooltipPosition.y - toolTip.outerHeight() - 5}px`,
										opacity: 1.0,
										display: "block"
									});
								

								} //if
							  
							} //fnShowToolTip
										
							
						
						} //fnHandleMouseMove

				
		
					}//properties.fnHandleKeyMouse
					
					
					// EVENTS			
					
					document.addEventListener( 'keydown', properties.fnHandleKeyMouse , false );								//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
					properties.renderer.obj.domElement.addEventListener( 'mousemove', properties.fnHandleKeyMouse, false )
					properties.renderer.obj.domElement.addEventListener( 'mousedown', properties.fnHandleKeyMouse, false );	
					properties.renderer.obj.domElement.addEventListener( 'mouseup', properties.fnHandleKeyMouse, false );
					properties.renderer.obj.domElement.addEventListener( 'dblclick', properties.fnHandleKeyMouse, false );		
							
					
					//RETURN
					return;
					
					
						
					//USE RAYCASTING TO DETERMINE INTERSECTS
					function fnGetRayCasterIntersects(properties){

						// the following line would stop any other event handler from firing
						// (such as the mouse's TrackballControls)
						// event.preventDefault();
						//properties.mouse is a THREEjx object
						
						//https://riptutorial.com/three-js/example/17088/object-picking---raycasting  (uses clientX and window coordinates to normalize, logic below uses domElement and clientX/Y to normalize)
						
						var renderer = properties.renderer.obj ;
						var camera = properties.camera.obj ;
						var grouping = properties.visualGroup ;
						
						properties.mouse.x = ( properties.offsetX / renderer.domElement.clientWidth ) * 2 - 1;   //Normaized and relative to container that my be offset within the client
						properties.mouse.y = - ( properties.offsetY / renderer.domElement.clientHeight ) * 2 + 1;
						properties.raycaster.setFromCamera( properties.mouse, camera );
						
						//var intersects = properties.raycaster.intersectObjects( grouping.children,true );
						var intersects = properties.raycaster.intersectObjects( dataVisual.layoutData.map(function(layoutRow){ return layoutRow.visualObj}),true );
						
						return  (intersects.length == 0) ? null : intersects;
						
						
									
					} // fnGetRayCasterIntersects
					
					
						
				} //fnBuildScene()
				
				//Build a Three.js group of for the warehouse object from the gltf file. 
				//Discussion on Model, View and Projection matrices: http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/#the-model-view-and-projection-matrices	
				function fnBuildVisual() {
				
					var visualGroup = new THREE.Group();  															//Containing the whole image allows for possible complete transforms later
					visualGroup.name = "visualGroup";
																													//In Threejs space, image is laid out relative to 0,0,0		
					var	warehouse = properties.warehouse;

					/*
					warehouse.scene.traverse( function ( node ) {

						if ( node.isMesh || node.isLight ) node.castShadow = true;
						
					} );
					*/
					
					//var meshes = warehouse.scene.children.filter(function(node){return node.isMesh || node.isGroup});	
					//meshes.forEach(function(mesh){warehouse.add(mesh.clone())});	
					
					//visualGroup.add(warehouse.scene.clone());	
					visualGroup.add(warehouse.scene);	

					visualGroup.traverse(function (node) {  //object may be a node deep in the mesh hiearchy	
						if (node.userData){
							if (node.userData[properties.visualizeProp]) {    //GLTF file would have associated with mesh:  {Blender: ...."extras": {"visualize": 1.0} ...}, In Blender it's custom property: https://docs.blender.org/manual/en/latest/data_system/custom_properties.html
								fnSaveChildrenOriginalColor(node);
							}//if	
						}//if	
					});
				
					return visualGroup;	
				
					function fnSaveChildrenOriginalColor(node){   //parent and children (if any) have userData.originalColor assigned to them as well
							node.traverse(function (node){
								if (node.material) node.userData.originalColor = new THREE.Color().copy(node.material.color);	//copy the original color assoicated with the mesh		
							});
					} // fnSaveChildrenOriginalColor
					
				} //fnBuildVisual	
				

				//https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
				function uuidv4() {
				  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
					(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
				  )
				}	
						
				
			} //dataVisualizer

								
		} //fnBuildDataVisualizer

		function fnGetDataTypes(dataVisual, dataSource) {	
	
			var visualizeData = dataSource == "inventory" ? dataVisual.data : dataVisual.layoutData;
	
			//var dataTypes = {};
			if (dataVisual.dataTypes == undefined) dataVisual.dataTypes = {};
			
			var dataTypes = dataVisual.dataTypes;
			
		
			for (var i = 0; i < visualizeData.length; i++ ){
				
				visualizeData[i].recid = i + 1;
											
				// CALCULATE DATATYPES by inspecting each column of each row 	
					var mergedRow = i == 0 ? {} : mergedRow;
					
					Object.assign(mergedRow, visualizeData[i]);
					
					var aColumns = Object.keys(mergedRow);
					
					aColumns.forEach(function(column) { 
						if (dataTypes[column]) {
							//dataTypes[column].type = dataTypes[column].type == "text" ?  "text"  :  isNaN(Number(mergedRow[column])) ? "text" : "float";
							dataTypes[column].type = dataTypes[column].type == "text" ?  "text"  :  typeof mergedRow[column] == "string" ? "text" : "float";  //For warehouse, using d3.autoType
						} //if
						else {
							//dataTypes[column] =  {type: isNaN(Number(mergedRow[column])) ? "text" : "float"};
							dataTypes[column] =  {type: typeof mergedRow[column] == "string" ? "text" : "float"};
						} //else
							
							
						
					}); //aColumns.forEach
																					
			} //for 	
			
			//Determine columns with color assigned, dataKey or visualKey for column, number of decimal places for floats, dates and aUniqueCategories
			var aColumns = Object.keys(visualizeData[0]).filter((key) => {return dataSource == "inventory" ? true : key != "visualObj" } ); //Filter out visualObj for layoutData
			
					
			aColumns.forEach(function(column) { 
			
				dataTypes[column].colorColumn = dataTypes[dataVisual.colorPrefix + column];   //May be undefined if no color if predefined for column

			
				//Date must be milliseconds since 1 January 1970 00:00:00 UTC: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
				dataTypes[column].type  = 
					column.substring(0,dataVisual.urlPrefix.length) == dataVisual.urlPrefix ? "url" : 				
						column.substring(0,dataVisual.datePrefix.length) == dataVisual.datePrefix ? "date" : 
							column.substring(0,dataVisual.dateTimePrefix.length) == dataVisual.dateTimePrefix ? "dateTime" :
								column.substring(0,dataVisual.timePrefix.length) == dataVisual.timePrefix ? "time" :
									dataTypes[column].type;
			
				//dataTypes[column].isVisualData = column.split(dataVisual.colorPrefix)[column.split(dataVisual.colorPrefix).length - 1].substring(0,1) == " ";		
				dataTypes[column].isVisualData = dataSource == "warehouse";		
									
				dataTypes[column].key = dataTypes[column].isVisualData ?  dataVisual.visualKey: dataVisual.dataKey ;
			
				if (dataTypes[column].type == "float") {
					
					dataTypes[column].numDecimals = 0;
					for (var i = 0; i < visualizeData.length; i++ ){
						
						dataTypes[column].numDecimals = Math.max( dataTypes[column].numDecimals,fnDecimaPlaces(visualizeData[i][column]));
		
					}//for
					
				} //if
				
				
				switch (true){
					
					case dataTypes[column].type == "date":
						dataTypes[column].caption = column.substring(dataVisual.datePrefix.length);
						break;
					case dataTypes[column].type == "dateTime":
						dataTypes[column].caption = column.substring(dataVisual.dateTimePrefix.length);
						break;										
					case dataTypes[column].type == "time":
						dataTypes[column].caption = column.substring(dataVisual.timePrefix.length);
						break;
					default:
						dataTypes[column].caption = column;
				
				} //switch
				
				

								
				//https://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
				function fnDecimaPlaces(num) {
					
				  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/); 
				  if (!match) { return 0; }
				  return Math.max(
					   0,
					   // Number of digits right of decimal point.
					   (match[1] ? match[1].length : 0)
					   // Adjust for scientific notation.
					   - (match[2] ? +match[2] : 0));
				
				} //fnDecimaPlaces	
	

			}); //aColumns.forEach
			
			
			//return dataTypes;
		
		
			aColumns.forEach(function(column){
									
				//https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
				dataTypes[column].aUniqueCategories = 
							Array.from(new Set(visualizeData.map(function (row) {return dataTypes[column].type == "float" ? 
												parseFloat(row[column]): 
													["date", "time", "dateTime"].indexOf(dataTypes[column].type) != -1 ? 
														fnFloatFormat(dataVisual, column, row[column]) :
															row[column]}) ))
								.sort(function(a,b){  //https://stackoverflow.com/questions/4373018/sort-array-of-numeric-alphabetical-elements-natural-sort
									  var a1=typeof a, b1=typeof b;
									  return a1<b1 ? -1 : a1>b1 ? 1 : a<b ? -1 : a>b ? 1 : 0;
								});				
			
			}); //forEach		
		
		
		
																			
		} // fnGetDataTypes

		function fnBuildGrid(dataVisual, visualizer, gridType){
				
			var dataGridProps  = fnGetGridProperties(dataVisual, visualizer, gridType); 
			
			return 	$().w2grid(dataGridProps);
			
			
			function fnGetGridProperties(dataVisual, visualizer, gridType) {
				
																	
				var gridRecords =  gridType == "visual" ? dataVisual.layoutData : dataVisual.data ;
				
				var dataTypes = dataVisual.dataTypes;
				
				
				var filterTest = function(field){
					
								 return field == "recid" ? true : 
											gridType == "visual" ? dataTypes[field].isVisualData : 
												!dataTypes[field].isVisualData && dataTypes[field].type != "url";
											
											
								} //filterTest
					
				var dataFields = Object.keys(gridType == "visual" ?  dataVisual.layoutData[0]: dataVisual.data[0] ).filter( function(field){
					
																			return filterTest(field.split(dataVisual.colorPrefix)[field.split(dataVisual.colorPrefix).length - 1]);
																		
																		});							
				var columns = [];
				var bColorField = false;  //Tracks Pre-assigned color fields					
				
				//var key = (gridType == "data" ? "" : " ")  + dataVisual[gridType + "Key"] ;  // " " prefix for warehouse data columns	assinged in dataVisual fnSetVisualProps
				var key = dataVisual.dataKey ;  // same for both data and warehouse grids; not when building the THREE scene
				
				columns.push({	field: 		"recid",  
								caption: 	gridType == "visual"  ? "Layout Row" : "Inventory Row", 
								sortable:	true, 
								searchable:	true, 
								hidden: 	false, 
								render: 	fnGridColumnRender 
								});   //Always located in column 1 associted with key used for join in Column 2
				
				columns.push({	field:		key, 
								caption: 	key.trim() + " (Key)", //Always in column 2
								render: 	fnGridColumnRender, 
								sortable:	true, 
								searchable:	true , 
								hidden: 	false
							});	
							  
				if (dataTypes[dataVisual.colorPrefix + key]) { //position here for column grouping
					
					columns.push({	field: 		dataVisual.colorPrefix +  key, 
									caption: 	"Color (Preset)" , 		
									render: 	fnGridColumnRender, 
									sortable: 	true, 
									hidden: 	false, 
									searchable: true
								});	//if key has color, Column 3	  
					
					bColorField = true;
				}	
				//***********************************	
				//Start Columns 4 through dataFields.length					
				//***********************************


				dataFields
					.filter(function(columnName){return columnName != "recid" })			
					.filter(function(columnName){return columnName != key})			
					.filter(function(columnName){return !fnIsPresetColor(columnName)  })
					.forEach(function(field,i){ 
								
									var fieldCaption = dataTypes[field].caption;
																		
									var column = {	field:	field, 
													caption: fieldCaption.trim()  + " (Scaled)", 
													sortable: true, 
													searchable: true, 
													hidden: false, 
													render: fnGridColumnRender};
									columns.push(column);
									
				
									if (dataTypes[dataVisual.colorPrefix + field]){ //If the current field in loop also has predefined color; position here for column grouping
										
										columns[columns.length - 1].caption =  "Value (Scaled)";
										
										var colorColumn = {	field: dataVisual.colorPrefix + field, 
															hidden: false, 
															caption: "Color (Preset)", 
															sortable: true, 
															searchable: false, 
															render: fnGridColumnRender};
										
										columns.push( colorColumn );
										
										bColorField = true;   //data has at least 1 pre-set color field
									
									} //if	 

				}); //dataField.forEach		
								
			
				var hasSelection = false;
				
				dataVisual.join.forEach( (join) =>  hasSelection = hasSelection ? true : !$.isEmptyObject(join.selectionLink) );
			
				if (gridType == "data" && (dataVisual.selectionLinks.length > 0 || hasSelection) ) {
					columns.push({	field: "_links", 
									caption:"Link(s)", 
									sortable: false, 
									searchable: false, 
									hidden: false,
									render: function(record,rowIndex,columnIndex) {
													
											if (dataVisual.selectionLinks.length == 0 && $.isEmptyObject(dataVisual.getJoinByKey(record[dataVisual.dataKey]).selectionLink) )
												return "";  //No globla or record level link	
											
											var select = "<select "
											select += "name='" + dataVisual.warehouseName + "_links_" + record[dataVisual.dataKey]+"'"; 
											select += " style='width: 100% !important;'"; //Fix for select width issue when rendered in column: https://github.com/vitmalina/w2ui/issues/1827#issuecomment-494770546
											select += " onchange='";
											select += "if (this.value == -1) return;  window.open(this.value , \"_blank\");" + "'>";
											var options = "<option value=-1 linknum=-1>Links...</option>"
										
											if (dataVisual.selectionLinks.length > 0) {
												
												dataVisual.selectionLinks.forEach( function(selection,i){
													
													linkParms = [];
													urlParms = "";
													Object.keys(selection).forEach(function(parm,i) {
																	if (parm != "url" && parm != "urlText") {
																		linkParms.push(dataVisual.data[record.recid - 1][selection[parm]]) ;  //Booyah Booyah!
																		urlParms += parm + "=" + escape(dataVisual.data[record.recid - 1][selection[parm]]) + "&";
																	}	
															});	//forEach									
													  urlParms =  urlParms.substring(0,urlParms.length - 1);
													  options +=  "<option value='" + selection.url + urlParms +  "' >" + selection.urlText + " (" + linkParms.join() +")</option>" ;
												
												}); //forEach

											} //if
											else {	//record level selection link
												
												var selection =  dataVisual.getJoinByKey(record[dataVisual.dataKey]).selectionLink;	
												var urlParm = record[dataVisual.dataKey];
												options +=  "<option value='" + selection.url + urlParm +  "' >" + selection.urlText + urlParm + "</option>" ;
											
											}//else
											
											
											return select + options + "</select>";

										} //render 
								   } //push object

					);	//columns.push method
					
				} //if	
					
				//***********************************	
				//End Columns 4 through dataFields.length					
				//***********************************
				
				var columnGroups = [];
				
				if (bColorField){
					
					columnGroups= [
							{	
								caption: 'Row', span: 1, 
								master: true
							}				
					]
					
					for (var i = 1; i < columns.length - 1; i++){  //skip over recid and last columm ( i < columns.length - 1)
					
						if ( !fnIsPresetColor(columns[i].field) && !columns[i].hidden ){
							
							if (dataTypes[dataVisual.colorPrefix + columns[i].field]){  //If the current field as a preset color associate with it
								
								columnGroups.push({	
													caption: columns[i].field.trim() ,
													span: 2, 
													master: false});  //Span over current field and next field
								
							}	
							else {								
									
								columnGroups.push({	
													caption: columns[i].field.trim(), 
													span: 1, master: true}); //Otherwise, just a single splan
								
							}
							
						} //if
						
					} //for
					
					if (columns[columns.length -1].field == "_links") {					//links is hidden and was handled above
							
						columnGroups.push({	
											caption: "Link(s)", 
											span: 1, 
											master: true
										  });
					}
					else {
						
						if ( !fnIsPresetColor(columns[i].field) && !columns[i].hidden )
							columnGroups.push({	
												caption: columns[i].field.trim(), 
												span: 1, 
												master: true
											}); //Otherwise, just a single splan	
						
					}
				
				} //if

				
				
				return {
					name		: dataVisual.warehouseName + "_" + gridType + "Grid",		
					columns		: columns,				
					columnGroups: columnGroups,
					recordHeight: 50,	
					records		: gridRecords,   
					header: 	dataVisual[gridType + "Name"],
					show: 		{
									toolbar: true,
									toolbarReload: false,
									footer: true,
									selectColumn: true,
									footer: true,
									//header: true,
							
								},

					sortData: 	columns
									.filter(function(row){return row.field != "_links"; })	
									.map(function(row){ return {field: row.field, direction: "ASC" } }) ,	
										
					searches: 	columns
									.filter(function(row){return row.field != "_links"; })
									.map(function(row,i, arr){
																
														return	{field: row.field, 
																caption: fnIsPresetColor(row.field) ? arr[i-1].field.trim()  + " COLOR"  
																								   : row.field.trim() == "recid" ?  "Join Row"
																								   : dataVisual.dataTypes[row.field].caption.trim(),  
															   type:  dataTypes[row.field].type 
															   }
															 }),			
				
					multiSearch : true,
					multiSelect: true,
					multiSort: true,


					toolbar: fnGetGridToolbar(dataVisual, visualizer, gridType + "Grid"),
		
					onUnselect: function(event) {  //Same as onSelect

								event.done(function(){
						
									//w2utils.lock(document.body, { spinner: true, opacity : 0 });
									//setTimeout(function(){fnHandleSelectionOrSearch(event) }, 1);	
									fnHandleSelectionOrSearch(event)
									
								});	//event.done

						}, //onUnselect			
					onSelect: function(event){  //Added with when multiSelect:true was enabled

								event.done(function(){
						
									//w2utils.lock(document.body, { spinner: true, opacity : 0 });
									//setTimeout(function(){fnHandleSelectionOrSearch(event) }, 1);			
									fnHandleSelectionOrSearch(event)
								
								});	//event.done
						
					}, //onselect
					onSearch: function(event){		// http://w2ui.com/web/docs/1.5/w2grid.onSearch		
								
								//w2ui[event.target].lock('',true);	
								
								//https://github.com/vitmalina/w2ui/issues/1604
								//http://w2ui.com/web/docs/1.5/utils/events
								event.done(function(event){
																
											fnHandleSelectionOrSearch(event)
												
										});  //event.done
					
					}, //onSearch
					onColumnClick: function(event){ 

						
						
						event.done(function(){	

							if (event.field == "_links") return;
		
							dataVisual.activeGridColumn = {grid: this, column: event.field};	
							
							w2utils.lock(document.body, { spinner: true, opacity : 0 });
							setTimeout(function(){fnVisualize(dataVisual)}, 1);
							
						}); //done
						
							
					
					}, //onColumnClick

					
				} //return object
				

				//*************fnGridColumnRender
				function fnGridColumnRender(record, row_index, column_index) {	
				
					var fieldColorColumn = this.columns[column_index].field;
					var fieldText = fieldColorColumn == "recid" ? record.recid  : record[fieldColorColumn];  
					var predDefinedColor = fnIsPresetColor(fieldColorColumn);
					var fieldValueColumn = predDefinedColor ? this.columns[column_index -1].field : this.columns[column_index].field ;	//For predefined colors columns, reference the column to its left	
					var fieldValueType = dataVisual.dataTypes[fieldValueColumn].type;	
				
				
					if (!this.toolbar.get('styleGrid').checked)   //No visualization formatting
						return predDefinedColor ? fieldText : fieldValueType != "text"  ?   fnFloatFormat(dataVisual, fieldValueColumn, fieldText) : fieldText;
				
					//Logic for 'Visualize Grid Data' option 
				
					var numDecimals = 	dataVisual.dataTypes[fieldValueColumn].numDecimals;
					var fieldValue = record[fieldValueColumn];		
					var dataRecordIndex = record.recid - 1;  //The actual index into the data
					
					
					var color = predDefinedColor ? 
							record[this.columns[column_index].field] : 
								fnGetObjectScaleColorAndOptionallyVisualize(dataVisual, fieldValueColumn, dataRecordIndex, false, gridRecords);   
								

							
					var divWidth;
					if (fieldValueType != "text" ){
								
							var columnAttributes = fnGetColumnAttributes(fieldValueColumn,dataVisual, gridRecords );	

							var minPixels = 50;
							var maxPixels = 100;
							var scale = d3.scaleLinear()
										.domain([columnAttributes.minScale, columnAttributes.maxScale])
										.range([minPixels, maxPixels]);
							divWidth = scale(fieldValue);																		

						
					}//if	
					
					divWidth = (fieldValueType != "text" ) ? divWidth : 100;
					
					var div = $(document.createElement("DIV"))  //https://www.quora.com/How-do-you-create-a-box-filled-with-a-color-with-HTML-CSS
									.css({"width": divWidth + "px"})
									.css({"outline-style": "solid", "outline-width": "thin"})
									.css({"line-height":"25px", "height":"25px", "vertical-align":"center"})
									.css({"background-color": color, "opacity":"1"});
					
					$(document.createElement("SPAN"))
						.css({"background-color": "white", "opacity":".8"})  //Displays the text in a slighlty opaque box
						.text(predDefinedColor ? fieldText : fieldValueType != "text"  ?   
							fnFloatFormat(dataVisual, fieldValueColumn, fieldText) : 
								fieldText)
						.appendTo(div);
									
									
					
					return "&nbsp;" + div[0].outerHTML;													
																																			
				} //fnGridColumnRender
			
		
				
			} //fnGetGridProperties		
						
		}//fnBuildGrid

		function fnGetGridToolbar(dataVisual, visualizer, container) {
		
			function fnBuildRadioIds(prefix,start,end,increment){
				
				var arr = [];
				for (var i = start; i <= end; i = i + increment){
					arr.push({id: prefix + "_" + (increment < 1 ?  String(i).substring(0,3) : i), text: increment < 1 ? String(i).substring(0,3) : String(i)})
				} //for
				return arr;
				
			} //fnBuildRadioIds
		
			var aFOV = fnBuildRadioIds("fov",10,100,5);
			var aGridDiv = 	fnBuildRadioIds("div",2,20,1);
			var aZoomSpeed = fnBuildRadioIds("zp",.1,2.1,.1);
			var aPanSpeed = fnBuildRadioIds("ps",.1,2.1,.1);

			switch(container){
				
				case "dataGrid":

					return {
								items: [
										{type: 'break'},
										{type: 'check', id: 'styleGrid', text: "Visualize Grid", checked: false, tooltip: 'Visualize Data on Grid'},
										{type: 'break'},
										{type: 'button', id: 'downloadDataButton', text: "Download Data", tooltip: 'Download .csv file of current data grid'}, 
										// {type: 'break'},
										// {type: 'button', id: 'downloadGLTFButton', text: "Download glTF", tooltip: 'Download .gltf file of warehouse with embedded data'} 

										],	
																	
									onClick: function (event){
												
												switch(event.target){
																						
													case "downloadDataButton":	

														if (!( document.documentMode || /Edge/.test(navigator.userAgent ) ) ) {	
														
															var oGrid = this.owner;
															var gridData = oGrid.searchData.length > 0 ?
																fnFilterDownLoadData(oGrid.last.searchIds.map(function(searchId){ return dataVisual.data[searchId] }) ) :  //search results
																	fnFilterDownLoadData(dataVisual.data);    //or all records				
														
															var mdvDownLoadData= "data:text/plain;charset=utf-8," + encodeURIComponent(d3.csvFormat(gridData)); //https://github.com/d3/d3-dsv#csvFormat
															
															var anchor = $(event.originalEvent.currentTarget).find("a");
																			
															
															if (anchor.length == 0){

																var anchor = $(document.createElement("a"))
																				.attr("download",dataVisual.warehouseName +  (dataVisual.warehouseName.indexOf(".csv") == -1 ? ".csv" : "") );  
													
																		
																$(event.originalEvent.currentTarget).append(anchor);	//https://api.jquery.com/wrap/	
															
																
															} //if

															anchor.attr("href",mdvDownLoadData);
															
															anchor[0].click(); //https://stackoverflow.com/questions/34174134/triggering-click-event-on-anchor-tag-doesnt-works
															

														} //if	
														
														function fnFilterDownLoadData(data){
															
															var columns = Object.keys(data[0]).filter( (column) => column == dataVisual.dataKey || !dataVisual.dataTypes[column].isVisualData );	
															 
															var downLoadData = new Array(data.length);
				
															data.forEach( (row,i) =>  { downLoadData[i] = {}; columns.forEach( (column) => {  downLoadData[i][column] = row[column] } )  }  );
															
															return downLoadData;
															
															
														} // fnFilterDownLoadData
														
														break;
														
													case "downloadGLTFButton":	//Possible future feature 

														if (!( document.documentMode || /Edge/.test(navigator.userAgent ) ) ) {	
																							
															var anchor = $(event.originalEvent.currentTarget).find("a");
																			
															
															if (anchor.length == 0){

																var anchor = $(document.createElement("a"))
																				.attr("download",dataVisual.warehouseName + ".gltf");  ;  
															
																		
																$(event.originalEvent.currentTarget).append(anchor);	//https://api.jquery.com/wrap/	
															
																
															} //if


															var exporter = new THREE.GLTFExporter();
															
															exporter.parse(dataVisual.visual.scene, function(gltf){
																							
																								var mdvDownLoadGLTF= "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(gltf)); 
															
																								anchor.attr("href",mdvDownLoadGLTF);
																								
																								anchor[0].click(); //https://stackoverflow.com/questions/34174134/triggering-click-event-on-anchor-tag-doesnt-works
																																															
																									
																							});



														} //if	
														

														break;
														
														
														
													default:
														break;
													
												}//switch		
											
												event.done(function (event){
													
													if (event.target == "styleGrid"){   //Button to Toggle Visualization Styling of Data Grid Selected

														
														this.owner.refresh();  //re-render grid with/without styling
														
													} //if		
													
												});
									
									
									
									} //OnClick
									
							}; //toolbar
					break;			

				case "visualGrid":		
					return		{
									items: [
										{type: 'break'},
										{type: 'check', id: 'styleGrid', text: "Visualize Grid", checked: false, tooltip: 'Visualize Data on Grid'},									

									],	
									
									onClick: function (event){   //For Toolbar
																				
												event.done(function (event){
													
													switch(event.target.split(":")[0]){

														case "styleGrid":

															this.owner.refresh();  //re-render grid with/without styling	
									
															break;

														default:	
															break;
													} //switch
													

													
												});
												

							
									} //OnClick	
							
								}; // return toolbar 	
					break;

				case "preview":		
					return		{
									items: [
										{type: 'check', id: 'gpuPerformance', checked: false,   text: fnGetTranslatedText, tooltip: "Show Graphical Processing Unit Performance"}, 						
										{type: 'html', id: 'gpuPerformanceContainer', html: "<span id='gpuContainer' style='display:none'></span>"},
										{type: 'break'},					
										{type: 'button', id: 'bev', text: "Reset View", tooltip: "Show Bird's Eye View"}, 					
										{type: 'break'},					
										{type: 'button', id: 'rotate', text: "Rotate", tooltip: "Rotate Warehouse"}, 					
										{type: 'break'},	
										{type: 'check', id: 'axesHelper', checked: visualizer.axesHelper.obj.visible, text: "Axes", tooltip: "Toggle Axes on Warehouse"}, 
										{type: 'break'},					
										{type: 'color', id: 'background', color: visualizer.scene.obj.background.getHexString() , text: "Background", tooltip: "Set Background Color"}, 								
										{type: 'break'},										
										{type: 'check', id: 'boundingBox', checked: visualizer.boundingBox.obj.visible,  text: "Bounding Box", tooltip: "Toggle Bounding Box"}, 	
										{type: 'color', id: 'bBoxColor', color: visualizer.boundingBox.obj.material.color.getHexString() , text: "Color", tooltip: "Set Bounding Box Color"}, 													
										{type: 'break'},
										{ type: 'menu-radio', id: 'fov', 
											text: function (item) {
												return 'Camera Field of View: ' + item.selected.split("_")[1];
											},
											selected: "fov_" + visualizer.camera.fov,
											items: 	aFOV,
											tooltip: "Set Camera's Field of View"	
										},					
										{ type: 'menu-radio', id: 'polarAngle', 
											text: function (item) {
												return 'Polar Angel: ' + item.selected.split("_")[1];
											},
											selected: "pa_" + visualizer.controls.maxPolarAngle,
											items: 	[
														{id: 'pa_90', text: "90"},
														{id: 'pa_180', text: "180"}
											],
											tooltip: "Set Warehouse's Polar Angle"
										},
										{ type: 'menu-radio', id: 'zoomSpeed', 
											text: function (item) {
												return 'Zoom Speed: ' + item.selected.split("_")[1];
											},
											selected: "zs_" + visualizer.controls.zoomSpeed,
											items:  aZoomSpeed,
											tooltip: "Set Camera Zoom Speed"
										},
										{ type: 'menu-radio', id: 'panSpeed', 
											text: function (item) {
												return 'Pan Speed: ' + item.selected.split("_")[1];
											},
											selected: "ps_" + visualizer.controls.panSpeed,
											items:  aPanSpeed,
											tooltip: "Set Pan Speed"
										},	
										{type: 'break'},										
										{type: 'check', id: 'gridHelper', checked: visualizer.gridHelper.obj.visible, text: "Grid&nbsp;", tooltip: "Toggle Grid"},
										{type: 'color', id: 'colorGrid', color: new THREE.Color(visualizer.gridHelper.colorGrid).getHexString() ,
											  text: "Grid Color", tooltip: "Set Grid Color"}, 								
										{type: 'color', id: 'colorCenter', color: new THREE.Color(visualizer.gridHelper.colorCenter).getHexString() ,
											  text: "Center Line Color", tooltip: "Set Grid Center Line Color"}, 
										{ type: 'menu-radio', id: 'divisions', 
											text: function (item) {
												return 'Grid Divisions: ' + item.selected.split("_")[1];
											},
											selected: "div_" + visualizer.gridHelper.divisions,
											//items:  aGridDiv
											items: 	aGridDiv,
											tooltip: "Set Grid Divisions"
										}
									],	
									
									onClick: function (event){   //For Toolbar
									
												switch(event.target){
													

													case "bev":
														visualizer.showBirdsEyeView();
														break;								
													case "rotate":
														visualizer.rotate();
														break;	
													case "gpuPerformance":	
														var isVisible = $("#gpuContainer").css("display") == "inline";
														$("#gpuContainer").css("display", isVisible ?  "none" : "inline");
														
														if ($("#gpuContainer").contents().length == 0){
															$("#gpuContainer").append($(visualizer.stats.domElement).contents());
														} //

													case "bBoxColor":
														visualizer.boundingBox.obj.material.color.set(this.get('bBoxColor').color)		
														break;	
														
													default:
														break;
													
												}//switch		
											
												event.done(function (event){
													
													switch(event.target.split(":")[0]){

	
														case "axesHelper":
															visualizer.axesHelper.obj.visible = this.get('axesHelper').checked;		
															break;
														case "background":
															visualizer.scene.obj.background.set(this.get('background').color)
															edgeMaterial.color = fnGetBackGroundColorInvert(this.get('background').color);  //edgeMaterial is global
															break;															
														case "boundingBox":								
															visualizer.boundingBox.obj.visible = this.get('boundingBox').checked;
															break;
														case "fov":
															visualizer.camera.fov = parseInt(this.get("fov").selected.split("_")[1]);
															visualizer.camera.obj.fov = visualizer.camera.fov;
															visualizer.camera.obj.updateProjectionMatrix();
															break;
														case "polarAngle":
															visualizer.controls.maxPolarAngle = parseInt(this.get("polarAngle").selected.split("_")[1])  ;
															visualizer.controls.obj.maxPolarAngle = visualizer.controls.maxPolarAngle * (Math.PI / 180);
															break;
														case "zoomSpeed":
															visualizer.controls.zoomSpeed = parseFloat(this.get("zoomSpeed").selected.split("_")[1]);
															visualizer.controls.obj.zoomSpeed = visualizer.controls.zoomSpeed;									
															break;
														case "panSpeed":
															visualizer.controls.panSpeed = parseFloat(this.get("panSpeed").selected.split("_")[1]);
															visualizer.controls.obj.panSpeed = visualizer.controls.panSpeed;									
															break;									
														case "gridHelper":
														case "colorGrid":
														case "colorCenter":
														case "divisions":
														case "gridSize":

															visualizer.gridHelper.visible = this.get('gridHelper').checked;
															visualizer.gridHelper.colorGrid = this.get('colorGrid').color;
															visualizer.gridHelper.colorCenter =	this.get('colorCenter').color;
															visualizer.gridHelper.divisions = parseInt(this.get("divisions").selected.split("_")[1]);

															var settings = {
																x: 				visualizer.gridHelper.obj.position.x,										
																y: 				visualizer.gridHelper.obj.position.y, 
																z: 				visualizer.gridHelper.obj.position.z, 
																size: 			visualizer.gridHelper.gridSize,
																divisions: 		visualizer.gridHelper.divisions, 
																colorCenter: 	visualizer.gridHelper.colorCenter,
																colorGrid:		visualizer.gridHelper.colorGrid, 
																visible:  		visualizer.gridHelper.visible 
																};
															
															visualizer.rebuildGridHelper(settings); 
															break;
														default:	
															break;
													} //switch
													

													
												});
												

							
									} //OnClick	
							
								}; // return toolbar 	
					break;

							
			} //switch		
			
		} //fnGetVisualGridToolBar		

		function fnVisualize(dataVisual){

			fnSetVisualColors(dataVisual);            
			fnSetVisualScalingTitle(dataVisual);								  
							
			dataVisual.dataGrid.refresh();
			dataVisual.visualGrid.refresh();	
														
			w2utils.unlock(document.body);											

			appLayout.myDataVisualizer.visualizer.resize() //Chrome bug, force visual to resize to its container contents 				
			
		} //fnVisualize

		function fnHandleSelectionOrSearch(event){

			
			if (dataVisual.searching) return;  //Prevent deadly embrace
			
			dataVisual.searching = true;
			
			//fnClearIsolateSelections("clear");	//Clear
			dataVisual.layoutData.forEach(function (layoutRow){ layoutRow.visualObj.visible = true;});
			
		
			var grid = w2ui[event.target];  //Could be either data grid or warehouse grid
			var grid2 = grid === dataVisual.dataGrid ? dataVisual.visualGrid : dataVisual.dataGrid;
			
			
			var recIds = event.searchData ?  grid.last.searchIds :   // http://w2ui.com/web/docs/1.5/w2grid.last
												grid.getSelection(true); // http://w2ui.com/web/docs/1.5/w2grid.getSelection
			if (recIds.length > 0){
			
				dataVisual.layoutData.forEach(function (layoutRow){ layoutRow.visualObj.visible = false;});    //Initially make everything invisible
			
				var searches = [];  //For the other grid
				//var recordKey = grid === dataVisual.dataGrid ? dataVisual.dataKey : " " + dataVisual.visualKey;
				var recordKey = dataVisual.dataKey; //Same for data and warehouse grid
				//var searchKey = recordKey == dataVisual.dataKey ? " " + dataVisual.visualKey : dataVisual.dataKey;  //for the other grid
				var searchKey = dataVisual.dataKey; //Same for both the warehouse and data grid
										
				recIds.forEach(function (recid){
								
					var keyValue = grid.records[recid][recordKey];
					
					//var join = dataVisual.getJoinByProperty(searchKey, keyValue);
					var layoutRow = dataVisual.layoutData.find((row) => {return row[searchKey] == keyValue} );
					
					if (layoutRow) 
						layoutRow.visualObj.visible = true;    //Un-hide objects from the search

					if (event.searchData){		
						searches.push({field: searchKey, value: keyValue, operator: 'is'}); //http://w2ui.com/web/docs/1.5/w2grid.searchData
					} //if	
					else {
						var grid2Row = grid2.records.find(function(record){return record[searchKey] == keyValue});
						if (grid2Row != undefined)
							searches.push(grid2Row.recid );	//Find the recid in  grid2 
					}//else
						
				}); // recIds
						
						
				if (event.searchData){		
					grid2.searchReset();				//dataVisual.searching == true will prevent deadly embrace
					grid2.search(searches, 'OR');  	//Perform search on the other grid with 'OR'  http://w2ui.com/web/docs/1.5/w2grid.search
				} //if
				else {
					grid2.selectNone();	
					//grid2.select(searches.join()); //Doesn't work http://w2ui.com/web/docs/1.5/w2grid.select
					searches.forEach(function(search){grid2.select(search);});
					
					
				} //else
			
		
			} //if (recIds.length > 0)
			else {

				fnSearchIntersects("reset");
			
			} //else
				
			
			w2utils.unlock(document.body);
			
			
			dataVisual.searching = false;	

		}  // fnHandleSelectionOrSearch	
	
		function fnGridSelectColumn(dataVisual){   //Used by data and warehouse grid to de-select Column (from either grid) and select on current grid
		
		    var columnIndex = dataVisual.activeGridColumn.grid.getColumn(dataVisual.activeGridColumn.column, true);			
			for (var i = 0; i < dataVisual.activeGridColumn.grid.columns.length; i++) {
			
				dataVisual.activeGridColumn.grid.columns[i].style = i === columnIndex 
																		? "color: #000000 !important; background-color: #b6d5ff !important;"
																		: "";
			} //for

		} //fnGridSelectColumn	

		function fnBuildScaleSlider( scaleTd, sliderTd, dataVisual) {
	
			fnBuildPredefinedScales(scaleTd, {direction: 0, scaleIndex: 0});			
			
			var arrayLength = fnGetD3Scales().length;
			var slider = document.createElement("input");
			slider.type = "range";
			slider.style = "width:100%";
			slider.min = 0;
			slider.max = (arrayLength * 2) - 1;
			slider.value = 0;
			sliderTd[0].appendChild(slider);	
			
			slider.addEventListener("input", function(){

					var sliderValue = parseInt(event.target.value);
										
					dataVisual.selectedScale.direction =  sliderValue % 2;   //always mod 2 of value: odd/even
					dataVisual.selectedScale.scaleIndex = Math.min(arrayLength - 1, (sliderValue - dataVisual.selectedScale.direction) / 2);
					fnBuildPredefinedScales(scaleTd, dataVisual.selectedScale);			
			
			});
			
			slider.addEventListener("change", function(event){

					dataVisual.dataGrid.refresh();	
					w2utils.lock(document.body, { spinner: true, opacity : 0 });
					setTimeout(function(){fnVisualize(dataVisual)}, 1);  //Needs slight delay for wtutils spinner to initiate.
	
					}); //addEventListener
					
		} //fnBuildScaleSlider	

		function fnSetVisualScalingTitle(dataVisual){

			var column = dataVisual.activeGridColumn.column;
			var originalColumn = fnIsPresetColor(column) ? column.split(dataVisual.colorPrefix)[1].trim() : "";
			var isKey = column == dataVisual.dataKey || column.trim() == dataVisual.visualKey;
			var text = dataVisual.activeGridColumn.grid.columns.find(function(col){return col.field == column}).caption;
			var columnText =  (column == "recid" || isKey) ? ": " + text 
								: fnIsPresetColor(column) ?  "" 
									: fnIsPresetColor( dataVisual.colorPrefix + column) ? ": " + column
										: ": " + originalColumn + " " + text;	


			w2ui[dataVisual.warehouseName + "_scaleControlLayout"].set('left', {title: "Visualization Scale" + columnText});		
			w2ui[dataVisual.warehouseName + "_scaleControlLayout"].refresh();
		
		} //fnSetVisualScalingTitle	

		function fnSetVisualColors(dataVisual){  // fnSetVisualColors() with no parms resets visualizations
				
			if (dataVisual){																					
				var column = dataVisual.activeGridColumn.column;
				
				if (fnIsPresetColor(column)){ //Preset Color  
					
					var fnCalcColor = function (rowIndex, column)  { 		
						return dataVisual.join[rowIndex].dataRow[column].toLowerCase();		
					};				  
							
			
					dataVisual.join.forEach(function(joinRow, rowIndex){
							
						dataVisual.setColorVisualObj(joinRow.visualObj,fnCalcColor(rowIndex,column));
						
					}); //forEach	


					
					//For Legend processing
					var fnCalcColor = function (i, uniqueCat)  { 
											
						var originalColumn = column.split(dataVisual.colorPrefix)[1];	
											
						var rowIndex = dataVisual.join.findIndex(function(joinRow){return joinRow.dataRow[originalColumn] == uniqueCat; });
						
						return  dataVisual.join[rowIndex].dataRow[column];		
					};
					
					var fnLegendScale = {fnCalcColor: fnCalcColor};
				
				} //if
				else {	//Scale Color
				
					var data = dataVisual.activeGridColumn.grid.name.indexOf("visualGrid") != -1 ? dataVisual.layoutData : dataVisual.data ;
				
					//SET OBJECT COLOR AS A FUNCTION OF COLORSCALE
					for (var rowIndex = 0; rowIndex < data.length; rowIndex++ ) {
						
						fnGetObjectScaleColorAndOptionallyVisualize(dataVisual, column, rowIndex, true, data);

						
					} //for

					var fnLegendScale = fnGetColorScale(column, dataVisual,data);	//For Legend, Scale coloring is handeld by 	

				} //else
				
				var split = column.split(dataVisual.colorPrefix);
				var colorColumn = split[split.length - 1];					//Reference to origial column to get it's unique categories, not the column with the colors		
				//var columnText0 = column == "recid" || column == dataVisual.dataKey || column == " " + dataVisual.visualKey ? "" : colorColumn.trim() + " ";
				var columnText0 = column == "recid" || column == dataVisual.dataKey  ? "" : colorColumn.trim() + " ";
				var text = dataVisual.activeGridColumn.grid.columns.find(function(col){return col.field == column}).caption;
				
				var columnText = (fnIsPresetColor(column) || dataVisual.data[0][dataVisual.colorPrefix + column] != undefined ) ? columnText0 + text : text;
																			
				fnBuildLegend(column, colorColumn, columnText , fnLegendScale, dataVisual);

			} //if
			else {
													
				//Set Original Color			
				dataVisual.join.forEach(function(joinRow){
					
					
					joinRow.visualObj.traverse(function(node) {  //Color the object and any children; object may be a group with children
						if (node.type == "Mesh" && node.material) {
								node.material.color.copy(node.userData.originalColor);
						} //if
					}); //visualObject.traverse					
					
				
				});	//forEach		
				

			} //else				

			// RENDER COLOR SCALE LIST
			//function fnBuildLegend(column, title, colorScaleObj)
			function fnBuildLegend(column, colorColumn, legendTitle , colorScaleObj, dataVisual){
				
						
				var dataType =  dataVisual.dataTypes[column].type;
				var maxDecimalPlaces =  dataVisual.dataTypes[column].numDecimals;		
			
				var legendContainer2 = d3.select(dataVisual.legendContainer)  
						.style("background-color","white")
						.style("height","100%")
						.style("width","100%")				
						.style("overflow","auto");					
				
				legendContainer2.selectAll("svg").remove();
				

				var svgLegend2 = legendContainer2.append("svg")
									.attr("height",$(legendContainer2.node()).height())					
									.attr("width",$(legendContainer2.node()).width());						
				
				
			
				
				var gLegend2 = svgLegend2							
								.append("g")
									.attr("class", (dataType == "float") ? "legendSequential" : "legendOrdinal" )
									.style("font-size","11px")					
									.style("font-family","'Lucida Grande', sans-serif")								  
									.attr("transform", "translate(20,20)");	
							

				var aUniqueCategories =  dataVisual.dataTypes[colorColumn].aUniqueCategories; //colorColumn is the column that is being colorized 
					
				var legend = d3.legendColor()
					.title(legendTitle)		
					.shape("rect")
					.shapeWidth(10)
					.shapeHeight(7)
					.labelOffset(4)
					.cells(Math.min(10,aUniqueCategories.length))
					//.ascending(dataType == "text" ? false : colorScaleObj.minScale > colorScaleObj.maxScale)	
					.orient("vertical"); //vertical or horizontal		


				if (dataType == "float") {
								
					legend		
						.ascending(dataVisual.selectedScale.direction == 1)
						.scale(colorScaleObj.fnCalcColor)
						.labelFormat(",." + maxDecimalPlaces +"f");
						
				} //if
				else {	
					
					var ordinal = d3.scaleOrdinal()			
										.domain(aUniqueCategories)
										.range(aUniqueCategories.map(function(cat,i) { return colorScaleObj.fnCalcColor(i, cat); } ) );  //sequentialScale assigned to Ordinal logic		
					legend	
						.cellFilter(function(d,i) {return i < aUniqueCategories.length})						
						.scale(ordinal);  //Use sequentialScale assigned to ordinal logic above to create array of specific colors assigned to ordinals						
				} //else 
					
					

				gLegend2.call(legend);   //Build Legend with var 'legend' properties	


				//Make scrollable if necessary.  Driven by the legend contents width/height when it's larger than its svg container
				svgLegend2.attr("width",  Math.max(svgLegend2.attr("width")  - 20 ,gLegend2.node().getBBox().width  + 20)); 		
				svgLegend2.attr("height", Math.max(svgLegend2.attr("height") - 20 ,gLegend2.node().getBBox().height + 20));	
				
					
			} //fnBuildLegend
				
			
	} //fnSetVisualColors
	
		//GET AN ARRAY OF THE SCALED COLORS FOR COLUMN objColumnAttributes.column 
		function fnGetObjectScaleColorAndOptionallyVisualize(dataVisual, column, rowIndex, bColorVisual, data) {   
			
			var scaleIndex = dataVisual.selectedScale.scaleIndex;    //
			var scaleDirection = dataVisual.selectedScale.direction; //direction: 0: LowHigh, 1: HighLow
													
			var colorScaleObj = fnGetColorScale(column, dataVisual,data);
			
			var colorScale = colorScaleObj.fnCalcColor;
			
			//SET OBJECT COLOR AS A FUNCTION OF COLORSCALE			

			if (colorScaleObj.minScale == colorScaleObj.maxScale ) {
				var strColorRGB = colorScale(colorScaleObj.minScale);
			} //if
			else {
				var columnValue = ["date", "time", "dateTime"].indexOf(dataVisual.dataTypes[column].type) != -1 ?  
									fnFloatFormat(dataVisual, column, data[rowIndex][column]) : 
										data[rowIndex][column];  
				var strColorRGB = dataVisual.dataTypes[column].type == "float" ?  
									colorScale(columnValue) : 
										colorScale(dataVisual.dataTypes[column].aUniqueCategories.indexOf(columnValue));
			} //else						
						
			if (bColorVisual) {
								
				var visualObj = dataVisual.visual.scene.getObjectByName(data[rowIndex][dataVisual.dataKey]); //dataKey is same for inventory and warehouse	
				
				dataVisual.setColorVisualObj(visualObj, strColorRGB);
			
			} //if			
		
			return  strColorRGB;	
				
			
				
		} // fnGetObjectScaleColorAndOptionallyVisualize
		
		//GET COLUMN NAME, TYPE, DATATYPE, MIN/MAX SCALE (if numeric)
		function fnGetColumnAttributes(column,dataVisual, data){
			
			var dataType =  dataVisual.dataTypes[column] ?  dataVisual.dataTypes[column].type: null; 
			
			//var data = dataVisual.join;
			
			var minScale =  dataType == "float" ? d3.min(data,function (row) { return parseFloat(row[column]); }) : null;				
			var maxScale = 	dataType == "float" ? d3.max(data,function (row) { return parseFloat(row[column]); }) : null;
			
			return {column:column,  
					dataType: dataType, 
					minScale: minScale,
					maxScale: maxScale};
					
		} //fnGetColumnAttributes	
	
		function fnGetColorScale(column,dataVisual, data){
			
			var scaleIndex = dataVisual.selectedScale.scaleIndex;    //
			var scaleDirection = dataVisual.selectedScale.direction; //direction: 0: LowHigh, 1: HighLow		

			var dataType =  dataVisual.dataTypes[column].type;
					
			var aUniqueCategories =  dataVisual.dataTypes[column].aUniqueCategories
										
						
			var objColumnAttributes = fnGetColumnAttributes(column, dataVisual, data);
						
			switch(dataType) {
				case "float":			
					var minScale = objColumnAttributes.minScale;
					var maxScale = objColumnAttributes.maxScale;	
					break;
				case "text":
				case "date":
				case "time":
				case "dateTime":
					var minScale = 0;				
					var maxScale = Math.max(aUniqueCategories.length - 1, 1);									
					break;
				default:	
			} //switch
			

					
			//SEQUENTIAL SCALING
			//ColorScales documented here: https://github.com/d3/d3-scale-chromatic 
			//Scale Sequential requires interpolator: https://github.com/d3/d3-scale#sequential-scales
			//Interpolator: https://github.com/d3/d3-interpolate 			
			var aMinMaxSequential = [ minScale, Math.max(parseFloat(minScale) + 1,maxScale) ];
			var domain = [ aMinMaxSequential[scaleDirection % 2], aMinMaxSequential[(-1* scaleDirection % 2) + 1] ] ; //Flipping the domain reverses the scale [min,max] or [max,min]
			var interpolator = d3[fnGetD3Scales()[scaleIndex]];
			
			return {fnCalcColor: d3.scaleSequential(interpolator).domain(domain) , minScale: minScale, maxScale: maxScale }	
			
			
		} //fnGetColorScale	
	
		function fnIsPresetColor(column){
	
			return column.startsWith(dataVisual.colorPrefix) ;	
			
		} //fnIsPresetColor

			
	} //display

	function fnFloatFormat(dataVisual, fieldValueColumn, fieldValue){	
	
		switch (true){
			
			case dataVisual.dataTypes[fieldValueColumn].type == "date":
				return w2utils.formatDate(fieldValue, w2utils.settings.dateformat);
				break;
			case dataVisual.dataTypes[fieldValueColumn].type == "dateTime":
				return w2utils.formatDateTime(fieldValue, w2utils.settings.datetimeFormat);
				break;
			case dataVisual.dataTypes[fieldValueColumn].type == "time":
				return w2utils.formatTime(fieldValue, w2utils.settings.timeFormat);
				break;
			default:
				return d3.format(",")(fieldValue);
		
		} //switch
		
	} //fnFloatFormat

} //MyDataVisualizer

//BUILD THE PREDEFINED SCALE LIST
function fnBuildPredefinedScales(canvasParent, selectedScale){

	var canvas = fnGetAdjustedCanvas(canvasParent);

	var canvasWidth = canvas.width();
	var triangleHeight = .9 * canvas.height() ;
				
	var scaleIndex = selectedScale.scaleIndex;
	var direction = selectedScale.direction;
	
	var scale = fnGetD3Scales()[scaleIndex];
	var fnColor = d3.scaleSequential(d3[scale]).domain([ canvasWidth * (direction % 2) ,  canvasWidth * ((-1* direction % 2) + 1)  ]); 	//direction determines scale rendering
	
	var context = canvas[0].getContext("2d");
	var gradient = context.createLinearGradient(0,0,canvasWidth,0);				
	
	for(var i = 0; i <= canvasWidth; i++) {
		gradient.addColorStop(i/canvasWidth, fnColor(i) );	  //As per the example: https://www.tutorialspoint.com/html5/canvas_create_gradients.htm
	} //for
	
	//Paint Triangle on Canvas	
	context.beginPath();
	context.moveTo(0, triangleHeight );  
	context.lineTo(canvasWidth,0); //: | or _
	context.lineTo(canvasWidth , triangleHeight); 
	context.lineTo(0, triangleHeight );
	context.fillStyle = gradient;
	context.fill();
					

} // fnBuildPredefinedScales	

function fnGetAdjustedCanvas(canvasParent){

	//Resizable Canvas: http://ameijer.nl/2011/08/resizable-html5-canvas/

	var parentWidth =  canvasParent.closest(".w2ui-panel").width();		
	var parentHeight = canvasParent.closest(".w2ui-panel").height();	
	var canvasWidth = parseInt(.4 * parentWidth);
	var canvasHeight = parseInt(.7 * parentHeight);		

	var canvas = canvasParent.find("canvas");

	if (canvas.length == 0){
	
		var canvas = $(document.createElement("canvas"))
						.attr("id",canvasParent[0].id + "Canvas")
						.attr("width",canvasWidth)
						.attr("height", canvasHeight);
		
		canvasParent.append(canvas);

	} //if
	else {
	
		canvas.attr("width",canvasWidth).attr("height", canvasHeight);
	
	} //else	

	var context = canvas[0].getContext("2d");     //clear the canvas https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
	context.clearRect(0, 0, canvasWidth, canvasHeight);			
	
	return canvas ;	

} //fnGetAdjustedCanvas		

// 3D COLOR SCALES
function fnGetD3Scales() {
	//https://github.com/d3/d3-scale-chromatic

	/*		
	var  strScales = "interpolateRdYlGn,interpolateBrBG,interpolatePRGn,interpolatePiYG";
	strScales += ",interpolatePuOr,interpolateRdBu";
	strScales += ",interpolateRdGy,interpolateRdYlBu,interpolateSpectral";
	strScales += ",interpolateBlues,interpolateGreens,interpolateGreys,interpolateOranges";
	strScales += ",interpolatePurples,interpolateReds,interpolateBuGn,interpolateBuPu";
	strScales += ",interpolateGnBu,interpolateOrRd,interpolatePuBuGn,interpolatePuBu,interpolatePuRd";
	strScales += ",interpolateRdPu,interpolateYlGnBu,interpolateYlGn,interpolateYlOrBr,interpolateYlOrRd"
	strScales += ",interpolateViridis,interpolateInferno,interpolateMagma"
	strScales += ",interpolatePlasma,interpolateWarm,interpolateCool"
	strScales += ",interpolateRainbow,interpolateSinebow";	
	
	var scales = strScales.replace(/\s/g,'').split(",");	
	
		
	return scales;
	*/
	
  let colorSchemes = [];

  Object.keys(d3)
	.filter(k => k.startsWith("interpolate") )
	.filter(k => d3[k].prototype.constructor.toString().split("{")[0].split(",").length == 1)  //function(t){...}
    .forEach(k => {
                    try {
                      const scheme = d3[k](1);
                      if ( typeof scheme == "string" && scheme.startsWith("rgb") )  
                        colorSchemes.push({fnColorScheme:d3[k] , strColorScheme: k });
                    }
                    catch (e){
						//console.log(k);
					}
                  }
            ) 

  return colorSchemes.map(c => c.strColorScheme );

} //fnGetD3Scales

function dataVisual(){
	
//DataVisual Design pattern developed by Mario Delgado: https://github.com/MarioDelgadoSr
//Base Code: https://github.com/mariodelgadosr/datavisual
//Customized for My Data Visualizer
//Reference:  http://www.crockford.com/javascript/private.html		
		
	this.join = [];
	this.data = undefined;
	this.visual = undefined;
	this.dataKey = undefined;
	this.visualKey = undefined;
	this.colorPrefix = undefined;
	
	this.nonMatchingDataKeys = [];
	this.selectionLinks = [];
	
	var that =  this;   //So 'that' methods can reference 'this' object
	
	 
	// Join data to ThreeJS visual.  If a dataKey to visualKey match is not found, non-matching dataKey value is placed in nonMatchingKeys array.	
	this.joinDataToVisual = function (data, visual, dataKey, visualKey, colorPrefix, datePrefix, dateTimePrefix, timePrefix, urlPrefix){     //Paying customers can override default color and date prefix
			
		/* 	
			If method is called with just 1 parameter, it is assumed to be a visaul with embedded data.

			dataKey and visualKey are optional parameters.  
			If not provided than data[i]["name"] and visual.scene.children[k]["name"] values must match exactly for a join to occur
			visualKey can be either an attribute of the mesh or mesh.userData.  It will try finding it with as  mesh[visualKey] before searching in mesh.userData[visualKey]

			Known issue for objects created by Blender with its duplicate naming convention.  
			ThreeJS 'sanitizes' the name property "item.001" to "item001"; stripping the "."  
			See the following for explanation on why: https://discourse.threejs.org/t/issue-with-gltfloader-and-objects-with-dots-in-their-name-attribute/6726
		*/
			
		dataKey = dataKey || "name";
		visualKey =  visualKey || "name"
		colorPrefix = colorPrefix || "COLOR_";
		datePrefix = datePrefix || "DATE_";
		dateTimePrefix = dateTimePrefix || "DATETIME_";
		timePrefix = timePrefix || "TIME_";
		urlPrefix = urlPrefix || "LINK_";
		
		that.dataKey = dataKey;
		that.visualKey = visualKey;		
		
		that.colorPrefix = colorPrefix;
		that.datePrefix = datePrefix;
		that.dateTimePrefix = dateTimePrefix;
		that.timePrefix = timePrefix;
		that.urlPrefix = urlPrefix;
		
		if (arguments.length == 1) {	//Visual has embedded data. Visual must have mesh.name property and mesh.userData with  .userData[dataProperties]
	
			that.visual = arguments[0];
			that.data = [];
			that.join = [];

			var i = 0;
			
			that.visual.scene.traverse(function (node) {  													// visuaObj may several children deep into the hierarchy
				
				var dataRow = {};
						
					var groupTest =  node.type == "Group" && node.hasOwnProperty("userData");
					var meshTest =  node.type == "Mesh" && node.hasOwnProperty("userData");
																			
					if (node.hasOwnProperty(visualKey) && (groupTest || meshTest ) ){    			// Extract embedded data and create dataVisual.data and dataVisual.join			
						
						if (Object.keys(node.userData).length > 0 ){
							
							dataRow[visualKey] =  node[visualKey];			
							
							
							Object.keys(node.userData)
								.forEach(function(key){
								
									if (key == "recid") {		
										w2alert("Error: 'recid' is a reserved data property.");
										return null;
									} //if	


									//dataRow[key] = node.userData[key];
									dataRow[key] = typeof node.userData[key] == "string" ? d3.autoType([node.userData[key]])[0] : node.userData[key] ;
								
								}); //forEach
							
							
							that.data.push(dataRow);
							
							fnSetVisualProps(dataRow, i++, node, visualKey);
							
							that.join.push(	{	dataRow: dataRow, 
												visualObj: node,
												storedScaleColors: {},		//Hash for Scale Coloring
												selectionLink: dataRow[urlPrefix] ? {url: dataRow[urlPrefix], urlText: dataRow[urlPrefix]} : {}
											}); //push
					
						} //if
						
						
					} //if

				
			});	// traverse	
			
			
		
		} //if
		
		else {							//Join data to visual	
		
			if (data[0].hasOwnProperty("recid")) {		
				w2alert("Error: 'recid' is a reserved data property.");
				return null;
			}		

			// 'this' (via 'that') object's references to original inbound parameters	
			that.data = data;
			that.visual = visual;			
			
			data.forEach(function (dataRow,i){
												
							var mesh = undefined;
						
							visual.scene.traverse(function (node) {  													// visuaObj may have several children deep into the hierarchy
								
								if (!mesh){ 																			// Only continue on if the mesh hasn't been found yet
									if (node.hasOwnProperty(visualKey)) {               								// Is it a messh attribute? 
									
										mesh = node[visualKey] == dataRow[dataKey] ? node : mesh;	
									
									} //if
									else if (node.hasOwnProperty("userData")){
										
										mesh = 	node.userData[visualKey] == dataRow[dataKey] ? node : mesh;
									
									} //else if
									
								
								}//if 	
							});	// traverse					
							
							if (mesh) {
		
								fnSetVisualProps(dataRow, i, mesh, visualKey);
		
								that.join.push(	{	dataRow: dataRow, 
													visualObj: mesh,
													storedScaleColors: {},		//Hash for Scale Coloring	
													selectionLink: dataRow[urlPrefix] ? {url: dataRow[urlPrefix], urlText: dataRow[urlPrefix]} : {}													
												}); //push
							} //if
							else {
								
								that.nonMatchingDataKeys.push(dataRow[dataKey]);										// No match found for this dataRow[dataKey]
								
							}
								
			}); //data.forEach
			
		} //else
		

		function fnSetVisualProps(dataRow, i,  mesh, visualKey){
			
			return; //Not used with warehouse
								
			//First save dataRow properties in userData, if they're not already there
			
			var columns = Object.keys(dataRow).filter( (column) => column != dataKey );
			
			columns.forEach( (column) => mesh.userData[column] = dataRow[column] );
			
			//Columns for the Visual Grid	
			var firstObjWithMaterial = fnGetMaterialMeshes(mesh)[0];
			
			dataRow["recid"] = i + 1;
			dataRow[" " + visualKey] = mesh[visualKey] ? mesh[visualKey] : mesh.userData[visualKey]; //It's either in the parent or userData level	
			
			dataRow[colorPrefix + " " + visualKey] = "#" + firstObjWithMaterial.material.color.getHexString();
			
			dataRow[" id"] = mesh.id;
			
			dataRow[" x"] = firstObjWithMaterial.position.x.toPrecision(7);
			dataRow[" y"] = firstObjWithMaterial.position.y.toPrecision(7);
			dataRow[" z"] = firstObjWithMaterial.position.z.toPrecision(7);		
			
			
			
			function fnGetMaterialMeshes(visualObject){
			
			var aMaterialMeshes=[];	
			visualObject.traverse(function(node) {  //Color the object and any children; object may be a group with children
				if (node.type == "Mesh" && node.material) {
					aMaterialMeshes.push(node);
				} //if
			}); //visualObject.traverse	
			
			return aMaterialMeshes;
				
			}//fnGetMaterialMeshes				
			
			
		} // fnGetVisualProps		
		
		
		
	} //joinDataToVisual





	this.getJoinByUUID = function(uuid, protoString){																// Helper function to get the visualObj 
																													// (or index, protoString == "index") assoicated with 
			return uuid ?																							// the ThreeJS mesh uuid
							that.join[protoString == "index" ? "findIndex" : "find"](function(join){ 
																						return join.visualObj.uuid == uuid;
																					}) //function 
						:	null;
	
	} //getJoinByUUID


	this.getJoinByKey = function(key, protoString){																	// Helper function to get the joined dataRow
																													// (or index, protoString == "index") 
			return key ?																							// where join.data[dataKey] == key (same value as visualKey)			
							that.join[protoString == "index" ? "findIndex" : "find"](function(join){ 
																						return join.dataRow[that.dataKey] == key;
																					}) //function
						:	null;
	
	} //getJoinByKey
	
	
	this.getJoinByProperty = function(property, key, protoString){													// Helper function to get the joined dataRow
																													// (or index, protoString == "index") 
			return key ?																							// where join.data[property] == key (same value as visualKey)			
							that.join[protoString == "index" ? "findIndex" : "find"](function(join){ 
																						return join.dataRow[property] == key;
																					}) //function
						:	null;
	
	} //getJoinByKey	
	
	
	
	this.setColorVisualObj = function(visualObj, color){

		visualObj.traverse(function(node) {  																		//Color the object and any child meshes with color-able materials	
			if (node.type == "Mesh" && node.material) {
					node.material.color.set(color);																	// 	https://threejs.org/docs/index.html#api/en/math/Color.set
			} //if
		}); //visualObj.traverse
		
		
	} //setColorVisualObj

	this.setColorByJoinIndex = function(index, color){
		
		var visualObj = that.join[index].visualObj;
		that.setColorVisualObj(visualObj,color);
		
	} //setColorByJoinIndex 
	
	
} //dataVisual

function fnParse(row, index, rowColumns){
	
	var parsedRow = {};
	for (const key in row){ 
			if (key.substring(0,2) == "\\s"){
				parsedRow[key.substring(2)] = row[key];
			}
			else {
				var temp = {}; 
				temp[key] = row[key];
				d3.autoType(temp);
				parsedRow[key] = temp[key];
			}
	} //for
	
	return parsedRow;

} //fnParse


function fnGetBackGroundColorInvert(backGroundColor){
	
	var backgroundColorInvert = new THREE.Color(backGroundColor);
	backgroundColorInvert.setRGB(1.0 - backgroundColorInvert.r, 1.0 - backgroundColorInvert.g, 1.0 - backgroundColorInvert.b ); //https://stackoverflow.com/questions/6961725/algorithm-for-calculating-inverse-color
	return backgroundColorInvert;	

} //fnGetBackGroundColorInvert
/* List of global variables

{
	let props = []
	let iframe = document.createElement('iframe')
	document.body.append(iframe)
	for (let prop of Object.keys(window)) {
		if (!(prop in iframe.contentWindow)) props.push(prop)
	}
	console.table(props.sort())
	iframe.remove()
}
*/


/*
function b64toBlob(b64Data, contentType, sliceSize) {  
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data); //https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
	var slice = byteCharacters.slice(offset, offset + sliceSize);

	var byteNumbers = new Array(slice.length);
	for (var i = 0; i < slice.length; i++) {
	  byteNumbers[i] = slice.charCodeAt(i);
	} //for

	var byteArray = new Uint8Array(byteNumbers);

	byteArrays.push(byteArray);
  } //for
	
  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
} //b64toBlob	
*/
//https://stackoverflow.com/questions/9092125/how-to-debug-dynamically-loaded-javascript-with-jquery-in-the-browsers-debugg
//# sourceURL=myDataVisualizer.js	

