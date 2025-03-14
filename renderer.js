var perspectiveView = true;
var colorView = true;
var shadeView = true;
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

function toggleColor() {
  colorView = ! colorView;
  if (colorView) {
    document.getElementById("colorMode").innerHTML = "colored";
  } else {
    document.getElementById("colorMode").innerHTML = "uncolored";
  }
}

function toggleShade() {
  shadeView = ! shadeView;
  if (shadeView) {
    document.getElementById("shadeMode").innerHTML = "shaded";
  } else {
    document.getElementById("shadeMode").innerHTML = "unshaded";
  }
}

function screenVerticesToTriangle(point1, point2, point3) {
  return "polygon(" + String(point1[0]) + "% " + String(point1[1]) + "%,"
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
    -point[0] * siny + (point[1] * sinx + point[2] * cosx) * cosy
  ];
}

function numToHex(input) {
  if (input >= 255) {
    return "FF";
  }
  if (input <= 0) {
    return "00"
  }
  
  var rawStr = (Math.floor(input)).toString(16);
  if (rawStr.length == 1) {
    return "0" + rawStr;
  }
  return rawStr;
}

for (var i = 0; i < triangleCountMax; i++) {
  var box = document.createElement("div");
  box.setAttribute("class", "triangle");
  box.setAttribute("id", String(i));
  document.getElementById("viewport").appendChild(box);
}

setInterval(function () {
  for (var i = 0; i < triangleCount[shape]; i++) {
    var box = document.getElementById(String(i));

    var point1; var point2; var point3;
    var quadArrLen2 = shapeQuads[shape].length * 2;
    if (i < quadArrLen2) {
      if (i % 2 == 0) {
        var quadInd = i / 2;
        point1 = shapeQuads[shape][quadInd][0];
        point2 = shapeQuads[shape][quadInd][1];
        point3 = shapeQuads[shape][quadInd][2];
      } else {
        var quadInd = (i - 1) / 2;
        point1 = shapeQuads[shape][quadInd][0];
        point2 = shapeQuads[shape][quadInd][3];
        point3 = shapeQuads[shape][quadInd][1];
      }
    } else {
      point1 = shapeTriangles[shape][i - quadArrLen2][0];
      point2 = shapeTriangles[shape][i - quadArrLen2][1];
      point3 = shapeTriangles[shape][i - quadArrLen2][2];
    }

    var triangleRotatedPoints = [
      rotatePoint(shapePoints[shape][point1]),
      rotatePoint(shapePoints[shape][point2]),
      rotatePoint(shapePoints[shape][point3])
    ];
    
    var vectToTriangleMid = [
      (triangleRotatedPoints[0][0] + triangleRotatedPoints[1][0] + triangleRotatedPoints[2][0]) / 3,
      (triangleRotatedPoints[0][1] + triangleRotatedPoints[1][1] + triangleRotatedPoints[2][1]) / 3,
      (triangleRotatedPoints[0][2] + triangleRotatedPoints[1][2] + triangleRotatedPoints[2][2]) / 3 + camZDisp
    ];
    
    var vectSideA = [
      triangleRotatedPoints[1][0] - triangleRotatedPoints[0][0],
      triangleRotatedPoints[1][1] - triangleRotatedPoints[0][1],
      triangleRotatedPoints[1][2] - triangleRotatedPoints[0][2]
    ];
    
    var vectSideB = [
      triangleRotatedPoints[2][0] - triangleRotatedPoints[0][0],
      triangleRotatedPoints[2][1] - triangleRotatedPoints[0][1],
      triangleRotatedPoints[2][2] - triangleRotatedPoints[0][2]
    ];
    
    var crossProd = [
      vectSideA[1] * vectSideB[2] - vectSideA[2] * vectSideB[1],
      vectSideA[2] * vectSideB[0] - vectSideA[0] * vectSideB[2],
      vectSideA[0] * vectSideB[1] - vectSideA[1] * vectSideB[0]
    ];
    
    var crossMag = (crossProd[0] ** 2 + crossProd[1] ** 2 + crossProd[2] ** 2) ** 0.5;
    var normal = [
      crossProd[0] / crossMag,
      crossProd[1] / crossMag,
      crossProd[2] / crossMag
    ];
    
    var dotProd = vectToTriangleMid[0] * normal[0] + vectToTriangleMid[1] * normal[1] + (vectToTriangleMid[2]) * normal[2];
    
    if (perspectiveView) {
      if (dotProd >= 0) {
        box.style["display"] = "none";
        continue;
      }
    } else {
      if (normal[2] >= 0) {
        box.style["display"] = "none";
        continue;
      }
    }

    var color = [255, 255, 255];
    var shadeMultiplier = 1;
    
    if (colorView) {
      color = triangleColors[i%6];
    }
    if (shadeView) {
      shadeMultiplier = (1 - (normal[1] + 1) * 0.5);
    }
    
    box.style["background-color"] = "#" + numToHex(shadeMultiplier*color[0]) + numToHex(shadeMultiplier*color[1]) + numToHex(shadeMultiplier*color[2]);
    box.style["display"] = "block";
    
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

    box.style["z-index"] = 0xFFFFFF - Math.floor((triangleRotatedPoints[0][2] + triangleRotatedPoints[1][2] + triangleRotatedPoints[2][2]) * 0x4CCCCC);
    box.style["clip-path"] = screenVerticesToTriangle(pointsOnScreen[0], pointsOnScreen[1], pointsOnScreen[2]);
  }
  
  for (var i = triangleCount[shape]; i < triangleCountMax; i++) {
    var box = document.getElementById(String(i));
    box.style["display"] = "none";
  }
  
  alpha = (alpha + dAlpha) % 6.2831853072;
  beta = (beta + dBeta) % 6.2831853072;
}, 50);
