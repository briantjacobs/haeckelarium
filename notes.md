use dataset method
- works in chrome/safari, not in firefox. IE
convert 085.png -channel rgba -separate +channel -swap 2,3 -combine -colorspace sRGB 085_swap.png


use sprite method
- use export coords photoshop script to export csv of layer coordinates
- use export layers to files script to export series of pngs
- use texturepacker to generate sprite sheet from individual pngs

-imagemagic convert psd layers to png?
	// this works if layers are not vector shapes, or masks, but rasterized
	convert 085_rasterized.psd -background transparent  085---.png

metatdata
 identify -verbose img/085_rasterized.psd
	-- imagemagick lists layers from bottom to top
	-- psd.js lists them from top to bottom


todo: consolidate imagery, compare to flickr imagery


sprite generator
https://github.com/selaux/node-sprite-generator

get image data from webgl
http://www.html5gamedevs.com/topic/4139-get-access-to-pixel-color-from-a-texture/

PSD commandline
https://github.com/meltingice/psd.js
convert 


/// 
im(img).identify(function(err,value){
	console.log(value)
})

  'Page geometry': 
   [ '1291x1955+0+0',
     '1291x1955+0+0',
     '1291x1955+0+0',
     '592x265+325+129',
     '363x409+39+124' ],


     TODO:
combine json of sprite and layer coordinates and you'll be ready