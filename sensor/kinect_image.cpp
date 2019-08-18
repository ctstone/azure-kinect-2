#include <kinect_image.h>
#include <iostream>

KinectImage::KinectImage(k4a_image_t image)
{
  _image = image;
}

KinectImage::~KinectImage()
{
  if (_image != NULL)
  {
    k4a_image_release(_image);
  }
}

int KinectImage::get_size()
{
  return k4a_image_get_size(_image);
}

uint8_t *KinectImage::get_buffer()
{
  return k4a_image_get_buffer(_image);
}

uint64_t KinectImage::get_exposure_usec()
{
  return k4a_image_get_exposure_usec(_image);
}

k4a_image_format_t KinectImage::get_format()
{
  return k4a_image_get_format(_image);
}

int KinectImage::get_width_pixels()
{
  return k4a_image_get_width_pixels(_image);
}

int KinectImage::get_height_pixels()
{
  return k4a_image_get_height_pixels(_image);
}

int KinectImage::get_iso_speed()
{
  return k4a_image_get_iso_speed(_image);
}

int KinectImage::get_stride_bytes()
{
  return k4a_image_get_stride_bytes(_image);
}

uint64_t KinectImage::get_timestamp_usec()
{
  return k4a_image_get_timestamp_usec(_image);
}

int KinectImage::get_white_balance()
{
  return k4a_image_get_white_balance(_image);
}