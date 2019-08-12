nuget install Microsoft.Azure.Kinect.Sensor

```
"command": "cl.exe",
"args": [
  "/EHsc",
  "/Zi",
  "/nologo",
  "/I${workspaceFolder}\\packages\\Microsoft.Azure.Kinect.Sensor.1.1.1\\build\\native\\include",
  "/Fe:",
  "main.exe",
  "main.cpp",
  "k4a.lib",
  "/link",
  "/LIBPATH:${workspaceFolder}\\packages\\Microsoft.Azure.Kinect.Sensor.1.1.1\\lib\\native\\amd64\\release"
]
```