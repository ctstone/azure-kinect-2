#include <kinect_capture.h>
#include <iostream>

KinectCapture::KinectCapture(k4a_capture_t capture)
{
  _capture = capture;
}

KinectCapture::~KinectCapture()
{
  if (_capture != NULL)
  {
    k4a_capture_release(_capture);
  }
}

k4a_image_t KinectCapture::get_color_image()
{
  return k4a_capture_get_color_image(_capture);
}

k4a_image_t KinectCapture::get_depth_image()
{
  return k4a_capture_get_depth_image(_capture);
}

k4a_image_t KinectCapture::get_ir_image()
{
  return k4a_capture_get_ir_image(_capture);
}

float KinectCapture::get_temperature_c()
{
  return k4a_capture_get_temperature_c(_capture);
}
