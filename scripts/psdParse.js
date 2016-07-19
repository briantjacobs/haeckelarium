var fs = require('fs');
var gm = require('gm')
    // Promise.promisifyAll(require('fs-extra'));

var Promise = require('bluebird');
var PSD = require('psd'); // already promise enabled
var jsonfile = Promise.promisifyAll(require('jsonfile'));
var im = Promise.promisifyAll(gm.subClass({
    imageMagick: true
}));
var nsg = require('node-sprite-generator');
var _ = require('lodash');

var img = "img/085_rasterized.psd";
var imgOutput = "img/output/085_layer.png";
var imgLayerMeta = "json/085.json";
var spriteMeta = "json/085_sprite.json";

var data = {};


PSD.open(img)
    .then(function(psd) {
        // write metadata
        data.layers = psd.tree().export().children;

        data.layers.forEach(function(d,i){
        	// make an index thats the reverse of what this lists 
        	// imagemagick reverses layer order parsing
        	d.plateIndex = i;
        	d.imIndex = (data.layers.length) - i;
        });
        data.visibleLayers = data.layers.filter(function(d,i){
        	return d.visible === true;
        });
        data.visibleLayers = data.visibleLayers.map(function(d,i){
        	return _.pick(d, [ "left", "top", "width", "height", "imIndex","plateIndex", "name"])
        })

        return jsonfile.writeFileAsync(imgLayerMeta, data.visibleLayers)
    })
    .then(function() {
        // write extracted layers
        return new Promise(function(resolve, reject) {
            // gutil.log("Resampling: ", gutil.colors.magenta(fileLayer + "/" + fileZoom));
            // im(img).identify(function(err,meta){
            // 	console.log(_.reverse(meta['Page geometry']))
            // })
            im(img)
                .write(imgOutput, function(err) {
                    if (!err) {
                        resolve()
                    } else {
                        console.log(err)
                        reject()
                    };
                });
        })


    })
    .then(function() {
        return new Promise(function(resolve, reject) {
		
			// create image list from imageIndex knowing how 
			// imagemagick writes layers from a psd
			// [input_psd]-[idx].png

			var imageList = data.visibleLayers.map(function(d,i) {
				return imgOutput.split(".")[0] + "-" + d.imIndex + ".png"
			});

            nsg({
                src: imageList,
                layout: 'packed',
                spritePath: 'img/output/085_sprite.png',
                stylesheet: function(layout, stylesheetPath, spritePath, options, callback) {
                	// these are ordered according to REVERSE layer order in photoshop 
                	// add indexes to refer to these in order
			    	data.spriteMeta = layout.images.map(function(d,i){
			    		d.plateIndex = (layout.images.length-1) - i
			    		return _.pick(d, ["path","plateIndex","width","height","x","y"]);
			    	});
			    	callback(); 
                }
            }, function(err) {
                if (!err) {
                    resolve()
                } else {
                    console.log(err)
                    reject()
                }
            })
        })
    })
    .then(function() {
    	return jsonfile.writeFileAsync(spriteMeta, data.spriteMeta)
    })
