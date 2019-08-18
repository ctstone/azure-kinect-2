#ifndef KINECT_IMAGE_CAPTURE_H
#define KINECT_IMAGE_CAPTURE_H

#include <k4a/k4a.h>

class KinectImage
{
private:
  k4a_image_t _image;

public:
  KinectImage(k4a_image_t image);
  ~KinectImage();

  int get_size();
  uint8_t *get_buffer();
  uint64_t get_exposure_usec();
  k4a_image_format_t get_format();
  int get_width_pixels();
  int get_height_pixels();
  int get_iso_speed();
  int get_stride_bytes();
  uint64_t get_timestamp_usec();
  int get_white_balance();

};

#endif