#ifndef KINECT_POINT_CLOUD_H
#define KINECT_POINT_CLOUD_H

#include <k4a/k4a.h>

class KinectPointCloud
{
private:
  k4a_calibration_t *_calibration;
  k4a_image_t _xy_table;
  void _create_xy_table();
  k4a_result_t _create_image(k4a_image_t *point_cloud, int point_size);

public:
  KinectPointCloud();
  ~KinectPointCloud();

  void calibrate(k4a_calibration_t *calibration);
  void generate(k4a_image_t depth_image, k4a_image_t *point_cloud, int *point_count);
};

#endif