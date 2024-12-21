var perspectiveView = true;
var shape = 0;
var alpha = 0;
var beta = 0;

function nextShape() {
  shape = (shape + 1) % shapeNames.length;
  document.getElementById("shapeName").innerHTML = shapeNames[shape];
}

function prevShape() {
  shape = (shape + shapeNames.length - 1) % shapeNames.length;
  document.getElementById("shapeName").innerHTML = shapeNames[shape];
}

function togglePerspective() {
  perspectiveView = ! perspectiveView;
  if (perspectiveView) {
    document.getElementById("viewMode").innerHTML = "perspective";
  } else {
    document.getElementById("viewMode").innerHTML = "orthographic";
  }
}

function screenVerticesToTriangle(point1, point2, point3) {
  return "polygon(" + String(point1[0]) + "% "+ String(point1[1]) + "%,"
    + String(point2[0]) + "% " + String(point2[1]) + "%,"
    + String(point3[0]) + "% " + String(point3[1]) + "%)";
}

function perspectiveMapPointToScreen(point) {
  return [
    point[0] / ((point[2] + camZDisp) * FOV[0]) * shapeSize * camZDisp * persViewSizeMult + 50,
    point[1] / ((point[2] + camZDisp) * FOV[1]) * shapeSize * camZDisp * persViewSizeMult + 50
  ];
}

function orthographicMapPointToScreen(point) {
  return [
    point[0] / FOV[0] * shapeSize + 50,
    point[1] / FOV[1] * shapeSize + 50
  ];
}

function rotatePoint(point) {
  var sinx = Math.sin(alpha);
  var cosx = Math.cos(alpha);
  var siny = Math.sin(beta);
  var cosy = Math.cos(beta);
  return [
    point[0] * cosy + (point[1] * sinx + point[2] * cosx) * siny,
    point[1] * cosx - point[2] * sinx,
    - point[0] * siny + (point[1] * sinx + point[2] * cosx) * cosy
  ];
}

for (var i = 0; i < triangleCount[shape]; i++) {
  var box = document.createElement("div");
  box.setAttribute("class", "triangle");
  box.setAttribute("id", String(i));
  document.getElementById("viewport").appendChild(box);
}

setInterval(function () {
  for (var i = 0; i < triangleCount[shape]; i++) {
    var box = document.getElementById(String(i));
    
    var normal = rotatePoint(shapeNormals[shape][i], alpha, beta);
    if (normal[2] > 0) {
      box.style["display"] = "none";
      continue;
    }
    var slant = Math.floor(Math.sin(- normal[1]) * 0x80) + 0x80;
    var slantHexStr = slant.toString(16);
    box.style["background-color"] = "#" + slantHexStr + slantHexStr + slantHexStr;
    box.style["display"] = "block";
    box.style["z-index"] = 0xFFFF - Math.floor(normal[2] * 0xFFFF);
    
    var triangleRotatedPoints = [
      rotatePoint(shapePoints[shape][shapeTriangles[shape][i][0]]),
      rotatePoint(shapePoints[shape][shapeTriangles[shape][i][1]]),
      rotatePoint(shapePoints[shape][shapeTriangles[shape][i][2]])
    ];
    
    var pointsOnScreen;
    if (perspectiveView) {
      pointsOnScreen = [
        perspectiveMapPointToScreen(triangleRotatedPoints[0]),
        perspectiveMapPointToScreen(triangleRotatedPoints[1]),
        perspectiveMapPointToScreen(triangleRotatedPoints[2])
      ];
    } else {
      pointsOnScreen = [
        orthographicMapPointToScreen(triangleRotatedPoints[0]),
        orthographicMapPointToScreen(triangleRotatedPoints[1]),
        orthographicMapPointToScreen(triangleRotatedPoints[2])
      ];
    }

    
    box.style["clip-path"] = screenVerticesToTriangle(pointsOnScreen[0], pointsOnScreen[1], pointsOnScreen[2]);
  }
  
  for (var i = triangleCount[shape]; i < triangleCountMax; i++) {
    var box = document.getElementById(String(i));
    box.style["display"] = "none";
  }
  
  alpha = (alpha + dAlpha) % 6.2831853072;
  beta = (beta + dBeta) % 6.2831853072;
}, 50);
