    HK = window.HK || {};

    // Is a given variable undefined?
    function isUndefined(obj) {
        return obj === void 0;
    };

    HK.app = {
        init: function() {
            var _this = this;
            // draw canvas
            this.mainCanvas = $("#mainCanvas")[0]
            this.mainContext = this.mainCanvas.getContext('2d');
            // this.mainContext.globalCompositeOperation="source-in";
            this.cHeight = imageHeight = this.mainCanvas.height;
            this.cWidth = imageWidth = this.mainCanvas.width;
            // this.cImage = this.mainContext.createImageData(this.cWidth, this.cHeight);
            // this.cImage = this.mainContext.getImageData(0, 0, this.cWidth, this.cHeight);

            this.overlayAlpha = .9;
            this.tweenVal = {
                destMaskAlpha: 0,
                prevMaskAlpha: 0,
                mainMaskAlpha: 0
            }

            this.hitCanvas = document.createElement('canvas'); //document.createElement('canvas');
            this.hitCanvas.height = this.cHeight;
            this.hitCanvas.width = this.cWidth;
            this.hitContext = this.hitCanvas.getContext('2d');

            this.maskDestCanvas = document.createElement('canvas'); //document.createElement('canvas');
            this.maskDestCanvas.height = this.cHeight;
            this.maskDestCanvas.width = this.cWidth;
            this.maskDestContext = this.maskDestCanvas.getContext('2d');

            this.maskPrevCanvas = document.createElement('canvas'); //document.createElement('canvas');
            this.maskPrevCanvas.height = this.cHeight;
            this.maskPrevCanvas.width = this.cWidth;
            this.maskPrevContext = this.maskPrevCanvas.getContext('2d');

            this.mixMaskCanvas = document.createElement('canvas'); //document.createElement('canvas');
            this.mixMaskCanvas.height = this.cHeight;
            this.mixMaskCanvas.width = this.cWidth;
            this.mixMaskContext = this.mixMaskCanvas.getContext('2d');


            // DEBUG BUFFER CANVAS
            $("body")
                .append(
                    $(this.hitCanvas).attr({
                        id: "hit-canvas",
                        class: "test-canvas"
                    }))
                .append(
                    $(this.maskDestCanvas).attr({
                        id: "mask-dest-canvas",
                        class: "test-canvas"
                    }))
                .append(
                    $(this.maskPrevCanvas).attr({
                        id: "buffer-canvas",
                        class: "test-canvas"
                    }))
                .append(
                    $(this.mixMaskCanvas).attr({
                        id: "mix-canvas",
                        class: "test-canvas"
                    }))

            // draw input mask to test canvas
            this.mask = this.createImg('mask1_swap.png')
            this.base = this.createImg('image.jpg')

            var requests = [
                this.mask.request,
                this.base.request
            ]

            $.when.apply(null, requests).done(function() {
                _this.initEventListeners()
                _this.drawBase();
                _this.drawHitMask();
            })


        },
        initEventListeners: function() {
            var _this = this;
            //todo: debounce this when exiting a found zone
            $(this.mainCanvas).on("mousemove", function(e) {
                var pos = _this.findPos(this);
                var x = e.pageX - pos.x;
                var y = e.pageY - pos.y;
                var coord = "x=" + x + ", y=" + y;
                var p = _this.hitContext.getImageData(x, y, 1, 1).data;

                // check if previous event color matches current color
                if (_this.currColorIdx !== p[0]) {
                    // within vs outside mask range
                    if (p[0] < 255) {
                        // fetch by index
                        _this.findMask(p[0])
                            // fetch by group
                            // _this.findMask(p[1], true)

                    } else {
                        _this.clearMask()
                    }
                    _this.currColorIdx = p[0];
                }


            })
        },
        findPos: function(obj) {
            var curleft = 0,
                curtop = 0;
            if (obj.offsetParent) {
                do {
                    curleft += obj.offsetLeft;
                    curtop += obj.offsetTop;
                } while (obj = obj.offsetParent);
                return { x: curleft, y: curtop };
            }
            return undefined;
        },

        createImg: function(src) {
            var obj = {};
            obj.request = $.Deferred();
            obj.img = new Image();
            obj.img.onload = function() {
                obj.request.resolve();
            };
            obj.img.src = src;
            obj.request.promise();
            return obj;
        },
        drawBase: function() {
            this.mainContext.drawImage(this.base.img, 0, 0, this.cWidth, this.cHeight);
        },

        drawHitMask: function() {
            this.hitContext.drawImage(this.mask.img, 0, 0, this.cWidth, this.cHeight);
        },
        findMask: function(idx, fetchGroup) {
            var _this = this;

            //cache current canvas to a previous canvas buffer
            this.maskPrevContext.clearRect(0, 0, this.cWidth, this.cHeight)
            this.maskPrevContext.drawImage(this.maskDestCanvas, 0, 0, this.cWidth, this.cHeight);

            // get pixel data on test canvas
            // draw mask to real canvas according to image and group
            var maskCanvasData = this.maskDestContext.getImageData(0, 0, this.cWidth, this.cHeight);
            var hitImageData = this.hitContext.getImageData(0, 0, this.cWidth, this.cHeight);
            var i, r, g, b, a, channelIdx;
            var opacity = 0;


            for (var y = 0; y < this.cHeight; y++) {
                for (var x = 0; x < this.cWidth; x++) {
                    i = (x + y * this.cWidth) * 4;
                    // WHOA: BLUE CHANNEL REPRESENTS ALPHA
                    r = hitImageData.data[i];
                    g = hitImageData.data[i + 1];
                    b = hitImageData.data[i + 2];
                    // a = data[i+3];

                    maskCanvasData.data[i] = 0;
                    maskCanvasData.data[i + 1] = 0;
                    maskCanvasData.data[i + 2] = 0;
                    maskCanvasData.data[i + 3] = opacity;


                    channelIdx = fetchGroup ? r : g;

                    // green channel for group, red channel for id
                    if ((fetchGroup ? g : r) === idx) {
                        // if fully blue, make fully transparent
                        if (b === 255) {
                            maskCanvasData.data[i + 3] = 255;
                            // if fully not blue, make opaque
                        } else if (b === 0) {
                            maskCanvasData.data[i + 3] = opacity;

                            // if paretially transparent, subtract that value from full opacity 
                        } else if (b > 0 && b < 255) {
                            maskCanvasData.data[i + 3] = b;
                        }
                    }
                }
            }
            
            // write to active mask canvas
            this.maskDestContext.putImageData(maskCanvasData, 0, 0);

            // animate crossfade
            TweenLite.fromTo(this.tweenVal, 2, {
                destMaskAlpha: 0,
                prevMaskAlpha: 1,
            }, {
                mainMaskAlpha: 1,
                destMaskAlpha: 1,
                prevMaskAlpha: 0,
                onUpdate: this.showMask,
                onUpdateScope: this
            });


        },
        clearMask: function() {
            TweenLite.to(this.tweenVal, 2, {
                mainMaskAlpha: 0,
                onUpdate: this.showMask,
                onUpdateScope: this
            });
        },
        showMask: function() {

            //TODO: copy previous mask state and save it before animating in order to crossfade

            // draw mask base to buffer
            this.mixMaskContext.clearRect(0, 0, this.cWidth, this.cHeight)
            this.mixMaskContext.globalAlpha = this.overlayAlpha;
            this.mixMaskContext.fillStyle = "rgb(0,0,0)";
            this.mixMaskContext.fillRect(0, 0, this.cWidth, this.cHeight);

            // crossfade inverted mask holes
            this.mixMaskContext.save();
            this.mixMaskContext.globalCompositeOperation = "xor";
            this.mixMaskContext.globalAlpha = this.tweenVal.prevMaskAlpha;
            this.mixMaskContext.drawImage(this.maskPrevCanvas, 0, 0, this.cWidth, this.cHeight);
            this.mixMaskContext.globalAlpha = this.tweenVal.destMaskAlpha;
            this.mixMaskContext.drawImage(this.maskDestCanvas, 0, 0, this.cWidth, this.cHeight);
            this.mixMaskContext.restore();

            // draw base image
            this.mainContext.clearRect(0, 0, this.cWidth, this.cHeight)
            this.mainContext.drawImage(this.base.img, 0, 0, this.cWidth, this.cHeight);

            // copy crossfade buffer
            this.mainContext.save();
            this.mainContext.globalAlpha = this.tweenVal.mainMaskAlpha;
            this.mainContext.drawImage(this.mixMaskCanvas, 0, 0, this.cWidth, this.cHeight)
            this.mainContext.restore();
        }


    }




    $(function() {

        HK.app.init();

    })

    // swap alpha and blue channels with imagemagick
    // premultiplication of alpha channel is messing up using png as dataset to reference other colors within
    // http://www.imagemagick.org/discourse-server/viewtopic.php?t=21846
    // http://stackoverflow.com/questions/28593763/how-to-extract-pixel-information-from-png-using-javascript-getimagedata-alterna
    // http://stackoverflow.com/questions/23497925/how-can-i-stop-the-alpha-premultiplication-with-canvas-imagedata/23501676#23501676


    // document.addEventListener("DOMContentLoaded", function() {
    //   // code...
    // });
