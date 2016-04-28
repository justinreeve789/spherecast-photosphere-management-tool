// Source: http://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
// Also see http://stackoverflow.com/questions/12113177/html5-canvas-how-can-i-stretch-text
// Also see http://jsfiddle.net/eECar/16/
// For a working example of auto-scaling, see http://stackoverflow.com/questions/25850654/draw-text-from-canvas-into-three-js-as-a-sprite
/*
function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = context.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        context.fillText(line, x, y);
      }
*/
/*
      var canvas = document.getElementById('myCanvas');
      var context = canvas.getContext('2d');
      var maxWidth = 400;
      var lineHeight = 25;
      var x = (canvas.width - maxWidth) / 2;
      var y = 60;
      var text = 'All the world \'s a stage, and all the men and women merely players. They have their exits and their entrances; And one man in his time plays many parts.';

      context.font = '16pt Calibri';
      context.fillStyle = '#333';

      wrapText(context, text, x, y, maxWidth, lineHeight);
*/

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
// canvas.style.border = "1px solid black";
document.body.appendChild(canvas);

function wrapText(ctx, renderer, text, fontSize, fontColor, fontStyle, maxWidth, maxHeight, strokeWidth)
{
	// Default to letting the text take up 50% of the screen wherever it's positioned.
	// If the maxWidth is greater than 1, assume it's pixels. If less than 1, it's a percentage.
	// TODO: Include calculations for maxHeight.
	if (typeof maxWidth === 'undefined')
	{
		maxWidth = 0.5;
		max_width = ctx.canvas.width * maxWidth;
	}
	else if (maxWidth > 2.0)
	{
		// TODO: This isn't right. Fix this.
		max_width = maxWidth;
	}
	else if (maxWidth <= 2.0)
	{
		var elementWidth;
		if (typeof renderer === 'undefined' || !renderer)
			elementWidth = window.innerWidth;
		else
			elementWidth = renderer.domElement.width;
		max_width = elementWidth * maxWidth;
	}

	// TODO: If the screen is in portrait mode, the max_width is going to be screwed up a bit, so let's adjust it.
	if (ctx.canvas.height > ctx.canvas.width)
	{
	}

//	var max_width = window.innerWidth - 25;
	if (typeof fontSize === 'undefined' || !fontSize)
		fontSize = 18;
	if (typeof fontStyle === 'undefined' || !fontStyle)
		fontStyle = '';
	var lines = new Array();
	var width = 0, i, j;
	var result;
	var color = fontColor || "white";

	// Font and size is required for ctx.measureText()
	ctx.font = fontStyle + " " + fontSize + "px Open Sans";

	// Start calculation
	while (text.length)
	{
		for (i = text.length; ctx.measureText(text.substr(0, i)).width > max_width; i--);
		result = text.substr(0, i);
		if (i !== text.length)
			for (j = 0; result.indexOf(" ", j) !== -1; j = result.indexOf(" ", j) + 1);
		lines.push(result.substr(0, j || result.length));
		width = Math.max(width, ctx.measureText(lines[lines.length - 1]).width);
		text = text.substr(lines[lines.length - 1].length, text.length);
	}

	// Calculate canvas size, add margin
	ctx.canvas.width = 14 + width;
	ctx.canvas.height = 8 + (fontSize + 5) * lines.length;
	ctx.font = fontStyle + " " + fontSize + "px Open Sans";

	// Render
	ctx.strokeStyle = 'black';

//	if (typeof strokeWidth === 'undefined' || !strokeWidth)
//		ctx.lineWidth = 5;
//	else
//		ctx.lineWidth = strokeWidth;
	ctx.lineWidth = 5;

	ctx.fillStyle = color;
	for (i = 0, j = lines.length; i < j; ++i)
	{
		ctx.strokeText(lines[i], 8, 5 + fontSize + (fontSize + 5) * i);
		ctx.fillText(lines[i], 8, 5 + fontSize + (fontSize + 5) * i);
	}
}

function positionText(ctx, alignment, maxWidth, maxHeight)
{
	var align = alignment.split(' ');
	var alignVert = align[0];
	var alignHoriz = align[1];
}

function trimCanvas(c)
{
  var ctx = c.getContext('2d'),
    copy = document.createElement('canvas').getContext('2d'),
    pixels = ctx.getImageData(0, 0, c.width, c.height),
    l = pixels.data.length,
    i,
    bound = {
      top: null,
      left: null,
      right: null,
      bottom: null
    },
    x, y;
 
  for (i = 0; i < l; i += 4) {
    if (pixels.data[i+3] !== 0) {
      x = (i / 4) % c.width;
      y = ~~((i / 4) / c.width);
  
      if (bound.top === null) {
        bound.top = y;
      }
      
      if (bound.left === null) {
        bound.left = x; 
      } else if (x < bound.left) {
        bound.left = x;
      }
      
      if (bound.right === null) {
        bound.right = x; 
      } else if (bound.right < x) {
        bound.right = x;
      }
      
      if (bound.bottom === null) {
        bound.bottom = y;
      } else if (bound.bottom < y) {
        bound.bottom = y;
      }
    }
  }
    
  var trimHeight = bound.bottom - bound.top,
      trimWidth = bound.right - bound.left,
      trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);
  
  copy.canvas.width = trimWidth;
  copy.canvas.height = trimHeight;
  copy.putImageData(trimmed, 0, 0);
  
  // open new window with trimmed image:
  return copy.canvas;
}

// wrapText(ctx,
//	"Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vero, veritatis, impedit, rerum maiores adipisci laudantium in corrupti nemo dolorem assumenda illum tempore nam iure necessitatibus unde! Fugiat, modi, quod alias earum laborum et quibusdam. Perferendis, nesciunt, libero, laudantium, voluptas enim quidem dolorem quae ipsa beatae consectetur qui id ducimus ab quisquam quis illum aut quibusdam. Quia, vitae, magni, accusamus, modi doloremque dolores repudiandae expedita consectetur labore veniam minima minus in ab non aperiam ducimus iure repellendus qui cumque perferendis ad molestias porro quae dolorum amet laboriosam saepe omnis esse eum voluptatum. Facere, animi culpa accusantium eligendi voluptatum voluptatem voluptates vitae.",
//	18, "black", "italic");