

		var V_DEMO = true; //Demo Version on MyDataVisualizer.com/demo/ 
	
		var appVersion = 0.9;
		
		var orbitControls;
		var container, camera, scene, renderer, loader;
		var visual, visualData, dataVisual;

		//var datGui, datGuiSettings;
			
		var appContainer, visualDisplay;	
        var visualizer;	 						//Object with properties/methods for the application				
	
		var dataFolder = "data";
		var visualizeProp = "visualize";        //Property in gltf file that designates that object is visualize-able
		var aLanguages = ["English","Spanish","Swedish","Finnish","French","Danish","Lithuanian","Polish","Indonesian","Filipino","Chinese","Czech","Dutch","Estonian","German","Greek","Hebrew","Icelandic","Italian","Japanese","Korean","Latvian","Norwegian","Persian","Portuguese","Romanian","Russian","Serbian","Slovak","Slovenian"];
		var aLanguageCodes = ["en","es","sv","fi","fr","da","lt","pl","id","fil","zh-CN","cs","nl","et","de","el","he","is","it","ja","ko","lv","nb","fa","pt","ro","ru","sr","sk","sl"];

		var localLanguage;   //en(glish) or sp(anish) 
	
		var bInitiating = true;  //Used when initiaing grid's resize event
		
		var timeOutVar = null;
		
		$(document).ready(function(){
			var folderIndex = 0;
			var languageIndex = 0;
			fnBuildDataVisualizerLayout(document.body, folderIndex, languageIndex);
		
		});
		
		
		
		function fnBuildDataVisualizerLayout(container, folderIndex, languageIndex){
		
			localLanguage = aLanguageCodes[languageIndex];
		
			Object.keys(w2ui).forEach( function (objKey){ w2ui[objKey].destroy(); } );  		//Changing languages causes rebuild of the data visualizer, so destroy all w2ui objects that may exist	
			
		
			appContainer = container;  //Global DOM reference to container
		
			var dataVisualizerLayout = $(document.createElement("div"));
			
			$(container)
				.css({"margin":"0px"}) 			 													//Layout Height Design Pattern: https://github.com/vitmalina/w2ui/issues/105 
				.append(dataVisualizerLayout);
			
			
				visualDisplay = visualDisplay ?														//reuse it if it exists
									visualDisplay : 
									$(document.createElement("div")).attr("id","visualDisplay"); 	//Global JQuery reference to right panel, DOM reference is visualDisplay[0]
										
					
			//https://stackoverflow.com/questions/2345784/jquery-get-height-of-hidden-element-in-jquery
			$.fn.getSize = function() {    
				var $wrap = $("<div />").appendTo($("body"));
				$wrap.css({
					"position":   "absolute !important",
					"visibility": "hidden !important",
					"display":    "block !important"
				});

				$clone = $(this).clone().appendTo($wrap);

				sizes = {
					"width": $clone.width(),
					"height": $clone.height()
				};

				$wrap.remove();

				return sizes;
			};					

			 var pstyle = 'background-color: #F5F6F7; border: 1px solid #dfdfdf; padding: 5px;';   //Panel styling		
		
			dataVisualizerLayout
				.attr("id","dataVisualizerLayout")
				.css({"position": "absolute", "width": "100%", "height": "100%"})  //https://github.com/vitmalina/w2ui/issues/105
				.w2layout({	name: 'dataVisualizerLayout', //http://w2ui.com/web/docs/1.5/layout
							panels: 
							  [	
								{ type: 'top', size: 30, style: pstyle},   //Toolbar
								{ type: 'left', size: '50%', resizable: true, style: pstyle },  //Data Analyzer
								{ type: 'main',  resizable: true,  style: pstyle,		
								}, //main
								{ type: 'preview', size: '75%', resizable: true, content: visualDisplay }  //The display panel for the image
							] //panels
							}) //dataVisualizerLayout
				; // dataVisualizerLayout									
				

		
			//Add Predfinded Scale Canvas and Scale Slider
			
			var predefinedScale = $(document.createElement("div"))
								   .attr("id", "predefinedScale");				


			var table = $(document.createElement("table"))
								.appendTo(predefinedScale);
								
			var tableRow = $(document.createElement("tr"))
							.appendTo(table);
							
			var sliderTD = $(document.createElement("td"))
							.attr("id","sliderTd")
							.appendTo(tableRow);
										
			
			var scaleTD = $(document.createElement("td"))
							.attr("id","scaleTd")				
							.appendTo(tableRow);
			

							//Simulate Content add
			$("#container").append(predefinedScale);								   
								   
								   

			$().w2layout({
			name: 'scaleControlLayout',
			panels: [
				{ type: 'left', resizable: true, size: "50%", style: pstyle, title:'Visualization Color Scale',
				  content: predefinedScale[0] }, //Add Slider Control to Panel
				{ type: 'main', resizable: true, style: pstyle, title: "Legend", content: '<div id="legend"></div>' }
			]
			});
	
			
				
			//Build 2 panel Analyzer, assign controller content to top panel and continue with fnGetObjectListAndLoad when rendered
			$().w2layout({ 	name: 'analyzerLayout',
							panels: [
								{ type: 'main', overflow: "auto", size: "70%", resizable: true, style: pstyle },							
								{ type: 'preview', size:"30%", style: pstyle, overflow: "auto", resizable: true, content: w2ui.scaleControlLayout }
							],
							//onResize: function (event){ event.done(function () {w2ui.analyzerControlLayout.resize();}) },
							onRender: function(event){
							//onRefresh: function(event){
								event.done(function() {    				////http://w2ui.com/web/docs/1.5/utils/events
								
									fnGetObjectListAndLoad(folderIndex, languageIndex);
								
								}); //event.done
							}
			});			
			
				
			w2ui.dataVisualizerLayout.content('left',w2ui.analyzerLayout);	
			
		
		
		} //fnBuildDataVisualizerLayourt
	
		function fnGetObjectListAndLoad(folderIndex, languageIndex) {
		
			/*
			d3.csv( dataFolder + "/objects.txt", function(error,folderList){  //dataFolder is global
														if (error) {
															w2alert(translations[localLanguage].errorLoadingFile + dataFolder + "/objects.txt");
															return;
														}	

														folderList.columns.forEach(function(column,i){ folderList.columns[i] = column.trim();});
														fnBuildToolBar(folderList.columns, folderIndex, languageIndex);
														fnLoadDemoOrFileData(folderList.columns, folderIndex );
													}
			);					
			*/
			
		/* Use this logic when going against a web server using d3 V5 		
		
			d3.csv( dataFolder + "/objects.txt") //https://stackoverflow.com/questions/49599691/how-to-load-data-from-a-csv-file-in-d3-v5
				.then(function(folderList){
					folderList.columns.forEach(function(column,i){ folderList.columns[i] = column.trim();});
					fnBuildToolBar(folderList.columns, folderIndex, languageIndex);
					fnLoadDemoOrFileData(folderList.columns, folderIndex );						
				})
				.catch(function (error){
					w2alert(translations[localLanguage].errorLoadingFile + dataFolder + "/objects.txt");
					return;
				});
			
		*/
			
			
			var xmlhttp;
			xmlhttp = new XMLHttpRequest();
			//Async with file:// protocol doesn't work because of new fetch protocol: https://blogs.msdn.microsoft.com/wer/2011/08/03/why-you-should-use-xmlhttprequest-asynchronously/
			//Using synchronous for development and file:// protocol access without web server	
			xmlhttp.open('GET', dataFolder + "/objects.txt", false); 
			xmlhttp.send();  //Blocks the UI thread
			
			var folderListText = xmlhttp.responseText;
			var folderList = d3.csvParseRows(folderListText)[0];  //Only a single line, so no Column header: https://github.com/d3/d3-dsv#dsv_parseRows
			folderList.forEach(function(column,i){ column.trim();});
			fnBuildToolBar(folderList, folderIndex, languageIndex);
			fnLoadDemoOrFileData(folderList, folderIndex );									

			
			function fnBuildToolBar(folderList, folderIndex, languageIndex){
			
				$().w2toolbar({	name: "toolbar",
					items:[				
						{ type: "menu-radio", id: "folder",
						  items: folderList.map (function (folder) { return { id: folder, caption: folder} }),
						  selected: folderList[folderIndex],  //Find programmatically with: w2ui.toolbar.items.find(function(item) {return item.id == "folder"}).selected
						  caption: function (item){
									return "Folder: " + item.selected;
								}
						},
						{ type: "menu-radio", id: "language", 
						  items: aLanguages.map(function (language) { return {id: language ,caption: language} }),  
						  selected: aLanguages[languageIndex],
						  caption: function (item){
									return "Language: " + item.selected;
								}	
						},
						{ type: "menu", id: "help", caption: translate("datGuiFolders.help"),
						  items: [
								{ id: "quickKeys", caption: "Quick Keys"},
								{ id: "webgl", caption: "WebGL"},
								{ id: "gltf", caption: "glTF"},
								{ id: "threejs", caption: "three.js"},
								{ id: "d3js", caption: "d3.js"},
								{ id: "about",     caption: translate("datGuiFolders.about")}
						   ]	
						}
					],
					onClick: function(event){
						event.done( function () {
						
							aTargets = event.target.split(":");
							if (aTargets.length == 1) return; //Menu, not menu item, clicked on option
							switch(aTargets[0]) {
								case "folder":
									bInitiating = true;
									fnLoadDemoOrFileData(folderList,folderList.indexOf(aTargets[1]) );
									//Re-format layout to startup state
									w2ui.dataVisualizerLayout.sizeTo("preview","75%");
									w2ui.dataVisualizerLayout.sizeTo("left","50%");
									//w2ui.analyzerLayout.hide("preview",true);									
									break;
								case "language":
									bInitiating = true;
									var folderName = fnGetSelectedToolBarRadio("folder");
									fnBuildDataVisualizerLayout(appContainer, folderList.indexOf(folderName), aLanguages.indexOf(aTargets[1]) ); //rebuild everything for new language
									break;
								case "help"	:
									switch (aTargets[1]){
										case "quickKeys":
										
											var helpText = translate("helpText1") +  translate("helpText2")  + translate("NoWFHelp1") + translate("helpText3");			  
											fnPopUp(translate("datGuiFolders.help"),helpText,3,2.5);									
											break;
											
										case "about":
										
											fnPopUp(translate("appTitle") + " (" + appVersion +")",translate("aboutText"),3,5);
											break;
											
										case "webgl":
										case "gltf":
										case "threejs":
										case "d3js":
												var links = { "webgl": "https://en.wikipedia.org/wiki/WebGL",
															  "gltf" : "https://www.khronos.org/gltf/",
															"threejs": "https://threejs.org/",
															"d3js": "https://d3js.org/" 
															};	
												window.open(links[aTargets[1]],"_blank"); 
											break;
									
									} //switch
									break;
							} //switch
							
							//Display pop-up Window
							function fnPopUp(title,html,wf,hf){ 
							
								var width = $(appContainer).width() == 0 ? appContainer.parentElement.clientWidth :  $(appContainer).width();
								var height = $(appContainer).height() == 0 ? appContainer.parentElement.clientHeight :  $(appContainer).height();	
								
								w2popup.open({	title: title,
												body: html,
												buttons   : '<button onclick="w2popup.close();">' + translate("popUpClose") + '</button>',	
												showMax: false,
												showClose: true,
												width: width/wf,
												height: height/hf,
												modal: false
											 });
							} // fnPopUp	
							
						}); // event.done
					}
				});
				
				w2ui.dataVisualizerLayout.content('top',w2ui.toolbar);
			

			
			} //fnBuildToolBar
			
			
			
		} // fnGetObjectListAndLoad
		
		function fnGetSelectedToolBarRadio(radioName){
			return w2ui["toolbar"].items.find(function(item) {return item.id == radioName}).selected;
		} //fnGetSelectedToolBarRadio
		
		function translate(prop){
			return translations[localLanguage][prop];			
		} //translate			

		function fnLoadDemoOrFileData(aFiles,indexFile){
							
				//Remove any previous instantiated visualizer	
				if (visualizer) {
					visualizer.destroy();
					visualizer = null;
				}
				
				fnLoadImageAndDataFiles(aFiles,indexFile);
							
			
		} //fnLoadDemoOrFileData		
		
		function fnLoadImageAndDataFiles(aFiles,indexFile) {

			gltfLoader = new THREE.GLTFLoader(); // https://threejs.org/docs/index.html#examples/loaders/GLTFLoader
			
			var folderName = aFiles[indexFile];
			var gltfURL =  dataFolder + "/" + folderName + "/gltf/" + folderName+ ".gltf";   //dataFolder is global  			
	
			gltfLoader.load( gltfURL, function( gltfDataFromFile ) {
			
				visual = gltfDataFromFile;  //visual is global
				
				fnLoadData(aFiles,indexFile);
								
			}, //Loader function handlder
			
			undefined, function ( error ) {   //Error Handling

				w2alert(translations[localLanguage].errorLoadingFile + gltfURL + " " + error );

			} ); //gltfLoader			
			
			
			
		} //fnLoadImageAndDataFiles
				
		function fnLoadData(aFiles,indexFile) {
			
				bInitiating =  true;   //Re-set initiating Flag, used if data is being reloaded
		
				var folderName = aFiles ? aFiles[indexFile] : fnGetSelectedToolBarRadio("folder");  //May be called by data refresh call back method and aFiles is not passed
				var dataURL =  dataFolder + "/" + folderName  + "/visualize/" + folderName + ".csv";	//dataFolder is global 
				
				/*
				d3.csv(dataURL , fnParseData, function(error, visualDataFromFile) {  //d3.csv(input, rowConversion, init ) https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#csv
				
						if (error) {
							w2alert(translations[localLanguage].errorLoadingFile + " " + dataURL );
							//return;
						}			
					
					visualData = error ? null : visualDataFromFile;  //visualData is global
					
					fnLoadsComplete();
					
				}); //d3.csv dataURL load
				*/
				
				/* New d3 V5 desig pattern...only works with data on web server, not for file:// based development
				d3.csv(dataURL)  //https://stackoverflow.com/questions/49599691/how-to-load-data-from-a-csv-file-in-d3-v5
					.then (function (visualDataFromFile){
						
						visualData = error ? null : visualDataFromFile;  //visualData is global
						fnLoadsComplete();
						
					})
					.catch(function(error){
							w2alert(translations[localLanguage].errorLoadingFile + " " + dataURL );
					});
				
				*/
				
				var xmlhttp;
				xmlhttp = new XMLHttpRequest();
				//Async with file:// protocol doesn't work because of new fetch protocol: https://blogs.msdn.microsoft.com/wer/2011/08/03/why-you-should-use-xmlhttprequest-asynchronously/
				//Using synchronous for development and file:// protocol access without web server	
				xmlhttp.open('GET', dataURL, false); 
				xmlhttp.send();  //Blocks the UI thread
				
				var visualDataText = xmlhttp.responseText;
				//https://github.com/d3/d3-dsv/blob/master/README.md#dsv_parse , but for CSV assumes "," delimitter
				//https://github.com/d3/d3-dsv/blob/master/README.md#autoType
				visualData = d3.csvParse(visualDataText,d3.autoType);   //Global Data Reference
				fnLoadsComplete()
			
				
				function fnParseData(d){ //https://riptutorial.com/d3-js/example/18426/loading-data-from-csv-files and https://stackoverflow.com/questions/26998476/right-way-to-modify-d3-csv-to-lower-case-column-names

						return; //Not upper casing columns for now

						//Make all column heading Cap to match known values in the GLTF file. Must be 1:1 exact match
						Object.keys(d).forEach(function(origProp) {
							var upperCaseProp = origProp.toLocaleUpperCase();
							  var temp = d[origProp];
							  delete d[origProp];
							  d[upperCaseProp] = temp; //Done this way to keep original column order	
						});
						
						
						
						
				  return d;
				} //fnParseData		
		
				
		} //fnLoadData
		
		// DESIGN PATTERN WHEN VISUAL DATA IS BEING PROGRAMATTICALLY DRIVEN
		function fnLoadsComplete() {

						if (!visualizer) {
									
							//PREPARE THE VISUAL OPTIONS 
							var objVisualizeSettings = {
									localLanguage: localLanguage,																	//English or Spanish
									colorPrefix: "COLOR_",																			//Prefix in column heading that designated predefined color
									translations: translations,																		//translation in translations.js
									scene: {background: "#d9dccb"},
									boundingBox:{visible:false, color:"white"},
									axesHelper: {visible:false},
									gridHelper: {visible:true},
									refreshTime: 1																					//ActivityLoad refresh time in minutes
								};						 
						 
							//INSTANTIATE NEW VISUAL WITH OPTIONS
							visualizer =  new dataVisualizer(objVisualizeSettings);
							visualizer.setVisualizeProp(visualizeProp);                                                             //The property in the GLTF file that designates meshes to visulize
							visualizer.setVisual(visual);
										
							
						} //if
						
						
						//Testing visualizer with just image
						//visualData = null;
						
						
						if (visualData) {
							

						
							visualizer.setVisualData(visualData);  //visualData is global and is optional.  If not available, just image is displayed	
							visualizer.setCallBackVisualScaling(fnVisualScaling);		
							
							//keyDataName is typically first member name of of first json object in array, but can be another column to facilitate 'join'
							//[{keyDataName: value, columnName2: value, ....} ]		
							//var keyDataName = Object.keys(visualData[0])[0];								
							//var keyDataName = visualData.columns[0];    //	https://github.com/d3/d3-dsv#dsv_parse	data.columns property						
							var keyDataName = Object.keys(visualData[0])[0];    				
							var keyVisualName = "name";                 //  Attribute in the gltf file that will be 'joined-to' and is associated with value in  setVisualizeProp					
							
							dataVisual = new dataVisual();
							dataVisual.joinDataToVisual(visualData,visual, keyDataName, keyVisualName);
							
							
							//For Demo purposes: Add Selection Links examples referencing ITEM DESCRIPTION to bing search and google
							//Selection links must be added before join (which builds datagrid) so that datagrid has access to them for display
							visualizer.addSelectionLink({url:"https://www.bing.com/search?"   , urlText:"Bing Search"  , "q":keyDataName}); 
							visualizer.addSelectionLink({url:"https://www.google.com/search?" , urlText:"Google Search", "q":keyDataName});									
							
																					  //Assuming setVisual and setVisualData, Join data to visual			
							visualizer.join(keyDataName,keyVisualName);		          //Join invokes multiple data logic and builds the data grid	
							
							visualizer.setActiveGridColumn(keyDataName);              //This is set by default with Join, but added here to illustrate explicit method
										
							if (!visualizer.scene.obj) {	//In the event fnLoadsComplete is being called recursively	
							
								visualizer.setCallBackReload(V_DEMO ? function (){return}:  fnLoadData);    			//A callback for refreshing the data; Data doesn't change for Demo                 													
								
								//visualizer.setColumn(translations[localLanguage].datGuiOriginalColor);  //Start off with original color
								

							} //if (!visualizer.scene.obj)
							
							//Add data grid	, if it was built with provided data for image
							if (visualizer.dataGrid) {
								
								visualizer.dataGrid.header = fnGetSelectedToolBarRadio("folder") + ".csv";
								visualizer.dataGrid.show.header = true;
								
								//Data Grid
								w2ui.analyzerLayout.content('main',visualizer.dataGrid); //http://w2ui.com/web/docs/1.5/utils/plugins
								
								visualizer.setLegendContainer($("#legend")[0]);
													
								
							} //if (visualizer.dataGrid)
							
						
						} // if (visualData)	
						
						else {  //No Data, just image
						
							w2ui.dataVisualizerLayout.hide('left');   //Hide Data Analyzer Panel
							w2ui.dataVisualizerLayout.resize(true);
						
						} //else

						if (!visualizer.dataRefreshing) { //Skip Display if data is being refreshed		
							
							var container = visualDisplay[0];		//DOM reference to the JQuery layout container hosting the visualization
							visualizer.display(container);       	//Build threejs scene into the container and builds the 'visualize' Objects grid
							
							//With visualizer instantiated AND displaying, bind resize event to the dataVisualizerLayout
							w2ui.dataVisualizerLayout.on("resize", function(event) {  //Resize visualizer when layout panels are resized
															event.done(function() {   //http://w2ui.com/web/docs/1.5/utils/events
																if (visualizer){
																	if (visualizer.resize){
																		visualizer.resize();  //Method exposed by dataVisualizer for resizing the image	
																	} //if	
																} //if	
															}); //event.done
														}); //.on("resize)... 						
												
							
							visualizer.visualGrid.header = fnGetSelectedToolBarRadio("folder") + " GLTF Information";  //Header for rendering information: build with .display method
							visualizer.visualGrid.show.header = true;
							w2ui.dataVisualizerLayout.content('main',visualizer.visualGrid);  //Add visual grid to layout's main panel
						
						} //if 
						
						
						if (visualizer.dataGrid){
							//Hack to get around w2ui render event not being the very last event when grid is built 
							visualizer.dataGrid.on("resize", function(event){
								//console.log("bInitiating is: " + bInitiating);
								event.onComplete =  function(){
										if (bInitiating){
											
											bInitiating =  false;
																				
											visualizer.setLegendContainer($("#legend")[0]); //For Firefox									
																				
											//Build scaling control here because its logic references a finished grid
											//this does w2ui.dataGrid.columnClick(keyDataName);
											//Set's initial value, but does not invoke change event
											var scaleSlider = fnBuildScaleSlider($("#sliderTd"), visualizer.selectedScale.scaleIndex); 
											
											
											
										} //if
								} //event.onComplete			
							});
							visualizer.dataGrid.resize();
							visualizer.dataGrid.off("resize"); //http://w2ui.com/web/docs/1.5/common.off
							visualizer.dataGrid.sort("recid_sort","asc");
				
						 //Debugging Code.  Leave here
						 /*
							w2ui['dataGrid'].on('*', function (event) {
								console.log('Event: '+ event.type + ' Target: '+ event.target);
								console.log(event);
								var log = $('#eventList').html();
								$('#eventList').html( log + (log != '' ? '<br>' : '') + event.type + ': '+ event.target);
							});	
						*/	
						
				
				
						} //if

			 
		} //fnLoadsComplete	
		
		function fnVisualScaling(){

			
			if (visualizer.isPresetColor(visualizer.activeGridColumn)){  //Pre Set Color Column

				w2ui.scaleControlLayout.set('left', {title: "Visualization Scale"});			
				
			} //if
			else{ //Scale Column

				w2ui.scaleControlLayout.set('left', {title: "Visualization Scale: " + visualizer.activeGridColumn });
				//fnBuildPredfinedScales($("#scaleTd"));
				
				//var bNoCallBack = true;
				//scaleSlider.setSliderValue("scaleSelector", visualizer.selectedScale.scaleIndex, bNoCallBack );  //Set's the slider value, but does not invoke change event		

		
			} //else
						
			//w2ui.scaleControlLayout.refresh();

		
		} //fnVisualScaling		
		//BUILD THE PREDEFINED SCALE LIST
		function fnBuildPredfinedScales(canvasParent){
		
			var canvas = fnGetAdjustedCanvas(canvasParent);

			var canvasWidth = canvas.width();
			var triangleHeight = .9 * canvas.height() ;
						
			var scaleIndex = visualizer.selectedScale.scaleIndex;
			var direction = visualizer.selectedScale.direction;
			
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
									
		
		} // fnBuildPredfinedScales		

		function fnBuildScaleSlider(canvasParent) {

			var canvas = fnGetAdjustedCanvas(canvasParent);
			
			var scaleSlider = new Slider({canvasId: canvas[0].id});

			var arrayLength = fnGetD3Scales().length;
			var step = 10;
			var max = (2 * arrayLength*step)-step;
			
			scaleSlider.addSlider({
				id: "scaleSelector",
				//radius: Math.min(100, canvasWidth, canvasHeight) ,
				radius: Math.min(50, canvas.width() / 2, canvas.height() / 2  ),
				min: 0,
				max: max ,
				step: step ,
				color: "#514dc6",
				changed: function (v) {
										
					var stepIndex = parseInt(v.value) / step;
										
					visualizer.selectedScale.direction =  stepIndex % 2;   //always mod 2 of value: odd/even
					visualizer.selectedScale.scaleIndex = Math.min(arrayLength -1, (stepIndex- visualizer.selectedScale.direction) / 2);
					fnBuildPredfinedScales($("#scaleTd"));
					
					//https://www.w3schools.com/js/js_timing.asp
					if (timeOutVar)
						clearTimeout(timeOutVar); //timeOutVar is global, clear and reset to anouther timeOutInterval until user stops moving slider
					
					var timeOutInterval = 1000; //In milliseconds
					timeOutVar = setTimeout(function(){
												visualizer.dataGrid.refresh();	
												visualizer.dataGrid.columnClick(visualizer.activeGridColumn);  //This rebuilds the grid, which inturn updates the scale via the callback to fnVisualScaling						
											}
											,timeOutInterval
											); //setTimeout
					

				} //changed
			
			}); //scaleSlider

			
			
			var bNoCallBack = true;  //Turn off changed event when setting initial value, Original Slider code was customized with this functionality

			var sliderValue = ((2 * visualizer.selectedScale.scaleIndex) + visualizer.selectedScale.direction) * step;  //Reverse algebra on logic in change event
			scaleSlider.setSliderValue("scaleSelector", visualizer.selectedScale.scaleIndex, bNoCallBack );
			
			
			return scaleSlider;	
		
		} //fnBuildScaleSlider	

		function fnGetAdjustedCanvas(canvasParent){

			//Resizable Canvas: http://ameijer.nl/2011/08/resizable-html5-canvas/
		
			var parentWidth =  canvasParent.closest(".w2ui-panel").width();		
			var parentHeight = canvasParent.closest(".w2ui-panel").height();	
			var canvasWidth = parseInt(.4 * parentWidth);
			var canvasHeight = parseInt(.8 * parentHeight);		
		
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
			var strScales = "interpolateRdYlGn,interpolateBrBG,interpolatePRGn,interpolatePiYG,interpolatePuOr,interpolateRdBu";
			strScales += ",interpolateRdGy,interpolateRdYlBu,interpolateSpectral";
			strScales += ",interpolateBlues,interpolateGreens,interpolateGreys,interpolateOranges";
			strScales += ",interpolatePurples,interpolateReds,interpolateBuGn,interpolateBuPu";
			strScales += ",interpolateGnBu,interpolateOrRd,interpolatePuBuGn,interpolatePuBu,interpolatePuRd";
			strScales += ",interpolateRdPu,interpolateYlGnBu,interpolateYlGn,interpolateYlOrBr,interpolateYlOrRd";
			
			var scales = strScales.replace(/\s/g,'').split(",");
			
			
			return scales;
		} //fnGetD3Scales		
		
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************
//*************** END OF User Interface ********************************************************************************************************

//Start visual class: Discussion on using classes with JavaScript: https://addyosmani.com/resources/essentialjsdesignpatterns/book/

/*********************************************************************************************************************************

IMPORTANT:  This version of Data Visualizer is singe instance only!!!!!!!

Future version will allow for multiple instances

**********************************************************************************************************************************/
function dataVisualizer (overrideProperties) {

	var properties = {//Default visual layout props; attributes can be changed with attributes in ojb3dProperties
		version: 0.90,
		id: "Visual" + uuidv4(),																    //UniqueID
		localLanguage: "en", 																	    //English by default and used by translate
		colorPrefix: "COLOR_",																		//Prefix in visualData column that designates a column as a predefined color
		container: null,																			//Assigned in fnDisplay
		containerWidth: "100%",																				//Default width (px) or (%)			
		containerHeight: "500px",																			//Defualt height (px) 	   

		dataRefreshing: false,																		//Set to true if visualizer is refreshing data
		refreshTime: 5,																				//Default refresh data time, units: minutes						
		
		//ThreeJS specific objects
		scene: 	{	obj:null, 																		//https://threejs.org/docs/index.html#api/scenes/Scene
					background:"black",
					controller:{background:"color"}
				},	
																									//background: any color acceptable to THREE.Color: https://threejs.org/docs/index.html#api/math/Color				
		camera: {	obj:null,																		//https://threejs.org/docs/index.html#api/cameras/Camera
					fov:45,
					controller:{fov:{type:"number", minMaxStep: [1,179,1]}}
				},
		renderer:{ 	obj:null},																		//https://threejs.org/docs/index.html#api/renderers/WebGLRenderer
		controls: { obj:null,																		//https://threejs.org/docs/index.html#examples/controls/OrbitControls
					maxPolarAngle: 90,																//90 degrees: Don't rotate below Y = 0 plane, > 90 degrees camera can go -Y 
					zoomSpeed: 1, 																    //https://threejs.org/docs/index.html#examples/controls/OrbitControls.zoomSpeed
					panSpeed: 1, 																    //https://threejs.org/docs/index.html#examples/controls/OrbitControls.panSpeed
					controller:{maxPolarAngle: {type:"number", minMaxStep: [0,180,1]},
								zoomSpeed: {type:"number", minMaxStep: [0.1,2,.1]},	
								panSpeed: {type:"number", minMaxStep: [0.1,2,.1]}	
					           }
				  } ,	   
		mouse: new THREE.Vector2(),
		raycaster: new THREE.Raycaster(),
		boundingBox: {	obj:null,
						boundingRange: null,														//A Three.js Vector with +/- lengths along x,y,z axis relative to scene/world 0,0,0	
						visible:true,
						color:"white",
						controller:{visible:"boolean", color:"color"}
					},			
		axesHelper: {	obj:null,
						visible:false,
						controller:{visible:"boolean"}
					},	
 		gridHelper: {	obj:null,
					    gridSize:null,	
						visible:false,																//Set to true to see grid and minimum visual y for image									
						colorGrid:"green",															//Default CSS color for grid
						colorCenter:"white",														//Default CSS color for grid's centerline
						divisions:10, 																//Defuault number of divisions for GridHelper
						controller:{visible:"boolean", 
									colorGrid:"color", 
									colorCenter:"color", 
									divisions:{type:"number",minMaxStep: [2,20,1]}}
					}, 	
        stats: null, 																			    //Stats Performance display					

		visualGroup: null,																			//All the objects displayed in the scene.  It's a child of sceneGroup
		sceneGroup: null,																			//Collection of of sub objects for easy transformation

		animationFrame: null,																		//Animation Frame used for rendering //https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/

		//Methods specific to threejs scene 													
		rebuildGridHelper: fnRebuildGridHelper,														//Rebuild the visualization grid helper
		showBirdsEyeView: fnShowBirdsEyeView,														//Bird's Eye View
		rotate: fnRotate,																			//Rotate the image in the visualization	
		

		visualData: null,																				//Data for visualization
		keyDataName: null,                                                                              //The key value for the data file	
		dataTypes:[],																					//Data Types ColumnName: {type: text/float, numDecimals: n}

		visual: null,																					//The gltf file to be loaded
		keyVisualName: "name",																			//The key vale for the visual file, defaults to name property of objects, but can be overrriden				
		visualizeProp: "visualize",																		//The property in the GLTF file that designates meshes to visulize

		selectionLinks:[],																				//Array of selection links

	
	    visualGrid: null,
		visualGridProps: null,
	   
		selectedScale: {scaleIndex: 0, direction: 0},													//The index into the scale array built by fnGetD3Scales, direction: 0: LowHigh, 1: HighLow

		storedScaleColors: {}, 																			//Optimizes retrieval of color scaled columns
		activeGridColumn: null,																			//The currently active column with the most recent onClick event processed on it	
		searching: false,																			    //Set to true if dataGird or visualGrid initiated search, prevents deadly embrace	
		
		legendContainer: null,																			//The DOM container for the generated legend
		
		//Methods			
		setVisualizeProp: fnSetVisualizeProp,															//Override default value of "visualize" for visualizeProp
		setVisual: fnSetVisual,
		setVisualData: fnSetVisualData,
		join: fnJoin,																					//Join data to visual
		setActiveGridColumn: fnSetActiveGridColumn,														//Programatically pre-set the column to be displayed: columnName,scale																																							// optional scale: array: [scale], [scaleHL] or [colorLow,colorHigh]				
		addSelectionLink: addSelectionLink,		
		display: fnDisplay,																				//Invoked to render thes scene
		showLink: fnShowLink,
		setCallBackReload: fnSetCallBackReload,		
		resize: null, 																					//resize method...callback assigned by fnGetResizeCallback() at initialization of the dataVisualizer	
		callBackReloadTimer: null,																			//Reference to calling programs reload data function
		callBackVisualScaling: null,																	//Reference to calling programs that handle scale processing
		setCallBackVisualScaling: fnCallBackVisualScaling,												//Method to set callBackVisualScaling
		getPreOrScaleColorColumns:fnGetPreOrScaleColorColumns,										    //Get the Columns: predefined colors or scaling {predefinedColors: predefinedColors, scalingColumns: scalingColumns}
		isPresetColor: fnIsPresetColor,
		setLegendContainer: fnSetLegendContainer,														//Method to set the legend container
		destroy: fnDestroy,																				//Used at initialization and if loading different files by interface to clean-out the current visualization
		
		
	} //properties

				
	fnDestroy();																						//Re-set on initialization
	
	// SET SCENE PROPERTIES
	if (overrideProperties) 
		fnSetSceneProperties(overrideProperties);													//Use Override properties if they were set
	
	return properties;																				//Return the complete properties object to caller

	/////////////////////////////////////////////////////////////////M E T H O D S ////////////////////////////////////////////////////////////////////////////////////

	
	function fnCallBackVisualScaling(callBack){
		
		properties.callBackVisualScaling = callBack;
		
	}
	
	function fnSetLegendContainer(container){
		
		properties.legendContainer =  container;
		
	} //fnSetLegendContainer
	
	
	function fnSetActiveGridColumn(column){
		
		properties.activeGridColumn = column;
		
	}//fnSetActiveGridColumn
	
	
	function fnShowLink(recid, linkNum){
			
				if (recid == -1) return;  //first 'option' is "Links..." text
			
				var link = properties.selectionLinks[linkNum];
			
				var linkParms = [];
				
				Object.keys(link).forEach(function(parm) {
								if (parm != "url" && parm != "urlText") 
										linkParms.push(encodeURI(parm + "=" +  properties.visualData[recid][link[parm]]) );  //Booyah!
						});	
				window.open(link.url + linkParms.join("&"),"_blank");;
																									
			
	} //fnShowLink	
	
	
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
	
	function fnGetContainerWidthHeight(container){

		var width = $(container).width() == 0 ? container.parentElement.clientWidth :  $(container).width();
		var height = $(container).height() == 0 ? container.parentElement.clientHeight :  $(container).height();
		return { width: width,  height: height };
		
	} //fnGetContainerWidthHeight	
	
	function fnJoin(keyDataName,keyVisualName){
		
		properties.keyDataName = keyDataName;
		properties.keyVisualName = keyVisualName;
		
		//Retrieve index of visualData as follows:   dataIndex = properties.visualDataMap.get(properties.visualData[i][keyDataName])
		//Rerieve the complete visualData record for the the given keyDataName as follows:  properties.visualData[dataIndex] 
		properties.visualDataMap =  new HashMap();    //https://github.com/flesler/hashmap
		
		for (var i = 0; i < properties.visualData.length; i++ ){	
			properties.visualDataMap.set(properties.visualData[i][keyDataName],i);	//Will be used with raycasting logic when identifying what a user selects visually	
			//To retreieve data row for given keyDataName: properties.visualData[properties.visualDataMap.get(keyDataName])]
		} //for

		
		//DETERMINE DATATYPES (properties.dataTypes)
		fnGetDataTypes(properties.visualData)
																				
		fnBuildDataGrid();   //with DataTypes determined, build the data grid
				
		properties.activeGridColumn = keyDataName;   //Can be overriden with fnSetActiveGridColumn
		
		
	} //fnJoin

	function fnGetDataTypes(visualizeData) {	
	
		for (var i = 0; i < visualizeData.length; i++ ){
										
			// CALCULATE DATATYPES by inspecting each column of each row 	
				var mergedRow = i == 0 ? {} : mergedRow;
				Object.assign(mergedRow, visualizeData[i]);
				var aKeys = Object.keys(mergedRow);
				aKeys.forEach(function(key) { 
					if (properties.dataTypes[key]) {
						properties.dataTypes[key].type = properties.dataTypes[key].type == "text" ?  "text"  :  isNaN(Number(mergedRow[key])) ? "text" : "float";
					} //if
					else {
						properties.dataTypes[key] =  {type: isNaN(Number(mergedRow[key])) ? "text" : "float"};
					} //else
						
						
					
				}); //aKeys.forEach
																				
		} //for 	
		
		//For float type, determine number of decimal places and aUniqueCategories

		var aKeys = Object.keys(visualizeData[0]);
		aKeys.forEach(function(key) { 
		
			if (properties.dataTypes[key].type == "float") {
				
				properties.dataTypes[key].numDecimals = 0;
				for (var i = 0; i < visualizeData.length; i++ ){
					
					properties.dataTypes[key].numDecimals = Math.max( properties.dataTypes[key].numDecimals,fnDecimaPlaces(visualizeData[i][key]));
	
				}//for
				
			} //if
			
			var dataType =  properties.dataTypes[key].type;
			
			properties.dataTypes[key].aUniqueCategories = fnUnique(visualizeData.map(function (row) {return dataType == "float" ? parseFloat(row[key]): row[key]}) )
				.sort(function(a,b){  //https://stackoverflow.com/questions/4373018/sort-array-of-numeric-alphabetical-elements-natural-sort
					  var a1=typeof a, b1=typeof b;
					  return a1<b1 ? -1 : a1>b1 ? 1 : a<b ? -1 : a>b ? 1 : 0;
				});

		}); //aKeys.forEach
																			
	} // fnGetDataTypes
	
	
	function fnSetVisualizeProp(visualizeProp){
		
		properties.visualizeProp = visualizeProp;
		
	} //fnSetVisualizeProp
	
	function fnSetSceneBackgroundColor (color) { 
				
		properties["scene"].obj.background.set(color);
									
	} //fnSetSceneBackgroundColor
	
	
	function translate(prop){
		return properties.translations[properties.localLanguage][prop];			
	} //translate		
	
	function fnSetVisualData(visualData){
		
		properties.visualData = visualData;		
		
	} // fnSetVisualData
	
	function fnSetVisual(visual){
		properties.visual = visual;	
	} //fnSetVisual
	
	function addSelectionLink(link) {
			properties.selectionLinks.push(link);
	} //addSelectionLink
		

	function fnSetCallBackReload(fnReload){
		properties.fnReload = fnReload;
	} //setCallBackReload	
	
	function fnRefreshData(action){
		
		switch(action) {
			case "toggle":
			
				//var refreshText = w2ui.dataGrid.toolbar.get("refreshData").caption;
				var refreshText = w2ui.dataGrid.toolbar.get("refreshData").text;
				switch (refreshText){
					case translate("datGuiFolders.refresh"):
						fnRefreshData("start");
						break;
					default:	
						fnRefreshData("stop");	
				} //switch
				break;

			case "start":  
			
				properties.dataRefreshing = true;
				fnReloadTimer();
				break;
			
			case "stop":

				window.clearInterval(properties.callBackReloadTimer);
				properties.dataRefreshing =  false;
				properties.callBackReloadTimer = null;
				if (w2ui.dataGrid) 
					//w2ui.dataGrid.toolbar.set("refreshData", {caption: translate("datGuiFolders.refresh")} );
					w2ui.dataGrid.toolbar.set("refreshData", {text: translate("datGuiFolders.refresh")} );
				break;
		
		} //switch
		
	} //fnRefreshData

	//if (properties.callBackReloadTimer) w2ui.dataGrid.toolbar.set("refreshData", {caption: translate("datGuiLoadingMsg") } );
	if (properties.callBackReloadTimer) w2ui.dataGrid.toolbar.set("refreshData", {text: translate("datGuiLoadingMsg") } );
	
	
	//Countdown timer from: https://www.w3schools.com/howto/howto_js_countdown.asp
	function fnReloadTimer() {

		//w2ui.dataGrid.toolbar.set("refreshData", {caption: translate("datGuiLoadingMsg") } );		
		w2ui.dataGrid.toolbar.set("refreshData", {text: translate("datGuiLoadingMsg") } );		
		properties.fnReload();
		properties.nextRefresh = new Date();
		var refreshTime = Math.max(1,properties.refreshTime); //minimum of 1 minute interval, incase developer used fractional time
		properties.nextRefresh.setMinutes(properties.nextRefresh.getMinutes() + refreshTime ); //Minimum of 1 minutes
		//properties.nextRefresh.setSeconds(properties.nextRefresh.getSeconds() + 10);  //for testing every 10 seconds

	properties.callBackReloadTimer = 
		window.setInterval(	function() {

								  // Find the timeDiff between now an the count down date
								  var timeDiff = properties.nextRefresh - new Date().getTime()
								
								  // Time calculations for days, hours, minutes and seconds
								 // var days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
								 // var hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
								  var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
								  var seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

								  //if (timeDiff > 0) w2ui.dataGrid.toolbar.set("refreshData", {caption: translate("datGuiStopRefreshMsg") + " " + minutes + "m " + seconds + "s "} );
								  if (timeDiff > 0) w2ui.dataGrid.toolbar.set("refreshData", {text: translate("datGuiStopRefreshMsg") + " " + minutes + "m " + seconds + "s "} );
									//w2ui.dataGrid.refresh();
									//fnGridSelectColumn(this, properties.activeGridColumn);		

								  // If the count down is finished, call function reload
								  if (timeDiff < 0) {
										//w2ui.dataGrid.toolbar.set("refreshData", {caption: translate("datGuiLoadingMsg") } );
										w2ui.dataGrid.toolbar.set("refreshData", {text: translate("datGuiLoadingMsg") } );
										w2ui.dataGrid.refresh();
										
										
										properties.fnReload();	
										
										var nowPlusRefresh = new Date();
										nowPlusRefresh = nowPlusRefresh.setMinutes(nowPlusRefresh.getMinutes() + refreshTime ); 
										//nowPlusRefresh = nowPlusRefresh.setSeconds(nowPlusRefresh.getSeconds() + 10);  //For testing every 10 seconds
										properties.nextRefresh = nowPlusRefresh;
								  }
							}, 1000 //Invoke timer every second
						);  		
				
	} //fnReloadTimer
	
	
	function fnBuildDataGrid(){
			
		properties.dataGridProps  = fnGetDataGridProperties(properties.visualData); 
		
		if (!properties.dataRefreshing) {
			properties.dataGrid = $().w2grid(properties.dataGridProps);		
			properties.dataGrid._this_visualizer_properties = properties;   //Save this app properties so that grid column render methods can refer to it	
		}	
		else { //Else reuse the existing grid
	
			// $.extend(true,properties.dataGrid,properties.dataGridProps);  //Won't work, replaces toolbar.items array rather than merging it
			["columns","columnGroups","records","sortData","searches"]
				.forEach(function(key){
					
					properties.dataGrid[key] = properties.dataGridProps[key];   //replace possibly newly build sub-components of dataGrid from re-load of data
						
				}); //forEach
			
			
			properties.dataGrid.render();
			
		}// else
	}//fnBuildDataGrid
	
	function fnDestroyDataGrid(){
		
		// Create (or recreate) the data grid
		if (properties.dataGrid){
			properties.dataGrid.destroy();
			properties.dataGrid._this_visualizer_properties = null;			
		}		
		
	}//fnDestroyDataGrid
		
	function fnBuildVisualGrid(){
		
		properties.visualGridProps  = fnGetVisualGridProperties(properties.visualObjectMap); 		   //Build the visualGrid
		properties.visualGrid = $().w2grid(properties.visualGridProps);
		//properties.visualGrid._this_visualizer_properties = properties;   //Save this app properties so that grid column render methods can refer to it	
				
	
	} //fnBuildVisualGrid
	
	function fnDestroyVisualGrid(){

		//Create(or recreate) the visual grid	
		if (properties.visualGrid) {
			properties.visualGrid.destroy();
			//properties.visualGrid._this_visualizer_properties  = null
		}	
		
	} //fnDestroyVisualGrid
	
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
			fnBuildVisualGrid();
			
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
		
		fnDestroyDataGrid();
		fnDestroyVisualGrid();
						
		// CLEAR (see https://github.com/mrdoob/three.js/issues/385 )
		THREE.Object3D.prototype.clear = function(){
		var children = this.children;
			for(var i = children.length-1;i>=0;i--){
				var child = children[i];
				child.clear();
				this.remove(child);
			};
		};


		if (properties.animationFrame) window.cancelAnimationFrame(properties.animationFrame);
		if (properties.scene.obj) {
			properties.scene.obj.clear(); 
			doDispose(properties.scene.obj);
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
			if (properties[prop] && properties[prop].hasOwnProperty("obj")) properties[prop].obj = null;
		} //for
			
	
		//Clear any timers
		
		if (!properties.dataRefreshing) {
			if (properties.callBackReloadTimer) window.clearInterval(properties.callBackReloadTimer);
		} //if

		//Remove window event listeners that reference fnfnHandleKeyMouse so reference to 'propeties' is freed-up
		if (typeof properties.fnHandleKeyMouse != "undefined") {
			document.removeEventListener( 'keydown', properties.fnHandleKeyMouse );								
			document.removeEventListener( 'mousedown', properties.fnHandleKeyMouse);	
			document.removeEventListener( 'mouseup', properties.fnHandleKeyMouse);
			document.removeEventListener( 'dblclick', properties.fnHandleKeyMouse);
		} //if	
	
	} //fnDestroy
	
	//https://stackoverflow.com/questions/22565737/cleanup-threejs-scene-leak
	function doDispose (obj){
        if (obj !== null){
            for (var i = 0; i < obj.children.length; i++){
                doDispose(obj.children[i]);
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
    } //doDispose
	
	// SET SCENE PROPERTIES
	function fnSetSceneProperties(overrideProperties) {
		
		properties.visualData = overrideProperties.visualData ? overrideProperties.visualData : properties.visualData;					//Use override data/schema if they exists.
		properties.schema = overrideProperties.schema ? overrideProperties.schema : properties.schema;
				
		$.extend(true,properties,overrideProperties);														//Deep extend: http://api.jquery.com/jQuery.extend/
				
		
	} //fnSetSceneProperties	
	
	//Display pop-up Window
	function fnPopUp(title,html,wf,hf){ 
		w2popup.open({	title: title,
						body: html,
						buttons   : '<button onclick="w2popup.close();">' + translate("popUpClose") + '</button>',	
						showMax: false,
						showClose: true,
						width: properties.containerWidth/wf,
						height: properties.containerHeight/hf,
						modal: false
					 });
	} // fnPopUp	

	

	
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
			properties.animationFrame = window.requestAnimationFrame( animate );						//https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/			
			properties.renderer.obj.render( properties.scene.obj, properties.camera.obj );		
			properties.controls.obj.update();
			properties.stats.update();

	}
	
	
			
	function fnClearSelectionAndSearch(){

		fnClearIsolateSelections("clear");
		if(properties.dataGrid)	properties.dataGrid.searchReset(false);  //http://w2ui.com/web/docs/1.5/w2grid.searchReset
	} //	
	
	// beyeV ORBITAL CONTROL
	function fnShowBirdsEyeView() {
		
		//if (properties.camera.obj.position.y != properties.gridHelper.gridSize) {
		
			properties.controls.obj.reset();
		
		//}
	
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
				
		// SCENE
		properties.scene.obj = new THREE.Scene();
		properties.scene.obj.background  = new THREE.Color(properties.scene.background);	
		
		
		//Visual
		
		// SCENE COMPONENTS
		// Adds objects to  properties.visualGroup.  The fnBuildVisual method is set in fnBuildVisual and is data dependent
        // Objects are built color-less	
        ///		
		properties.visualGroup = fnBuildVisual();
		
		//Quick lookup map for all the meshes (objects) that will be data driven in the visualization
		//Visualizable object in the visual can be iterated throught with properties.visualObjectMap.forEach....; as opposed to traveresing the visual and re-searching for visualizeProp
		properties.visualObjectMap = new HashMap();    //https://github.com/flesler/hashmap

		var i = 0;
		properties.visualGroup.traverse(function (node) {  //object may be a node deep in the mesh hiearchy	
			if (node.userData){
				if (node.userData[properties.visualizeProp]) {    //only if it's a visualize-able object
					properties.visualObjectMap.set(node.uuid, node[properties.keyVisualName]); 
				}//if	
			}//if	
		});		
		
		
		//Add visual created during join to the scene's parent group
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


		//Determine maximum height of the warehouse.  It will be used to scale the activity risers...multiply by a factor 'rise' above the slots													
		//var maxY = 
		//	properties.boundingBox.obj.geometry.boundingBox.max.y - properties.boundingBox.obj.geometry.boundingBox.min.y;
		//var riserMaxFactor = 3;	
		//properties.riserMaxHeight = maxY * riserMaxFactor;  //Also used by from/to arrows

		
		// LIGHT
		properties.scene.obj.add(new THREE.AmbientLight(0xffffff,0.5));
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
		properties.scene.obj.add(properties.camera.obj);
		

		// RENDERER
		if ( Detector.webgl )
			properties.renderer.obj = new THREE.WebGLRenderer( {antialias:true} );
		else
			properties.renderer.obj = new THREE.CanvasRenderer(); 

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
				
			
		
		// KEY AND MOUSE Click HANDLER
		properties.fnHandleKeyMouse = function (event){
			

		
			event = event || window.event;			
			/* This works, but offsetX relative to domElement is more straightforward
			var rendererDOM = properties.renderer.obj.domElement ;
			var renderOffsetX = $(rendererDOM).offset().left - $(window).scrollLeft(); //https://stackoverflow.com/questions/3714628/jquery-get-the-location-of-an-element-relative-to-window
			var renderOffsetY = $(rendererDOM).offset().top  - $(window).scrollTop();
			
			
			properties.offsetX=   event.clientX - renderOffsetX ;   //relative to the container's offset	https://stackoverflow.com/questions/16154857/how-can-i-get-the-mouse-coordinates-relative-to-a-parent-div-javascript
			properties.offsetY =  event.clientY - renderOffsetY ;    //relative to the container's offset 
			*/
			
			
			
			if (!event.target === properties.renderer.obj.domElement) return; //Only handle events for visualization;
			
			properties.offsetX= event.offsetX;
			properties.offsetY = event.offsetY;
			

			if (properties.WebFOCUS) {  //WebFOCUS Extension support

				var content = properties.renderConfig.moonbeamInstance.getSeries(0).tooltip;    //Base Content																				

				// tooltip style is an object full of CSS properties and values
				var tooltip_style = {
					background: 'lightgrey',
					borderWidth: '5px',
					borderStyle: 'solid',
					borderColor: 'grey',
					borderRadius: '5px'
				};

				var tooltip_properties = {
							 fill: 'lightgrey',
							 border: {},
							 cascadeMenuStyle: {
							 hover: { labelColor: '#000000', fill: '#D8BFD8'}
							 }
				};	


				properties.tooltip = tdgchart.createExternalToolTip(container, "vwTooltip"); 
				properties.tooltip
					.style(tooltip_style)
					.properties(tooltip_properties)
					.autoHide(true);											
															

			}
			

			switch(event.type){
				case "keydown":
				   	if (!event.ctrlKey) {
						//http://www.asciitable.com/
						switch(event.keyCode) {
							case 66: 				//key = 'b'
								fnShowBirdsEyeView();
								break;
							case 27:                //key = 'Escape'			
							case 67:				//key = 'c'
								fnClearSelectionAndSearch();	
								break;
							case 68:				//key = 'd'
								//fnShowDataGrid();	
								break;	
						} //switch
					}// if
					break;
				case "mousedown":				
					var visualObjSelected = fnGetSelectedObj(properties);
					if (visualObjSelected) 	{			
						if (event.ctrlKey) {

							fnSearchVisualObjSelected(visualObjSelected);
						
						} //if
						else {

							if (properties.WebFOCUS && visualObjSelected.userData[properties.visualizeProp]) {  //WebFOCUS..show tooltip

								fnSearchVisualObjSelected(visualObjSelected);

								var offset = properties.visualDataMap.get(visualObjSelected[properties.keyVisualName]);
								var ids = {series: 0, group: offset};	
								var data = properties.renderConfig.data;	
								properties.tooltip
									.content(content, data[offset], data, ids)	
									.position(event.clientX , event.clientY)   //Takes into account main or selection
									.show();												
							} //if					
						
						} //else
							
					} // if
					break;							
				case "mouseup":
					break;
				case "dblclick":
				
							var visualObjSelected = fnGetSelectedObj(properties);

							if (visualObjSelected) {
								if (properties.WebFOCUS && visualObjSelected.userData[properties.visualizeProp]) {  //WebFOCUS Drilldown

									fnSearchVisualObjSelected(visualObjSelected);

									var offset = properties.visualDataMap.get(visualObjSelected[properties.keyVisualName]);
									var chart = properties.renderConfig.moonbeamInstance;
									
									
									var ids = {series: 0, group: offset};	
									var data = properties.renderConfig.data;
									var ddType = (chart.eventDispatcher.events.length != 0) ? "single" : "multi";
									
									switch (ddType) {
									
										case "single":
											var dispatcher = chart.eventDispatcher.events.find(function (obj) { return obj.series == 0});
											var localURL = chart.parseTemplate(dispatcher.url, data[offset], data, ids);
											if (dispatcher.target) {
															window.open(localURL, dispatcher.target);
											} //if
											else {
															document.location = localURL;
											} //else										
										
											break;
										
										case "multi":
											//New WebFOCUS Extension logic for showing tooltip		

											properties.tooltip
												.content(content, data[offset], data, ids)	
												//.content([" offset: " + offset])   //for debugging
												//.position(properties.offsetX, properties.offsetY)
												.position(event.clientX , event.clientY)   //Takes into account main or selection
												.show();
											break;
										default:
									
									} //switch

								} //if
								
								else {
									
									fnSearchVisualObjSelected(visualObjSelected);
								
								} //else
							} //if
			
				default:	
			} //switch
			
			
			function fnSearchVisualObjSelected(visualObjSelected){

				properties.dataGrid.searchReset(false);  //Reset search (trigger search logic), but don't refresh the grid http://w2ui.com/web/docs/1.5/w2grid.searchReset
				properties.dataGrid.search(properties.keyDataName, visualObjSelected[properties.keyVisualName] );  //An effective join	
				
			} //fnSearchVisualObjSelected

		
			
		}//properties.fnHandleKeyMouse
		
		
		// EVENTS
		document.addEventListener( 'keydown', properties.fnHandleKeyMouse , false );								//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
		document.addEventListener( 'mousedown', properties.fnHandleKeyMouse, false );	
		document.addEventListener( 'mouseup', properties.fnHandleKeyMouse, false );
		document.addEventListener( 'dblclick', properties.fnHandleKeyMouse, false );		
		
		
		
		//RETURN
		return;
		
		
			
		//USE RAYCASTING TO DETERMINE SELECT OBJECT
		function fnGetSelectedObj(properties){

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
			
			var intersects = properties.raycaster.intersectObjects( grouping.children,true );
			
			if (intersects.length == 0) return null;
			
			var visualParent = fnGetVisualizeableParent(intersects[0].object);
			if (visualParent) return visualParent;
			
			//Otherwise determine if raycaster intersect childs (or its parent) are desginated for visualization and return it
			var selectedObject = null;
	
			intersects.some(function(intersect) {  //Find the intersect (or its parent) that can be visualized	
				
				selectedObject = fnGetVisualizeableParent(intersect.object);
				if (selectedObject) return true;
			
				if (intersect.object.userData){
					selectedObject = intersect.object.userData[properties.visualizeProp] ? intersect.object : null;
					return intersect.object.userData[properties.visualizeProp];
				} //if
				else {
					return false;
				} //else
				
			}); //intersects.some
		
			return selectedObject;
			
			function fnGetVisualizeableParent(visualObj){
				
				//If parent is designated for visualization, return it
				if (visualObj.parent){
					if (visualObj.parent.userData){
						if (visualObj.parent.userData[properties.visualizeProp]){
							return visualObj.parent;
						}
					}		
				}//if				
				
				return null;
				
			} //fnGetVisualizeableParent 
			
			
			
						
		} // fnGetSelectedObj
		
		
			
	} //fnBuildScene()
	
	//Build a Three.js group of for the visual object from the gltf file. 
    //Discussion on Model, View and Projection matrices: http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/#the-model-view-and-projection-matrices	
	function fnBuildVisual() {
	
		var visualGroup = new THREE.Group();  															//Containing the whole image allows for possible complete transforms later
		visualGroup.name = "visual";
																										//In Threejs space, image is laid out relative to 0,0,0		
		var	visual = properties.visual;

		/*
		visual.scene.traverse( function ( node ) {

			if ( node.isMesh || node.isLight ) node.castShadow = true;
			
		} );
		*/
		
		//var meshes = visual.scene.children.filter(function(node){return node.isMesh || node.isGroup});	
		//meshes.forEach(function(mesh){visual.add(mesh.clone())});	
		visualGroup.add(visual.scene.clone());	

		visualGroup.traverse(function (node) {  //object may be a node deep in the mesh hiearchy	
			if (node.userData){
				if (node.userData[properties.visualizeProp]) {    //GLTF file would have associated with mesh:  {Blender: ...."extras": {"visualize": 1.0} ...}, In Blender it's custom property: https://docs.blender.org/manual/en/latest/data_system/custom_properties.html
				    //node[properties.keyVisualName] maps (joins) to properties.keyDataName
					//Testing userData[properties.visualizeProp] (values '1' or '0') allows program to determine if CAD designer wants object to be data driven
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
	
	// GET PREDEFINED COLORS and SCALING COLUMNS
	function fnGetPreOrScaleColorColumns() {
	
		var predefinedColors = [];
		var scalingColumns = [];
		if (properties.dataTypes) {
			Object.keys(properties.dataTypes).forEach(function(column) {
											column.indexOf(properties.colorPrefix) != -1 && column != "recid" ?  
												predefinedColors.push(column.split(properties.colorPrefix)[1] + " (C)" )  : 
												scalingColumns.push(column)
										 } //function
			); //forEach
		} //if
		return {predefinedColors: predefinedColors, scalingColumns: scalingColumns}
	
	} //fnGetPreOrScaleColorColumns	

	
	//*************fnDataGridColumnRender
	function fnDataGridColumnRender(record, row_index, column_index) {	
	
		var fieldColorColumn = this.columns[column_index].field;
		var fieldText = fieldColorColumn == "recid" ? record.recid + 1 : record[fieldColorColumn];  //Add 1 to zero-based recid for display
		var predDefinedColor = fnIsPresetColor(fieldColorColumn);
		var fieldValueColumn = predDefinedColor ? this.columns[column_index -1].field : this.columns[column_index].field ;	//For predefined colors columns, reference the column to its left	
		var fieldValueType = properties.dataTypes[fieldValueColumn].type;	
	
		if (!this.toolbar.get('styleGrid').checked)   //No visualization formatting
			return predDefinedColor ? fieldText : fieldValueType == "float" ?   d3.format(",")(fieldText) : fieldText;
	
		//Logic for 'Visualize Grid Data' option 
	
		var numDecimals = 	properties.dataTypes[fieldValueColumn].numDecimals;
		var fieldValue = record[fieldValueColumn];		
		var dataRecordIndex = record.recid;  //The actual index into the data
		
		var color = predDefinedColor ? 
				record[this.columns[column_index].field] : 
				fnGetObjectScaleColorAndOptionallyVisualize(properties.visualData, fieldValueColumn, dataRecordIndex, properties.keyDataName);   
				
		var divWidth;
		if (fieldValueType == "float"){
					
				var columnAttributes = fnGetColumnAttributes(fieldValueColumn);	

				var minPixels = 50;
				var maxPixels = 100;
				var scale = d3.scaleLinear()
							.domain([columnAttributes.minScale, columnAttributes.maxScale])
							.range([minPixels, maxPixels]);
				divWidth = scale(fieldValue);																		

			
		}//if	
		
		divWidth = (fieldValueType == "float") ? divWidth : 100;
		
		var div = $(document.createElement("DIV"))  //https://www.quora.com/How-do-you-create-a-box-filled-with-a-color-with-HTML-CSS
						.css({"width": divWidth + "px"})
						.css({"outline-style": "solid", "outline-width": "thin"})
						.css({"line-height":"25px", "height":"25px", "vertical-align":"center"})
						.css({"background-color": color, "opacity":"1"});
		
		$(document.createElement("SPAN"))
			.css({"background-color": "white", "opacity":".8"})  //Displays the text in a slighlty opaque box
			.text(predDefinedColor ? fieldText : fieldValueType == "float" ?   d3.format(",")(fieldText) : fieldText)
			.appendTo(div);
						
						
		
		return "&nbsp;" + div[0].outerHTML;													
																																
	} //fnDataGridColumnRender
			
	// BUILD DATAGRID	
	function fnGetDataGridProperties(data) {
															
		var gridRecords =  $.extend(true,[],data); //make copy 	

		properties.dataTypes.recid = {type: "float", numDecimals: 0, aUniqueCategories: []};
				
		var dataTypes = properties.dataTypes;
							
		var dataFields = Object.keys(gridRecords[0]);
		
		var floatFields = dataFields
							 .filter(function (key){ return dataTypes[key].type == "float"; });
		
		gridRecords.forEach(function (record, i){
																
								record.recid = i;  //Add recid which is reserved for data grid, can not be a recored in visual data	
								properties.dataTypes.recid.aUniqueCategories.push(record.recid); //Add entry into recid's unique categories...for Legend generation	

								/*  Not needed if using d3.autoType to properly convert string numerics to numeric: https://github.com/d3/d3-dsv/blob/master/README.md#autoType
								floatFields.forEach(function(field){
									record[field] = parseFloat(record[field]);  //Must make fields actual numeric for proper sorting
								}); // floatFields.forEach
								*/	
								
		}); //gridRecords.forEach 
		
		
		var columns = [];
		
		columns.push({field:"recid", caption:"Data Row", sortable:true, searchable:true, hidden: false, render: fnDataGridColumnRender });   //Always located in column 1 associted with key used for join in Column 2
		columns.push({field:properties.keyDataName, caption: properties.keyDataName + " (Data Key)", //Always in column 2
						 render: fnDataGridColumnRender, sortable:true, searchable:true , hidden: false} 
					  );	
					  
		if (dataTypes[properties.colorPrefix + properties.keyDataName]) //position here for column grouping
			columns.push( {field: properties.colorPrefix +  properties.keyDataName, 
							caption:"Color (Preset)" , 
							render: fnDataGridColumnRender, 
							sortable: true, hidden: false, 
							searchable: true} );	//if key has color, Column 3	  
			
		//***********************************	
		//Start Columns 4 through dataFields.length					
		//***********************************

		bColorField = false;  //Tracks Pre-assigned color fields	

		dataFields
			.filter(function(columnName){return columnName != "recid" })			
			.filter(function(columnName){return columnName != properties.keyDataName })			
			.filter(function(columnName){return !fnIsPresetColor(columnName)  })
			.forEach(function(field,i){ 
			
							if (field != properties.keyDataName){
								var column = {field:field, caption:field + " (Scaled)", sortable: true, searchable: true, hidden: false, render: fnDataGridColumnRender};
								columns.push(column);
								
							} //if
							
							if (dataTypes[properties.colorPrefix + field]){ //If the current field in loop also has predefined color; position here for column grouping
								columns[columns.length - 1].caption =  "Value (Scaled)";
								
								var colorColumn = {field: properties.colorPrefix + field, hidden: false, 
													caption: "Color (Preset)", sortable: true, searchable: false, render: fnDataGridColumnRender};
								
								columns.push( colorColumn );
								
								bColorField = true;   //data has at least 1 pre-set color field
							} //if	, 

		}); //dataField.forEach		
						
	
		if (properties.selectionLinks.length > 0) {
			columns.push({field: "_links", caption:"Link(s)", sortable: false, searchable: false, hidden: false,
						  render: function(record,rowIndex,columnIndex) {
							
									var select = "<select "
									select += " style='width: 100% !important;'"; //Fix for select width issue when rendered in column: https://github.com/vitmalina/w2ui/issues/1827#issuecomment-494770546
									select += " onchange='";
									select += "var grid = $(this).closest(\"*[id*=grid]\");";
									select += "var appProperties = w2ui[grid.attr(\"id\").split(\"_\")[1]]._this_visualizer_properties;";  //  https://www.w3schools.com/jquery/traversing_closest.asp and https://stackoverflow.com/questions/1487792/jquery-find-element-whose-id-has-a-particular-pattern
									select += "appProperties.showLink(this.value,$(this.options[this.selectedIndex]).attr(&quot;linknum&quot;) );'"; 
									select += '<option value=-1 linknum=-1>Links...</option>';	
									//var select = "<select onchange=' fnShowLink(this.value,$(this.options[this.selectedIndex]).attr(&quot;linknum&quot;) );'>";
									var options = "<option value=-1 linknum=-1>Links...</option>"
								
									properties.selectionLinks.forEach( function(selection,i){
										
										linkParms = [];
										Object.keys(selection).forEach(function(parm) {
														if (parm != "url" && parm != "urlText") 
																linkParms.push(properties.visualData[record.recid][selection[parm]]) ;  //Booyah Booyah!
												});										
										  options = options + "<option value=" + record.recid  +  " linknum=" + i +   " >" + selection.urlText + " (" + linkParms.join() +")</option>" ;
									}); //forEach
								
									return select + options + "</select>";

								} //render 
						   } //push object

			);	//columns.push method
			
		} //if	
			//Finally add hidden sort fields
	

			
		//***********************************	
		//End Columns 4 through dataFields.length					
		//***********************************
					

		
		var columnGroups = [];
		
		if (bColorField){
			
			columnGroups= [
					{caption: 'Row', span: 1, master: true}				
			]
			
			for (var i = 1; i < columns.length - 1; i++){  //skip over recid
				if ( !fnIsPresetColor(columns[i].field) && !columns[i].hidden ){
					
					if (dataTypes[properties.colorPrefix + columns[i].field]){
						
						columnGroups.push({caption: columns[i].field, span: 2, master: false})
						
					}	
					else {
						
						columnGroups.push({caption: columns[i].field, span: 1, master: true})
					}
					
				} //if
				
			}
			
			if (columns[columns.length -1].field == "_links") 
				columnGroups.push({caption: "Link(s)", span: 1, master: true});
			
		
		}
		
		
		return {
			name		: "dataGrid",		
			columns		: columns,				
			columnGroups: columnGroups,
			recordHeight: properties.selectionLinks.length > 0 ? 50 : 24,	
			records		: gridRecords,    																		
			show: 		{
							toolbar: true,
							toolbarReload: false,
							footer: true,
							selectColumn: true,
							footer: true,								
					
						},

			sortData: 	columns
							.filter(function(row){return row.field != "_links"; })	
							.map(function(row){ return {field: row.field, direction: "ASC" } }) ,	
								
			searches: 	columns
							.filter(function(row){return row.field != "_links"; })
							.map(function(row,i, arr){ return {field: row.field, 
															   caption: fnIsPresetColor(row.field) ? arr[i-1].field + " COLOR" : row.field, 
															   //type: dataTypes[row.field] ? dataTypes[row.field].type : "text" } 
															   type: dataTypes[row.field] ? dataTypes[row.field].type : "t" } 
															  }),			
		
			multiSearch : true,
			multiSelect: true,
			multiSort: true,

			toolbar: {
				items: [
					{type: 'break'},
					{type: 'check', id: 'styleGrid', caption: "Visualize Grid", checked: false, tooltip: 'Visualize Data on Grid'},
					{type: 'break'},
					//{type: 'button', id: 'downloadButton', caption: translate("downLoadData"), tooltip: 'Download .csv file of current data grid'} 
					{type: 'button', id: 'downloadButton', caption: "Download", tooltip: 'Download .csv file of current data grid'} 
					,{type: 'break'},
					{type: 'button',
							id: 'refreshData', 
							//caption:	properties.dataRefreshing ?  translate("datGuiLoadingMsg") : translate("datGuiFolders.refresh"), 
							//bug with w2ui.dataGrid.toolbar.set, use text: instead
							//text:	properties.dataRefreshing ?  translate("datGuiLoadingMsg") : translate("datGuiFolders.refresh"), 
							text:	properties.dataRefreshing ?  translate("datGuiLoadingMsg") : "Refresh",  //Must use text not caption...bug with caption in w2ui
							tooltip: properties.dataRefreshing ?  translate("datGuiLoadingMsg") : translate("datGuiFolders.refresh"),
					}
					],	
				
				onRender: function(event){
						event.onComplete =  function(){

								//if (properties.callBackReloadTimer) w2ui.dataGrid.toolbar.set("refreshData", {caption: translate("datGuiLoadingMsg") } );
								if (properties.callBackReloadTimer) w2ui.dataGrid.toolbar.set("refreshData", {text: translate("datGuiLoadingMsg") } );

						}; //onComplete
				},
				onResize: function(event){
						event.onComplete =  function(){
								if (properties.bInitiating){
									properties.bInitiating =  false;
									w2ui.dataGrid.columnClick(properties.keyDataName);
								}
						}; //onComplete
				}
				,									
				onClick: function (target, data){
						 
							switch(target){
								
								case "refreshData":
															
									fnRefreshData("toggle");	

									break;
								
								case "downloadButton":	
									if (!( document.documentMode || /Edge/.test(navigator.userAgent ) ) ) {	
									
									    var oGrid = this.owner;
										var gridData = oGrid.searchData.length > 0 
											?  oGrid.last.searchIds.map(function(searchId){ return properties.visualData[searchId] })  //search results
											:  	properties.visualData;    //or all records				
									
										var downLoadData= "data:text/plain;charset=utf-8," + encodeURIComponent(d3.csvFormat(gridData)); //https://github.com/d3/d3-dsv#csvFormat
										
										var anchor = $(data.originalEvent.currentTarget).find("a");
														
										
										if (anchor.length == 0){

											var anchor = $(document.createElement("a"))
															.attr("download","dataDownload.csv");  
															// .click(function (){ debugger; this.href = "";} );  //Save space in the DOM: doesn't work because click is handled before download
											
													
											$(data.originalEvent.currentTarget).append(anchor);	//https://api.jquery.com/wrap/	
										
											
										} //if

										anchor.attr("href",downLoadData);
										
										anchor[0].click(); //https://stackoverflow.com/questions/34174134/triggering-click-event-on-anchor-tag-doesnt-works
										

									} //if	
									break;
									
								default:
									break;
								
							}//switch		
						
							data.onComplete = function (event){
								
								if (event.target == "styleGrid"){   //Button to Toggle Visualization Styling of Data Grid Selected
									
									this.owner.refresh();  //re-render grid with/without styling
									
									//Re- Apply background to selected column
									var column = this.owner.getColumn(properties.activeGridColumn, true);

									for (var i = 0; i < this.owner.total; i++) {    //Reset Set background  cleared out by the this.owner.refresh() method
										
										var cellIdSelector =  "#grid_" + this.owner.name + "_data_" + i + "_"  + column;	
										$(cellIdSelector).addClass("gridColumnSelection");
									
									}//for
					
									
								} //if		
								
							}
				
				
				
				} //OnClick
				
			}, //toolbar
		
			onUnselect: function(event) {  //Same as onSelect

						event.done(function(){
				
							fnHandleSelectionOrSearch(event);
							
						});	//event.done

				}, //onUnselect			
			onSelect: function(event){  //Added with when multiSelect:true was enabled

						event.done(function(){
				
							fnHandleSelectionOrSearch(event);
							
						});	//event.done
				
			}, //onselect
			onSearch: function(event){
						//https://github.com/vitmalina/w2ui/issues/1604
						//event.onComplete http://w2ui.com/web/docs/1.5/utils/events
						event.onComplete = function(){
							
								fnHandleSelectionOrSearch(event) // http://w2ui.com/web/docs/1.5/w2grid.onSearch
										
						};  //event.onComplete
			}, //onSearch
			onColumnClick: function(event){ 

				
				event.done(function(){	

					if (event.field == "_links") return;
				
				
					properties.activeGridColumn = event.field; 
					
					fnVisualizeData(event.field, properties.visualData, properties.keyDataName);            
					properties.callBackVisualScaling();		//Call back to user interface						  
					
					fnGridSelectColumn(this, properties.activeGridColumn);
															
					
				}); //done
				
					
			
			}, //onColumnClick

			
		} //return object
		

		
		
	} //fnGetDataGridProperties

	
	function fnHandleSelectionOrSearch(event){

		
		if (properties.searching) return;  //Prevent deadly embrace
		
		properties.searching = true;
	
		fnClearIsolateSelections("clear");	//Clear

		var grid = event.target;  //Could be either data grid or visual grid
		var grid2 = grid == "dataGrid" ? "visualGrid" : "dataGrid";
		
		var recIds = event.searchData ?  w2ui[grid].last.searchIds :   // http://w2ui.com/web/docs/1.5/w2grid.last
											w2ui[grid].getSelection(true); // http://w2ui.com/web/docs/1.5/w2grid.getSelection
		
		var searches = [];  //For the other grid
		var recordKey = grid == "dataGrid" ? properties.keyDataName : "vGrId" + properties.keyVisualName;
		var searchKey = grid != "dataGrid" ? properties.keyDataName : "vGrId" + properties.keyVisualName;  //for the other grid
								
		recIds.forEach(function (recid){
						
			var keyValue = w2ui[grid].records[recid][recordKey]
			var selectedObject = properties.visualGroup.getObjectByProperty(properties.keyVisualName, keyValue ); //the join
			selectedObject.userData.selected = true; //Handled by fnClearIsolateSelections("isolate")	

			if (event.searchData){		
				searches.push({field: searchKey, value: keyValue, operator: 'is'}); //http://w2ui.com/web/docs/1.5/w2grid.searchData
			} //if	
			else {
				searches.push(w2ui[grid2].records.find(function(record){return record[searchKey] == keyValue}).recid );	//Find the recid in the grid2 grid
			}//else
				
		}); // recIds
				
				
		if (event.searchData){		
			w2ui[grid2].searchReset();	//Properties.searching == true will prevent deadly embrace
			w2ui[grid2].search(searches, 'OR');  //Perform search on the other grid with 'OR'  http://w2ui.com/web/docs/1.5/w2grid.search
		} //if
		else {
			w2ui[grid2].selectNone();	
			//w2ui[grid2].select(searches.join()); //Doesn't work http://w2ui.com/web/docs/1.5/w2grid.select
			searches.forEach(function(search){w2ui[grid2].select(search);});
			
			
		} //else
		
		if (recIds.length > 0) //No need to isolate if no records from search or selection
			fnClearIsolateSelections("isolate");   //Isolate all searches/selections	
		
		properties.searching = false;	

	}  // fnHandleSelectionOrSearch	
	
	function fnGridSelectColumn(grid, column){   //Used by data and visual grid to de-select Column (from either grid) and select on current grid
	
		//gridColumnSelection class defined in dataVisualizer.css file
	
		//Remove existing backgrounds from the complete data and visual grid; even if they are already applied to current column
		$("body").find(".gridColumnSelection").removeClass("gridColumnSelection");  
							
		//Apply background to selected column
		for (var i = 0; i < grid.total; i++) {
			
			var cellIdSelector =  "#grid_" + grid.name + "_data_" + i + "_"  + grid.getColumn(column, true);	
			$(cellIdSelector).addClass("gridColumnSelection");
		
		}//for

	} //fnGridSelectColumn	

	function fnGetVisualGridProperties(visualObjectMap) {
											
		var visualObjProp = {};	
			visualObjProp["vGrId" + properties.keyVisualName] = [properties.keyVisualName];
			visualObjProp[properties.colorPrefix + "vGrIdColor"] = ["material","color"];  //vGrId to distinguish from visualData column...should be unique enough	
			visualObjProp["vGrIdx"] = ["position","x"];
			visualObjProp["vGrIdy"] = ["position","y"];
			visualObjProp["vGrIdz"] = ["position","z"];
			
		var columns = [{field:"recid", caption:"Object uuid", sortable:true, searchable:true}];
		Object.keys(visualObjProp).forEach(function(field){ 
																								
												var column = {field:field, sortable: true, searchable: true};
												
												switch (field){
													case properties.colorPrefix + "vGrIdColor":
														column.caption = "Original Color";
														break;
													case "vGrId" +  properties.keyVisualName:
														column.caption = field.split("vGrId")[1] + " (Visual Key)";
														break;
													default:
														column.caption = field.split("vGrId")[1];
														break;
												} //select
												
												if (field == properties.colorPrefix + "vGrIdColor"){
												  column.render = function(record) {	
															//The following logic checks out, becuase it is just retrieving object sequentially from the visualObjectMap: record.recid = key below								
															var visualObj = properties.visualGroup.getObjectByProperty(properties.keyVisualName, properties.visualObjectMap.get(record.recid) );
															
															if (!visualObj) return;  //Hack to deal with new file being loaded while user is on 'Objects with 'visualiation' attribute tab
															
															var color = visualObj.material ? visualObj.userData.originalColor.getHexString() : fnGetColor(visualObj);
															
															var input = $(document.createElement("INPUT"))
																			.attr("size",4)
																			.attr("readonly","readonly")
																			.css("background-color", "#" + color );

															var pre = $(document.createElement("PRE"))
																		.append(input)
																		.append("&nbsp;#" + color ); 
															return pre[0].outerHTML;
															
															function fnGetColor(visualObj){   //color all children within the visualObj
																var color;
																visualObj.traverse(function (node){
																	if (node.type == "Mesh" && node.material) {
																		color = node.userData.originalColor.getHexString();
																		return;
																	}
																}); //traverse
																return color;
																
															} //fnGetColor
															

													} //column.render													
													
												} //if
											
											columns.push(column);
											
											}); //forEach	
			
		var gridRecords = [];	
		
		visualObjectMap.forEach(function(visualObjectName,key ){
			
			var record = {};
			
			record.recid = key ;
			
			//var visualObject = properties.visualGroup.getObjectByName(visualObjectName);  //next line is more generalized and allows user/developer to designate another attr for the key
			var visualObject = properties.visualGroup.getObjectByProperty(properties.keyVisualName, visualObjectName);
					
			visualObjectFirstMaterial = fnGetMaterialMeshes(visualObject)[0];
			
			Object.keys(visualObjProp).forEach(function(column){ 
						
											var vObject = column == properties.colorPrefix + "vGrIdColor" ? visualObjectFirstMaterial : visualObject;  
											
											record[column] = getVal(vObject,visualObjProp[column]);
												
											function getVal(visualObject,aProps){
												
													if (aProps.length == 1) {
														return aProps[0] == "color" ? "#" + visualObject[aProps[0]].getHexString()  : 
																				typeof visualObject[aProps[0]] == "string" ?  visualObject[aProps[0]]  : visualObject[aProps[0]].toPrecision(7) ;
													} //if
													else {
														return getVal(visualObject[aProps[0]], aProps.slice(1));
													} //else
											}//getVal												
		
		
										});		
			gridRecords.push(record);

			
		});
	
	
		fnGetDataTypes(gridRecords);	//rebuild DataType for recid, but that's OK becuase it is the same in dataGrid and visualGrid

		function fnBuildRadioIds(prefix,start,end,increment){
			
			arr = [];
			for (var i = start; i <= end; i = i + increment){
				arr.push({id: prefix + "_" + (increment < 1 ?  String(i).substring(0,3) : i), caption: increment < 1 ? String(i).substring(0,3) : String(i)})
			} //for
			return arr;
			
		} //fnBuildRadioIds
	
		var aFOV = fnBuildRadioIds("fov",10,100,5);
		var aGridDiv = 	fnBuildRadioIds("div",2,20,1);
		var aZoomSpeed = fnBuildRadioIds("zp",.1,2.1,.1);
		var aPanSpeed = fnBuildRadioIds("ps",.1,2.1,.1);
	     
		var dataTypes = properties.dataTypes;	
		
		return {
			name		: "visualGrid",
			columns		: columns,	
			//recordHeight: properties.selectionLinks.length > 0 ? 50 : 24,	
			records		: gridRecords,    																		
			show: 		{
							toolbar: true,
							toolbarReload: false,
							footer: true,
							selectColumn: true, 
							footer: true,							
						},
			sortData: 	columns.map(function(row,i){ return Object.assign(row,{direction: "ASC"}) }),	
			searches: 	columns.map(function(row,i){ return Object.assign(row,{type: dataTypes[row.field] ? dataTypes[row.field].type : "text" }) }),	
			multiSearch : true,
			multiSelect: true,
			multiSort: true,
			toolbar: {
				items: [
					{type: 'break'},
					{type: 'check', id: 'gpuPerformance', checked: false,   caption: "GPU", tooltip: "Show Visual Performance"}, 						
					{type: 'html', id: 'gpuPerformanceContainer', html: "<span id='gpuContainer' style='display:none'></span>"},
					{type: 'break'},					
					{type: 'button', id: 'bev', caption: "Reset View", tooltip: "Show Bird's Eye View"}, 					
					{type: 'break'},					
					{type: 'button', id: 'rotate', caption: "Rotate", tooltip: "Rotate Visual"}, 					
					{type: 'break'},	
					{type: 'check', id: 'axesHelper', checked: properties.axesHelper.obj.visible, caption: "Axes", tooltip: "Show/Hide Axes on Visual"}, 
					{type: 'break'},					
					{type: 'color', id: 'background', color: properties.scene.obj.background.getHexString() , caption: "Background", tooltip: "Set Background Color"}, 								
					{type: 'break'},										
					{type: 'check', id: 'boundingBox', checked: properties.boundingBox.obj.visible,  caption: "Bounding Box", tooltip: "Set Bounding Box Properties"}, 	
					{type: 'color', id: 'bBoxColor', color: properties.boundingBox.obj.material.color.getHexString() , caption: "Color", tooltip: "Set Background Color"}, 													
					{type: 'break'},
					{ type: 'menu-radio', id: 'fov', 
						caption: function (item) {
							return 'Camera Field of View: ' + item.selected.split("_")[1];
						},
						selected: "fov_" + properties.camera.fov,
						items: 	aFOV			
					},					
					{ type: 'menu-radio', id: 'polarAngle', 
						caption: function (item) {
							return 'Polar Angel: ' + item.selected.split("_")[1];
						},
						selected: "pa_" + properties.controls.maxPolarAngle,
						items: 	[
									{id: 'pa_90', caption: "90"},
									{id: 'pa_180', caption: "180"}
						]			
					},
					{ type: 'menu-radio', id: 'zoomSpeed', 
						caption: function (item) {
							return 'Zoom Speed: ' + item.selected.split("_")[1];
						},
						selected: "zs_" + properties.controls.zoomSpeed,
						items:  aZoomSpeed
					},
					{ type: 'menu-radio', id: 'panSpeed', 
						caption: function (item) {
							return 'Pan Speed: ' + item.selected.split("_")[1];
						},
						selected: "ps_" + properties.controls.panSpeed,
						items:  aPanSpeed
					},	
					{type: 'break'},										
					{type: 'check', id: 'gridHelper', checked: properties.gridHelper.obj.visible, caption: "Grid&nbsp;", tooltip: "Show/Hide Grid"},
					{type: 'color', id: 'colorGrid', color: new THREE.Color(properties.gridHelper.colorGrid).getHexString() ,
						  caption: "Grid Color", tooltip: "Set Grid Color"}, 								
					{type: 'color', id: 'colorCenter', color: new THREE.Color(properties.gridHelper.colorCenter).getHexString() ,
						  caption: "Center Line Color", tooltip: "Set Grid Center Line Color"}, 
					{ type: 'menu-radio', id: 'divisions', 
						caption: function (item) {
							return 'Grid Divisions: ' + item.selected.split("_")[1];
						},
						selected: "div_" + properties.gridHelper.divisions,
						//items:  aGridDiv
						items: 	aGridDiv					
					}
				],				
				onClick: function (target, data){   //For Toolbar
				
							switch(target){
								
								case "bev":
									fnShowBirdsEyeView();
									break;								
								case "rotate":
									fnRotate();
									break;	
								case "gpuPerformance":	
									var isVisible = $("#gpuContainer").css("display") == "inline";
									$("#gpuContainer").css("display", isVisible ?  "none" : "inline");
									
									if ($("#gpuContainer").contents().length == 0){
										$("#gpuContainer").append($(visualizer.stats.domElement).contents());
									} //
								case "background":
									properties.scene.obj.background.set(this.get('background').color)
									break;
								case "bBoxColor":
									properties.boundingBox.obj.material.color.set(this.get('bBoxColor').color)		
									break;	
									
								default:
									break;
								
							}//switch		
						
							data.onComplete = function (event){
								
								switch(event.target.split(":")[0]){

									case "axesHelper":
										properties.axesHelper.obj.visible = this.get('axesHelper').checked;		
										break;
									case "boundingBox":								
										properties.boundingBox.obj.visible = this.get('boundingBox').checked;
										break;
									case "fov":
										properties.camera.fov = parseInt(this.get("fov").selected.split("_")[1]);
										properties.camera.obj.fov = properties.camera.fov;
										properties.camera.obj.updateProjectionMatrix();
										break;
									case "polarAngle":
										properties.controls.maxPolarAngle = parseInt(this.get("polarAngle").selected.split("_")[1])  ;
										properties.controls.obj.maxPolarAngle = properties.controls.maxPolarAngle * (Math.PI / 180);
										break;
									case "zoomSpeed":
										properties.controls.zoomSpeed = parseFloat(this.get("zoomSpeed").selected.split("_")[1]);
										properties.controls.obj.zoomSpeed = properties.controls.zoomSpeed;									
										break;
									case "panSpeed":
										properties.controls.panSpeed = parseFloat(this.get("panSpeed").selected.split("_")[1]);
										properties.controls.obj.panSpeed = properties.controls.panSpeed;									
										break;									
									case "gridHelper":
									case "colorGrid":
									case "colorCenter":
									case "divisions":
									case "gridSize":

										properties.gridHelper.visible = this.get('gridHelper').checked;
										properties.gridHelper.colorGrid = this.get('colorGrid').color;
										properties.gridHelper.colorCenter =	this.get('colorCenter').color;
										properties.gridHelper.divisions = parseInt(this.get("divisions").selected.split("_")[1]);

										var settings = {
											x: 				properties.gridHelper.obj.position.x,										
											y: 				properties.gridHelper.obj.position.y, 
											z: 				properties.gridHelper.obj.position.z, 
											size: 			properties.gridHelper.gridSize,
											divisions: 		properties.gridHelper.divisions, 
											colorCenter: 	properties.gridHelper.colorCenter,
											colorGrid:		properties.gridHelper.colorGrid, 
											visible:  		properties.gridHelper.visible 
											};
										
										fnBuildGridHelper(settings); 
										break;
									default:	
										break;
								} //switch
								
	
								
							}

				
				} //OnClick	
			}, //toolbar 			

			onColumnClick: function(event){ 

				event.done(function(){	
			
					properties.activeGridColumn = event.field; 
					
					fnVisualizeData(event.field, properties.visualGrid.records, "vGrId" + properties.keyVisualName);            
					//properties.callBackVisualScaling();		//Call back to user interface						  
					
					fnGridSelectColumn(this, properties.activeGridColumn);											
					
				}); //done
			}, //onColumnClick			
			onUnselect: function(event) {  //Same as onSelect

						event.done(function(){
				
							fnHandleSelectionOrSearch(event);
							
						});	//event.done

				}, //onUnselect			
			onSelect: function(event){  //Added with when multiSelect:true was enabled

						event.done(function(){
				
							fnHandleSelectionOrSearch(event);
							
						});	//event.done
				
			}, //onselect
			onSearch: function(event){
						//https://github.com/vitmalina/w2ui/issues/1604
						//event.onComplete http://w2ui.com/web/docs/1.5/utils/events
						event.onComplete = function(){
							
								fnHandleSelectionOrSearch(event) // http://w2ui.com/web/docs/1.5/w2grid.onSearch
										
						};  //event.onComplete
			} //onSearch
			
		} //return object
	
	} //fnGetVisualGridProperties

	//https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	function uuidv4() {
	  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	  )
	}	
	
		
	function fnVisualizeData(column, visualizeData, dataKey){  //Undefined column means show visual with the color it was designed with
		
		
		//fnClearSelectionAndSearch();
		
		//if(properties.dataGrid)	
		//		properties.dataGrid.searchReset(false);  //Reset search (trigger search logic), but don't refresh the grid http://w2ui.com/web/docs/1.5/w2grid.searchReset
		//else fnClearIsolateSelections("clear");			//Make all non-selected slot visible again; fnClearIsolateSelections included in grid search logic
		
		if (column){
			if (fnIsPresetColor(column)){ //Preset Color  
				
				var fnCalcColor = function (dataIndex, column)  { 		
					return visualizeData[dataIndex][column];		
				};				  
								  
				fnColorVisualObject(column,fnCalcColor, visualizeData, dataKey);

				
				//For Legend processing
				var fnCalcColor = function (i, uniqueCat)  { 
					var originalColumn = column.indexOf("vGrId") == -1 ? column.split(properties.colorPrefix)[1] :
																		 column;
					var rowIndex =  visualizeData.findIndex(function(row){return row[originalColumn] == uniqueCat});
					return visualizeData[rowIndex][column];		
				};
				
				var fnLegendScale = {fnCalcColor: fnCalcColor};
			
			} //if
			else {	//Scale Color
			
				//SET OBJECT COLOR AS A FUNCTION OF COLORSCALE
				for (var dataIndex = 0; dataIndex < visualizeData.length; dataIndex++ ) {
					
					fnGetObjectScaleColorAndOptionallyVisualize(visualizeData, column, dataIndex, dataKey, true);

					
				} //for

				var fnLegendScale = fnGetColorScale(column);	//For Legend, Scale coloring is handeld by 	

			} //else

				
		var columnText;
		var colorColumn;
		
		if (dataKey == properties.keyDataName){
			
			columnText =  fnIsPresetColor(column) ?  column.split(properties.colorPrefix)[1] + " (Preset Color)"  : 
				column == "recid" ?   properties.dataGrid.columns.find(function(col){ return col.field == column}).caption  : column;	
				
			colorColumn = fnIsPresetColor(column) ?    column.split(properties.colorPrefix)[1] : column;  //Reference to origial column to get it's unique categories, not the column with the colors		
			
		} //if
		else {
				
			columnText = properties.visualGrid.columns.find(function(col){return col.field == column}).caption;	
			colorColumn = column;  //For visualGrid the color column is the column itself
			
		} //else
				
			
			fnBuildLegend(column, colorColumn, columnText , fnLegendScale);

		}
		else {
			
			var fnCalcColor = function (dataIndex) { 									
									return "originalColor";   //Logic in fnColorVisualObject will traverse visualObject with the original color								
								}; //fnCalcColor
								

			fnColorVisualObject(column,fnCalcColor);

		} //else				

		
		

		//RECOLOR THE VISUALIZATION
		//Assumes the visualization was first built off of visualizeData 
		function fnColorVisualObject(column,fnCalcColor, visualizeData, dataKey){
			
			if (visualizeData){
				
				for (var dataIndex = 0; dataIndex < visualizeData.length; dataIndex++){
					//Following line is to illustrate getObjectByProperty is more flexible.  Developer can designate the attribute that designates visualObject key
					//var visualObject =  properties.visualGroup.getObjectByName(visualizeData[dataIndex][properties.keyDataName]); 
					var visualObject =  properties.visualGroup.getObjectByProperty(properties.keyVisualName, visualizeData[dataIndex][dataKey]);
					var color = fnCalcColor(dataIndex, column);  //Could be a string, or an object (with or without children) from original visual
					fnTraverseColorObject(visualObject,color);
					
				}//for	
		
			} //if
			else {  //Show visual objects navigating properties.visualObjectMap	used when fnCalcColor is for "originalColor" and fnVisualizeData has no parameters
			
				properties.visualObjectMap.forEach(function(visualObjectName){
					
					//var visualObject = properties.visualGroup.getObjectByName(visualObjectName);
					var visualObject = properties.visualGroup.getObjectByProperty(properties.keyVisualName, visualObjectName);
					fnTraverseColorObject(visualObject,fnCalcColor());
				
				});
				
			}
		
		}//fnColorVisualObject			
			
	} //fnVisualizeData
		
	
	function fnTraverseColorObjectByDataIndex(visualizeData, dataIndex, dataKey, strColorRGB){
		
		var visualObject =  properties.visualGroup.getObjectByProperty(properties.keyVisualName, visualizeData[dataIndex][dataKey]);
		fnTraverseColorObject(visualObject,strColorRGB);  //Color the object and it's children		
		
	} //fnTraverseColorObjectByDataIndex
	
    function fnTraverseColorObject(visualObject,color){
		
		visualObject.traverse(function(node) {  //Color the object and any children; object may be a group with children
			if (node.type == "Mesh" && node.material) {
				if (color == "originalColor") {  //Re-setting original color scenario
					node.material.color.copy(node.userData.originalColor);
				} //if
				else { //Assigning data driven color scenario
					node.material.color.set(color);	// 	https://threejs.org/docs/index.html#api/en/math/Color.set
				} //else
			} //if
		}); //visualObject.traverse
		
		
	}//	fnTraverseColorObject
	
	function fnGetMaterialMeshes(visualObject){
		
		var aMaterialMeshes=[];	
		visualObject.traverse(function(node) {  //Color the object and any children; object may be a group with children
			if (node.type == "Mesh" && node.material) {
				aMaterialMeshes.push(node);
			} //if
		}); //visualObject.traverse	
		
		return aMaterialMeshes;
		
	}//fnGetMaterialMeshes
	
	
	function fnClearIsolateSelections(operation){
		
		if (!properties.visualGroup) return;
		
		if (operation == "clear") fnClearObjectSelectionAttributes();
		
		properties.visualObjectMap.forEach(function(objName){ 
						
													//var visualObject = properties.visualGroup.getObjectByName(objName);
													var visualObject = properties.visualGroup.getObjectByProperty(properties.keyVisualName, objName);

													var selectedClearTest = operation == "clear" ? 
																							true : 
																							// .selected set to true or false (via "clear" option) by visualObjSelected logic
																							visualObject.userData.selected == false; //clear or isolate
													
													if (selectedClearTest) {	 
														traverseObjectVisiblity(visualObject, operation == "clear"); //isolate operation AND .selected = false will make this not visible
													} //if
														
										    });	//forEach
		

		function fnClearObjectSelectionAttributes(){

			properties.visualObjectMap.forEach(function(objName){ 
													//var visualObject = properties.visualGroup.getObjectByName(objName);
													var visualObject = properties.visualGroup.getObjectByProperty(properties.keyVisualName, objName);
													visualObject.userData.selected =  false; 
													traverseObjectVisiblity(visualObject, true);
													
											   });
			
		} //fnClearObjectSelectionAttributes	

		function traverseObjectVisiblity(visualObject, visibility){
				visualObject.traverse(function (node){
						if (node.material){	
							node.material.visible = visibility;
						}//if	
				});//traverse	
		} //traverseObjectVisiblity
		
	
	} //fnClearIsolateSelections
		
	//GET AN ARRAY OF THE SCALED COLORS FOR COLUMN objColumnAttributes.column
	function fnGetObjectScaleColorAndOptionallyVisualize(visualizeData, column, rowIndex, dataKey, bColorVisual) {   
		
		var scaleIndex = properties.selectedScale.scaleIndex;    //
		var scaleDirection = properties.selectedScale.direction; //direction: 0: LowHigh, 1: HighLow
												
		var storedScaleColorsKey = column + "_" + scaleIndex + "_" + scaleDirection;

		if (properties.storedScaleColors[storedScaleColorsKey]){
			
			var strColorRGB = properties.storedScaleColors[storedScaleColorsKey][rowIndex]

			if (bColorVisual) {
				
				fnTraverseColorObjectByDataIndex(visualizeData, rowIndex, dataKey, strColorRGB)
			}
			
			return strColorRGB;
			
		} //if
	
		else {
			
			properties.storedScaleColors[storedScaleColorsKey] = []; 	
			
			var colorScaleObj = fnGetColorScale(column)
			
			var colorScale = colorScaleObj.fnCalcColor;
			
			//SET OBJECT COLOR AS A FUNCTION OF COLORSCALE
			for (var dataIndex = 0; dataIndex < visualizeData.length; dataIndex++ ) {

				if (colorScaleObj.minScale == colorScaleObj.maxScale ) {
					var strColorRGB = colorScale(colorScaleObj.minScale);
				} //if
				else {
					var columnValue = visualizeData[dataIndex][column];  
					var strColorRGB = properties.dataTypes[column].type == "float" ?  
										colorScale(columnValue) : 
										colorScale(properties.dataTypes[column].aUniqueCategories.indexOf(columnValue));
				} //else	
										
				var visualObject =  properties.visualGroup.getObjectByProperty(properties.keyVisualName, visualizeData[dataIndex][dataKey]);
				
				properties.storedScaleColors[storedScaleColorsKey].push(strColorRGB);
				
			} //for

			if (bColorVisual) {
				
				fnTraverseColorObjectByDataIndex(visualizeData, rowIndex, dataKey, properties.storedScaleColors[storedScaleColorsKey][rowIndex])
			
			} //if			
		
			return properties.storedScaleColors[storedScaleColorsKey][rowIndex] ;	
			
		} //else
			
	} // fnGetObjectScaleColorAndOptionallyVisualize
	
	
	function fnGetColorScale(column){
		
		var scaleIndex = properties.selectedScale.scaleIndex;    //
		var scaleDirection = properties.selectedScale.direction; //direction: 0: LowHigh, 1: HighLow		

		var dataType =  properties.dataTypes[column].type;
				
		var aUniqueCategories =  properties.dataTypes[column].aUniqueCategories
									
					
		var objColumnAttributes = fnGetColumnAttributes(column);
					
		switch(dataType) {
			case "float":			
				var minScale = objColumnAttributes.minScale;
				var maxScale = objColumnAttributes.maxScale;	
				break;
			case "text":				
				var minScale = 0;				
				var maxScale = Math.max(aUniqueCategories.length - 1, 1);									
				break;
			default:	
		} //switch
		

				
		//SEQUENTIAL SCALING
		//ColorScales documented here: https://github.com/d3/d3-scale-chromatic 
		//Scale Sequential requires interpolator: https://github.com/d3/d3-scale#sequential-scales
		//Interpolator: https://github.com/d3/d3-interpolate 			
		var aMinMaxSequential = [ minScale, Math.max(parseFloat(minScale)+1,maxScale) ];
		var domain = [ aMinMaxSequential[scaleDirection % 2], aMinMaxSequential[(-1* scaleDirection % 2) + 1] ] ; //Flipping the domain reverses the scale [min,max] or [max,min]
		var interpolator = d3[fnGetD3Scales()[scaleIndex]];
		
		return {fnCalcColor: d3.scaleSequential(interpolator).domain(domain) , minScale: minScale, maxScale: maxScale }	
		
		
	} //fnGetColorScale
	
	
	// RENDER COLOR SCALE LIST
	//function fnBuildLegend(column, title, colorScaleObj)
	function fnBuildLegend(column, colorColumn, legendTitle , colorScaleObj){
		
				
		var dataType =  properties.dataTypes[column].type;
		var maxDecimalPlaces =  properties.dataTypes[column].numDecimals;		
	
		var legendContainer2 = d3.select(properties.legendContainer)  
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
					

		var aUniqueCategories =  properties.dataTypes[colorColumn].aUniqueCategories; //colorColumn is the column that is being colorized 
			
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
				.ascending(properties.selectedScale.direction == 1)
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
	
	
		//GET COLUMN NAME, TYPE, DATATYPE, MIN/MAX SCALE (if numeric)
	function fnGetColumnAttributes(column){
		
		var dataType =  properties.dataTypes[column] ?  properties.dataTypes[column].type: null; 
		
		var data = properties.visualGrid.records[0].hasOwnProperty(column) ? properties.visualGrid.records :
			properties.visualData[0].hasOwnProperty("recid") ? properties.visualData : properties.dataGrid.records;
		
		var minScale =  dataType == "float" ? d3.min(data,function (d) { return parseFloat(d[column]); }) : null;				
		var maxScale = 	dataType == "float" ? d3.max(data,function (d) { return parseFloat(d[column]); }) : null;
		
		return {column:column,  
				dataType: dataType, 
				minScale: minScale,
				maxScale: maxScale};
				
	} //fnGetColumnAttributes
		

	function fnUnique(arr) {    //returns only uniques in an array
		var hash = {}, result = [];
		for ( var i = 0, l = arr.length; i < l; ++i ) {
			if ( !hash.hasOwnProperty(arr[i]) ) { 
				hash[ arr[i] ] = true;
				result.push(arr[i]);
			} //id
		} //for
	return result;
	} //fnUnique	
	
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


	function fnIsPresetColor(field){
		
		return field.startsWith(properties.colorPrefix)  	
		
	} //fnIsPresetColor
	
	
} //dataVisualizer

