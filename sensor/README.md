mkdir packages
cd packages
nuget install Microsoft.Azure.Kinect.Sensor
nuget install Microsoft.Azure.Kinect.BodyTracking

cp packages/Microsoft.Azure.Kinect.BodyTracking.0.9.1/content/dnn_model.onnx .

```
"command": "cl.exe",
"args": [
  "/EHsc",
  "/Zi",
  "/nologo",
  "/I${workspaceFolder}\\packages\\Microsoft.Azure.Kinect.Sensor.1.1.1\\build\\native\\include",
  "/I${workspaceFolder}\\packages\\Microsoft.Azure.Kinect.BodyTracking.0.9.1\\build\\native\\include",
  "/Fo:./bin/",
  "main.cpp",
  "k4a.lib",
  "/link",
  "/LIBPATH:${workspaceFolder}\\packages\\Microsoft.Azure.Kinect.Sensor.1.1.1\\lib\\native\\amd64\\release",
  "/LIBPATH:${workspaceFolder}\\packages\\Microsoft.Azure.Kinect.BodyTracking.0.9.1\\lib\\native\\amd64\\release",
  "/out:bin\\main.exe"
]
```