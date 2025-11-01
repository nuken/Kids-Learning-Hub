const imageFiles = [];
for (let i = 1; i <= 10; i++) {
    imageFiles.push(`${i}.jpg`);
}

const colors = ['#575757', '#DC2323', '#2A4BD7', '#1D6914', '#814A19', '#8126C0', '#A0A0A0', '#81C57A', '#9DAFFF', '#29D0D0', '#FF9233', '#FFEE33', '#E9DEBB', '#FFCDF3', '#FFFFFF', '#000000'];
let currentTool = 'brush';
let currentColor = colors[0];
let currentBrushSize = 10;
let isPaint = false;
let lastLine;
let currentImageNode = null;
let fillHistory = [];
let historyStack = [];

const container = document.querySelector('.canvas-container');
const stage = new Konva.Stage({
    container: 'container',
    width: container.clientWidth,
    height: container.clientHeight,
});

const backgroundLayer = new Konva.Layer();
const drawingLayer = new Konva.Layer();
stage.add(backgroundLayer, drawingLayer);

// --- UI ELEMENTS & EVENT LISTENERS ---
const colorPalette = document.getElementById('color-palette');
const brushBtn = document.getElementById('brush-btn');
const fillBtn = document.getElementById('fill-btn');
const brushSizeSlider = document.getElementById('brush-size');
const undoBtn = document.getElementById('undo-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const imageSelector = document.getElementById('image-selector');

imageFiles.forEach((fileName, index) => {
    const thumb = document.createElement('img');
    thumb.src = `images/${fileName}`;
    thumb.className = 'thumbnail';
    if (index === 0) thumb.classList.add('active');
    thumb.addEventListener('click', () => {
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        loadImageByName(fileName);
    });
    imageSelector.appendChild(thumb);
});

colors.forEach((color, index) => {
    const colorBox = document.createElement('div');
    colorBox.className = 'color-box';
    colorBox.style.backgroundColor = color;
    if (index === 0) colorBox.classList.add('active');
    colorBox.addEventListener('click', () => {
        currentColor = color;
        document.querySelectorAll('.color-box').forEach(box => box.classList.remove('active'));
        colorBox.classList.add('active');
    });
    colorPalette.appendChild(colorBox);
});

brushBtn.addEventListener('click', () => {
    currentTool = 'brush';
    brushBtn.classList.add('active');
    fillBtn.classList.remove('active');
});

fillBtn.addEventListener('click', () => {
    currentTool = 'fill';
    fillBtn.classList.add('active');
    brushBtn.classList.remove('active');
});

brushSizeSlider.addEventListener('input', (e) => {
    currentBrushSize = e.target.value;
});

undoBtn.addEventListener('click', () => {
    if (historyStack.length === 0) return;

    const lastAction = historyStack.pop();

    if (lastAction.type === 'brush') {
        lastAction.node.destroy();
        drawingLayer.batchDraw();
    } else if (lastAction.type === 'fill') {
        fillHistory.pop();
        const sourceCanvas = currentImageNode.image();
        sourceCanvas.getContext('2d').putImageData(lastAction.imageData, 0, 0);
        backgroundLayer.batchDraw();
    }
});

clearBtn.addEventListener('click', () => {
    const activeThumb = document.querySelector('.thumbnail.active');
    if (activeThumb) {
        const fileName = activeThumb.src.split('/').pop();
        loadImageByName(fileName);
    }
});

saveBtn.addEventListener('click', () => {
    const dataURL = stage.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/jpeg'
    });
    const link = document.createElement('a');
    link.download = 'coloring-page.jpg';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- HELPER FUNCTIONS ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 7) {
        r = parseInt("0x" + hex.slice(1, 3));
        g = parseInt("0x" + hex.slice(3, 5));
        b = parseInt("0x" + hex.slice(5, 7));
    }
    return [r, g, b];
}

function colorsMatch(data, index, color, tolerance = 20) {
    return Math.abs(data[index] - color[0]) <= tolerance &&
           Math.abs(data[index + 1] - color[1]) <= tolerance &&
           Math.abs(data[index + 2] - color[2]) <= tolerance;
}

// --- FLOOD FILL LOGIC ---
function floodFill(startX, startY, fillColorRgb) {
    if (!currentImageNode) return;
    const context = currentImageNode.image().getContext('2d');
    const { width, height } = context.canvas;
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;

    const startIndex = (startY * width + startX) * 4;
    const startColor = [data[startIndex], data[startIndex + 1], data[startIndex + 2]];

    if (startColor[0] < 30 && startColor[1] < 30 && startColor[2] < 30) {
        return;
    }
    if (colorsMatch(data, startIndex, fillColorRgb, 10)) {
        return;
    }

    const isBoundary = (index) => !colorsMatch(data, index, startColor, 35);
    const stack = [[startX, startY]];
    const fillColor = [...fillColorRgb, 255];

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const currentIndex = (y * width + x) * 4;

        if (data[currentIndex] === fillColor[0] &&
            data[currentIndex + 1] === fillColor[1] &&
            data[currentIndex + 2] === fillColor[2]) {
            continue;
        }
        if (isBoundary(currentIndex)) {
            continue;
        }

        data[currentIndex] = fillColor[0];
        data[currentIndex + 1] = fillColor[1];
        data[currentIndex + 2] = fillColor[2];
        data[currentIndex + 3] = fillColor[3];

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    context.putImageData(imageData, 0, 0);
}

// --- CANVAS LOGIC ---
function fitImageToContainer(image) {
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const imageRatio = image.width / image.height;
    const stageRatio = stageWidth / stageHeight;
    let newWidth, newHeight;

    // Calculate maximum dimensions that fit within the stage with a 10% margin
    const maxImageWidth = stageWidth * 0.9;
    const maxImageHeight = stageHeight * 0.9;

    if (imageRatio > stageRatio) {
        newWidth = maxImageWidth;
        newHeight = newWidth / imageRatio;
    } else {
        newHeight = maxImageHeight;
        newWidth = newHeight * imageRatio;
    }

    return {
        width: newWidth,
        height: newHeight,
        // Center the image within the stage
        x: (stageWidth - newWidth) / 2,
        y: (stageHeight - newHeight) / 2,
    };
}

function loadImageByName(fileName) {
    drawingLayer.destroyChildren();
    backgroundLayer.destroyChildren();
    fillHistory = [];
    historyStack = [];
    const imageUrl = `images/${fileName}`;
    Konva.Image.fromURL(imageUrl, (imageNode) => {
        const img = imageNode.image();
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.naturalWidth || img.width;
        offscreenCanvas.height = img.naturalHeight || img.height;
        offscreenCanvas.getContext('2d').drawImage(img, 0, 0);

        imageNode.image(offscreenCanvas);
        currentImageNode = imageNode;

        const dimensions = fitImageToContainer(imageNode.image());
        imageNode.setAttrs({ ...dimensions, name: 'coloringImage' });

        drawingLayer.clipFunc(function (ctx) {
            ctx.rect(dimensions.x, dimensions.y, dimensions.width, dimensions.height);
        });

        backgroundLayer.add(imageNode);
        backgroundLayer.batchDraw();
        
        // Ensure stage dimensions are properly set
        requestAnimationFrame(() => {
            ensureStageDimensions();
        });
    });
}

function ensureStageDimensions() {
    const containerRect = container.getBoundingClientRect();
    const style = window.getComputedStyle(container);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

    // Ensure stage never exceeds container boundaries
    const maxWidth = Math.max(container.clientWidth - paddingX, 100);
    const maxHeight = Math.max(container.clientHeight - paddingY, 100);
    
    if (stage.width() !== maxWidth || stage.height() !== maxHeight) {
        stage.width(maxWidth);
        stage.height(maxHeight);
        stage.batchDraw();
    }
}

stage.on('click tap', (e) => {
    if (currentTool === 'fill' && currentImageNode) {
        const pos = stage.getPointerPosition();

        const relativeX = (pos.x - currentImageNode.x()) / currentImageNode.width();
        const relativeY = (pos.y - currentImageNode.y()) / currentImageNode.height();

        if (relativeX >= 0 && relativeX <= 1 && relativeY >= 0 && relativeY <= 1) {
            const sourceCanvas = currentImageNode.image();
            const beforeImageData = sourceCanvas.getContext('2d').getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
            historyStack.push({ type: 'fill', imageData: beforeImageData });

            const fillColor = hexToRgb(currentColor);
            fillHistory.push({ relativeX, relativeY, color: fillColor });

            const sourceCanvasForFill = currentImageNode.image();
            const x = Math.floor(relativeX * sourceCanvasForFill.width);
            const y = Math.floor(relativeY * sourceCanvasForFill.height);

            floodFill(x, y, fillColor);

            backgroundLayer.batchDraw();
        }
    }
});

stage.on('mousedown touchstart', (e) => {
    if (currentTool !== 'brush') return;
    isPaint = true;
    const pos = stage.getPointerPosition();
    lastLine = new Konva.Line({
        stroke: currentColor,
        strokeWidth: currentBrushSize,
        globalCompositeOperation: 'source-over',
        lineCap: 'round', lineJoin: 'round',
        points: [pos.x, pos.y, pos.x, pos.y],
    });
    drawingLayer.add(lastLine);
});

stage.on('mouseup touchend', () => {
    if (!isPaint) return;
    isPaint = false;
    historyStack.push({ type: 'brush', node: lastLine });
});

stage.on('mousemove touchmove', (e) => {
    if (!isPaint || currentTool !== 'brush') return;
    e.evt.preventDefault();
    const pos = stage.getPointerPosition();
    const newPoints = lastLine.points().concat([pos.x, pos.y]);
    lastLine.points(newPoints);
    drawingLayer.batchDraw();
});

// --- RESIZE LOGIC ---
const handleResize = debounce(() => {
    if (!currentImageNode) return;

    const oldDimensions = {
        x: currentImageNode.x(),
        y: currentImageNode.y(),
        width: currentImageNode.width(),
        height: currentImageNode.height()
    };

    const style = window.getComputedStyle(container);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

    // Ensure stage never exceeds container boundaries
    const maxWidth = Math.max(container.clientWidth - paddingX, 100);
    const maxHeight = Math.max(container.clientHeight - paddingY, 100);
    
    stage.width(maxWidth);
    stage.height(maxHeight);

    const newDimensions = fitImageToContainer(currentImageNode.image());
    currentImageNode.setAttrs(newDimensions);

    drawingLayer.clipFunc(function (ctx) {
        ctx.rect(newDimensions.x, newDimensions.y, newDimensions.width, newDimensions.height);
    });

    drawingLayer.getChildren().forEach(shape => {
        if (shape instanceof Konva.Line) {
            const oldPoints = shape.points();
            const newPoints = [];
            for (let i = 0; i < oldPoints.length; i += 2) {
                const relativeX = (oldPoints[i] - oldDimensions.x) / oldDimensions.width;
                const relativeY = (oldPoints[i + 1] - oldDimensions.y) / oldDimensions.height;
                newPoints.push(
                    (relativeX * newDimensions.width) + newDimensions.x,
                    (relativeY * newDimensions.height) + newDimensions.y
                );
            }
            shape.points(newPoints);
        }
    });

    stage.batchDraw();

    requestAnimationFrame(() => {
        if (!currentImageNode) return;
        const sourceCanvas = currentImageNode.image();

        fillHistory.forEach(fill => {
            const targetX = Math.floor(fill.relativeX * sourceCanvas.width);
            const targetY = Math.floor(fill.relativeY * sourceCanvas.height);
            floodFill(targetX, targetY, fill.color);
        });

        if (fillHistory.length > 0) {
            backgroundLayer.batchDraw();
        }
    });

}, 250);

window.addEventListener('resize', handleResize);

// --- INITIAL LOAD ---
// Ensure proper initial sizing
requestAnimationFrame(() => {
    ensureStageDimensions();
    loadImageByName(imageFiles[0]);
});

// Add resize observer for better responsiveness
const resizeObserver = new ResizeObserver(() => {
    handleResize();
});
resizeObserver.observe(container);
