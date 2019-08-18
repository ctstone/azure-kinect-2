#ifndef KINECT_DEVICE_CAPTURE_H
#define KINECT_DEVICE_CAPTURE_H

#include <k4a/k4a.h>

class KinectCapture
{
private:
  k4a_capture_t _capture;

public:
  KinectCapture(k4a_capture_t capture);
  ~KinectCapture();

  k4a_image_t get_color_image();
  k4a_image_t get_depth_image();
  k4a_image_t get_ir_image();
  float get_temperature_c();
};

#endif