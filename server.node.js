var http = require('http'),
	concat = require('concat-stream'),
	Canvas = require('canvas');

var MAP_KEY_ULAT = 0,
	MAP_KEY_ULON = 1,
	MAP_KEY_ZOOM = 2,
	MAP_KEY_ROW = 3;

var ctx = new Canvas(256,256).getContext('2d');

http.request("http://d.tile.stamen.com/toner/12/690/1452.png", function (res) {
	res.pipe(concat(function (d) {
		console.log("Image data loaded");
		var img = new Canvas.Image();
		img.src = d;
		ctx.drawImage(img,0,0);
		
		var px = ctx.getImageData(0,0,144,168).data;
		console.log();
	}));
}).end();

http.createServer(function (req, res) {
	req.pipe(concat(function (d) {
		d = JSON.parse(d);
		var lat = d[MAP_KEY_ULAT] / 1e6,
			lon = d[MAP_KEY_ULON] / 1e6,
			zzz = d[MAP_KEY_ZOOM],
			row = d[MAP_KEY_ROW];
		console.log("Got request",lat,lon,zzz,row);
		
		var w = 144, h = 168,
			px = ctx.getImageData(0,0,w,h).data,
			pxOffset = 4 * row * w,
			b = new Buffer(3*w/8);
		b.fill(0);
		for (var i = 0; i < 3*w; i += 1) {
			val = px[pxOffset+4*i];
			if (val > 0 && val < 255) console.log(val);
			var set = px[pxOffset+4*i] > 235,
				bit = /*7 -*/ i % 8;
			b[i/8 << 0] |= set << bit;
		}
		
		var data = {};
		//data[MAP_KEY_ROW] = ['d', Buffer(20).toString('base64')];
		data[MAP_KEY_ROW] = ['d', b.toString('base64')];
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(data));
	}));
}).listen(8000);