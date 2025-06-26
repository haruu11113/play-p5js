let xData = [];
let yData = [];
let zData = [];
const maxDataLength = 100; // Keep the last 100 data points

console.log("Connecting to WebSocket server...");
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = function() {
  console.log("WebSocket connection established.");
};

ws.onclose = function() {
  console.log("WebSocket connection closed.");
};

ws.onerror = function(error) {
  console.error("WebSocket Error:", error);
};

ws.onmessage = function(event) {
  try {
    const receivedData = JSON.parse(event.data);
    if (receivedData && typeof receivedData.x !== 'undefined' && typeof receivedData.y !== 'undefined' && typeof receivedData.z !== 'undefined') {
      xData.push(receivedData.x);
      yData.push(receivedData.y);
      zData.push(receivedData.z);

      if (xData.length > maxDataLength) {
        xData.shift();
        yData.shift();
        zData.shift();
      }
    }
  } catch (e) {
    console.error("Error parsing JSON:", e);
  }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  console.log("p5.js setup complete.");
}

function draw() {
  background(0);
  noFill();

  // Find min/max for dynamic range mapping
  let minVal = -1;
  let maxVal = 1;
  
  const allData = [...xData, ...yData, ...zData];
  if (allData.length > 0) {
      minVal = Math.min(...allData);
      maxVal = Math.max(...allData);
  }
  
  // Add padding to the range to prevent clipping
  const range = maxVal - minVal;
  if (range === 0) {
      minVal -= 1; // Avoid division by zero if all values are the same
      maxVal += 1;
  } else {
      const padding = range * 0.1; // 10% padding
      minVal -= padding;
      maxVal += padding;
  }

  // Draw X data (red)
  stroke(255, 0, 0);
  beginShape();
  for (let i = 0; i < xData.length; i++) {
    const x = map(i, 0, maxDataLength - 1, 0, width);
    const y = map(xData[i], minVal, maxVal, height, 0);
    vertex(x, y);
  }
  endShape();

  // Draw Y data (green)
  stroke(0, 255, 0);
  beginShape();
  for (let i = 0; i < yData.length; i++) {
    const x = map(i, 0, maxDataLength - 1, 0, width);
    const y = map(yData[i], minVal, maxVal, height, 0);
    vertex(x, y);
  }
  endShape();

  // Draw Z data (blue)
  stroke(0, 0, 255);
  beginShape();
  for (let i = 0; i < zData.length; i++) {
    const x = map(i, 0, maxDataLength - 1, 0, width);
    const y = map(zData[i], minVal, maxVal, height, 0);
    vertex(x, y);
  }
  endShape();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
