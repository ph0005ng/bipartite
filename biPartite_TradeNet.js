!function(){
var bP={};
//asd
	bP.partData = function(data,p){
		var sData={};
		
		sData.keys=[
			d3.set(data.map(function(d){ return d[0];})).values().sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);}),
			d3.set(data.map(function(d){ return d[1];})).values().sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);})		
		];
		
		sData.data = [	sData.keys[0].map( function(d){ return sData.keys[1].map( function(v){ return 0; }); }),
						sData.keys[1].map( function(d){ return sData.keys[0].map( function(v){ return 0; }); }) 
		];
		
		data.forEach(function(d){ 
			sData.data[0][sData.keys[0].indexOf(d[0])][sData.keys[1].indexOf(d[1])]=d[p];
			sData.data[1][sData.keys[1].indexOf(d[1])][sData.keys[0].indexOf(d[0])]=d[p]; 
		});
		
		return sData;
	}
	
	function visualize(data,dfgoptions){
		dfg={
		 b:30, bb:150, height:600, buffMargin:1, minHeight:14,
		c1:[-130, 40], c2:[-50, 100], c3:[-10, 140], //Column positions of labels.
		 colors :["#3366CC", "#DC3912",  "#FF9900","#109618", "#990099", "#0099C6"]
		};
			if('undefined' !== typeof dfgoptions){
				for(var i in dfgoptions){
					if('undefined' !== typeof dfgoptions[i]){
						dfg[i] = dfgoptions[i];
					}
				}
		}
		//console.log('dfg: ',dfg);
	
		var vis ={};
		function calculatePosition(a, s, e, b, m){
			//console.log('a: ',a,'s: ',s,'e: ',e,'b: ',b,'m: ',m);
			var total=d3.sum(a);
			//console.log('total:',total);
			var sum=0, neededHeight=0, leftoverHeight= e-s-2*b*a.length;
			//console.log('leftoverHeight: ',leftoverHeight);
			var ret =[];
			
			a.forEach(
				function(d){ 
					var v={};
					v.percent = (total == 0 ? 0 : d/total); 
					//console.log('v.percent: ',v.percent);
					v.value=d;
					//console.log('v.value: ',v.value);
					v.height=Math.max(v.percent*(e-s-2*b*a.length), m);
					//console.log('v.height: ',v.height);
					(v.height==m ? leftoverHeight-=m : neededHeight+=v.height );
					//console.log('leftoverHeight: ',leftoverHeight);
					//console.log('neededHeight: ',neededHeight);
					ret.push(v);
				}
			);
			//console.log('retarray: ',ret);
			var scaleFact=leftoverHeight/Math.max(neededHeight,1), sum=0;

			ret.forEach(
				function(d){ 
					d.percent = scaleFact*d.percent; 
					d.height=(d.height==m? m : d.height*scaleFact);
					d.middle=sum+b+d.height/2;
					d.y=s + d.middle - d.percent*(e-s-2*b*a.length)/2;
					d.h= d.percent*(e-s-2*b*a.length);
					d.percent = (total == 0 ? 0 : d.value/total);
					sum+=2*b+d.height;
				}
			);
			//console.log('retforeach: ',ret);
			return ret;
		}

		vis.mainBars = [ 
			calculatePosition( data.data[0].map(function(d){ return d3.sum(d);}), 0, dfg.height, dfg.buffMargin,dfg.minHeight),
			calculatePosition( data.data[1].map(function(d){ return d3.sum(d);}), 0, dfg.height, dfg.buffMargin, dfg.minHeight)
		];
	
		vis.subBars = [[],[]];
		vis.mainBars.forEach(function(pos,p){
			pos.forEach(function(bar, i){	
				calculatePosition(data.data[p][i], bar.y, bar.y+bar.h, 0, 0).forEach(function(sBar,j){ 
					sBar.key1=(p==0 ? i : j); 
					sBar.key2=(p==0 ? j : i); 
					vis.subBars[p].push(sBar); 
				});
			});
		});
		//console.log('vis.subbars',vis.subBars);
		vis.subBars.forEach(function(sBar){
			sBar.sort(function(a,b){ 
			//console.log('sBar sort,a: ',a,' sBar sort,b: ',b);
				return (a.key1 < b.key1 ? -1 : a.key1 > b.key1 ? 
						1 : a.key2 < b.key2 ? -1 : a.key2 > b.key2 ? 1: 0 )});
		});
		
		vis.edges = vis.subBars[0].map(function(p,i){
			return {
				key1: p.key1,
				key2: p.key2,
				y1:p.y,
				y2:vis.subBars[1][i].y,
				h1:p.h,
				h2:vis.subBars[1][i].h
			};
		});
		//console.log('vis.edges: ',vis.edges);
		vis.keys=data.keys;
		return vis;
	}
	
	function arcTween(a) {
		var i = d3.interpolate(this._current, a);
		this._current = i(0);
		return function(t) {
			return edgePolygon(i(t));
		};
	}
	function drawPart(data, id, p){
		d3.select("#"+id).append("g").attr("class","part"+p)
			.attr("transform","translate("+( p*(dfg.bb+dfg.b))+",0)");
			console.log('amount translation: ',( p*(dfg.bb+dfg.b)),'  p: ',p);
		d3.select("#"+id).select(".part"+p).append("g").attr("class","subbars");
		d3.select("#"+id).select(".part"+p).append("g").attr("class","mainbars");
		
		var mainbar = d3.select("#"+id).select(".part"+p).select(".mainbars")
			.selectAll(".mainbar").data(data.mainBars[p])
			.enter().append("g").attr("class","mainbar");

		mainbar.append("rect").attr("class","mainrect")
			.attr("x", window.xStart).attr("y",function(d){ return d.middle-d.height/2; })
			.attr("width",dfg.b).attr("height",function(d){ return d.height; })
			.style("shape-rendering","auto")
			.style("fill-opacity",0).style("stroke-width","0.5")
			.style("stroke","black").style("stroke-opacity",0);
			
		mainbar.append("text").attr("class","barlabel").attr("id","axislabel")
			.attr("x", dfg.c1[p]).attr("y",function(d){ return d.middle+5;})
			.text(function(d,i){ return data.keys[p][i];})
			.attr("text-anchor","start" );
			
		mainbar.append("text").attr("class","barvalue").attr("id","axislabel")
			.attr("x", dfg.c2[p]).attr("y",function(d){ return d.middle+5;})
			.text(function(d,i){ return Math.round(d.value) ;})
			.attr("text-anchor","end");
			
		mainbar.append("text").attr("class","barpercent").attr("id","axislabel")
			.attr("x", dfg.c3[p]).attr("y",function(d){ return d.middle+5;})
			.text(function(d,i){ return "("+Math.round(100*d.percent)+"%)" ;})
			.attr("text-anchor","end").style("fill","grey");
			
		d3.select("#"+id).select(".part"+p).select(".subbars")
			.selectAll(".subbar").data(data.subBars[p]).enter()
			.append("rect").attr("class","subbar")
			.attr("x", window.xStart).attr("y",function(d){ return d.y})
			.attr("width",dfg.b).attr("height",function(d){ return d.h})
			.style("fill",function(d){ return dfg.colors[d.key1];});
	}
		function splitLine(textToChange,textToSelect,fontStyle,styleType,x,y){ 
	var arr=[];
	 arr=textToChange.split(" ");
	textToSelect.append("text");
		if (arr != undefined) {
		for (i=0; i< arr.length; i++) {
		textToSelect.select('text').append("tspan").text(arr[i])
					 .attr("dy", i ? "1.2em" : -10*arr.length+y)
					 .attr("x", x)
		  		      .attr("text-anchor", "middle")
                .attr("class", "tspan" + i)
		   		.style(styleType,fontStyle);
		}
						}
	}
	function drawEdges(data, id){
		d3.select("#"+id).append("g").attr("class","edges").attr("transform","translate("+ dfg.b+",0)");

		d3.select("#"+id).select(".edges").selectAll(".edge")
			.data(data.edges).enter().append("polygon").attr("class","edge")
			.attr("points", edgePolygon).style("fill",function(d){ return dfg.colors[d.key1];})
			.style("opacity",0.5).each(function(d) { this._current = d; });	
	}	
	
	function drawHeader(header, id,width){
	//	d3.select("#"+id).append("g").attr("class","header").append("text").text(header[2])
		//	.style("font-size","20").attr("x",width*238/1100-130).attr("y",-20).style("text-anchor","middle")
			//.style("font-weight","bold");
		var headerSelect = d3.select("#"+id).append("g").attr("class","header");
		splitLine(header[2],headerSelect,'bold','fill',width*238/1100-170,0);
		[0,1].forEach(function(d){
			var h = d3.select("#"+id).select(".part"+d).append("g").attr("class","header");
			
		//	h.append("text").text(header[d]).attr("x", (dfg.c1[d]))
			//	.attr("y", -5).style("fill","grey");
			splitLine(header[d],h,'grey','fill',dfg.c1[d],-5);
			h.append("text").text("Shipment Value").attr("x", (dfg.c2[d]-10))
				.attr("y", -5).style("fill","grey");
			
			h.append("line").attr("x1",dfg.c1[d]-10).attr("y1", -2)
				.attr("x2",dfg.c3[d]+10).attr("y2", -2).style("stroke","black")
				.style("stroke-width","1").style("shape-rendering","crispEdges");
		});
	}
	
	function edgePolygon(d){
	
		return [window.xStart, d.y1, dfg.bb+window.xStart, d.y2, dfg.bb+window.xStart, d.y2+d.h2, window.xStart, d.y1+d.h1].join(" ");
	}	
	
	function transitionPart(data, id, p){
		var mainbar = d3.select("#"+id).select(".part"+p).select(".mainbars")
			.selectAll(".mainbar").data(data.mainBars[p]);
		
		mainbar.select(".mainrect").transition().duration(500)
			.attr("y",function(d){ return d.middle-d.height/2;})
			.attr("height",function(d){ return d.height;});
			
		mainbar.select(".barlabel").transition().duration(500)
			.attr("y",function(d){ return d.middle+5;});
			
		mainbar.select(".barvalue").transition().duration(500)
			.attr("y",function(d){ return d.middle+5;}).text(function(d,i){ return Math.round(d.value) ;});
			
		mainbar.select(".barpercent").transition().duration(500)
			.attr("y",function(d){ return d.middle+5;})
			.text(function(d,i){ return "("+Math.round(100*d.percent)+"%)" ;});
			
		d3.select("#"+id).select(".part"+p).select(".subbars")
			.selectAll(".subbar").data(data.subBars[p])
			.transition().duration(500)
			.attr("y",function(d){ return d.y}).attr("height",function(d){ return d.h});
	}
	
	function transitionEdges(data, id){
		d3.select("#"+id).append("g").attr("class","edges")
			.attr("transform","translate("+ dfg.b+",0)");
			
		d3.select("#"+id).select(".edges").selectAll(".edge").data(data.edges)
			.transition().duration(500)
			.attrTween("points", arcTween)
			.style("opacity",function(d){ return (d.h1 ==0 || d.h2 == 0 ? 0 : 0.5);});	
	}
	
	function transition(data, id){
		transitionPart(data, id, 0);
		transitionPart(data, id, 1);
		transitionEdges(data, id);
	}


	
	bP.draw = function(data,cfgoptions){
			var cfg ={
		width:1100,
		height:610,
		centre:500,
		 margin :{b:0, t:50, l:170, r:50}
		 
			};
		if('undefined' !== typeof cfgoptions){
			for(var i in cfgoptions){
				if('undefined' !== typeof cfgoptions[i]){
		      		cfg[i] = cfgoptions[i];
				}
		  	}
		}

		var svg = d3.select(chart)
		.append("svg").attr('width',cfg.width+cfg.margin.l+cfg.margin.r).attr('height',(cfg.height+cfg.margin.b+cfg.margin.t))
		.append("g").attr("transform","translate("+ cfg.margin.l+","+cfg.margin.t+")");
		data.forEach(function(biP,s){
			svg.append("g")
				.attr("id", biP.id)
				.attr("transform","translate("+ (cfg.centre*s)+",0)");
				console.log('cfg.centre:',cfg.centre);
			var visData = visualize(biP.data,window.dfgoptions);
			drawPart(visData, biP.id, 0);
			drawPart(visData, biP.id, 1); 
			drawEdges(visData, biP.id);
			drawHeader(biP.header, biP.id,cfg.width);
			
			[0,1].forEach(function(p){			
				d3.select("#"+biP.id)
					.select(".part"+p)
					.select(".mainbars")
					.selectAll(".mainbar")
					.on("mouseover",function(d, i){ return bP.selectSegment(data, p, i); })
					.on("mouseout",function(d, i){ return bP.deSelectSegment(data, p, i); });	
			});
		});	
	}
	
	bP.selectSegment = function(data, m, s){
		data.forEach(function(k){
			var newdata =  {keys:[], data:[]};	
				
			newdata.keys = k.data.keys.map( function(d){ return d;});
			
			newdata.data[m] = k.data.data[m].map( function(d){ return d;});
			
			newdata.data[1-m] = k.data.data[1-m]
				.map( function(v){ return v.map(function(d, i){ return (s==i ? d : 0);}); });
			
			transition(visualize(newdata,window.dfgoptions), k.id);
				
			var selectedBar = d3.select("#"+k.id).select(".part"+m).select(".mainbars")
				.selectAll(".mainbar").filter(function(d,i){ return (i==s);});
			
			selectedBar.select(".mainrect").style("stroke-opacity",1);			
			selectedBar.select(".barlabel").style('font-weight','bold');
			selectedBar.select(".barvalue").style('font-weight','bold');
			selectedBar.select(".barpercent").style('font-weight','bold');
		});
	}	
	
	bP.deSelectSegment = function(data, m, s){
		data.forEach(function(k){
			transition(visualize(k.data,window.dfgoptions), k.id);
			
			var selectedBar = d3.select("#"+k.id).select(".part"+m).select(".mainbars")
				.selectAll(".mainbar").filter(function(d,i){ return (i==s);});
			
			selectedBar.select(".mainrect").style("stroke-opacity",0);			
			selectedBar.select(".barlabel").style('font-weight','normal');
			selectedBar.select(".barvalue").style('font-weight','normal');
			selectedBar.select(".barpercent").style('font-weight','normal');
		});		
	}
			rotateAxis = function() {
		d3.selectAll("#axislabel").selectAll("text").attr("transform","rotate(90)");
		}
	this.bP = bP;
}();
