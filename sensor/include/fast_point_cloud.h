#ifndef FAST_POINT_CLOUD_H
#define FAST_POINT_CLOUD_H

#include <k4a/k4a.h>

k4a_result_t fp_image_create(const k4a_calibration_t *calibration, k4a_image_t *image, int point_size);
void fp_create_xy_table(const k4a_calibration_t *calibration, k4a_image_t xy_table);
void fp_generate_point_cloud(const k4a_image_t depth_image, const k4a_image_t xy_table, k4a_image_t point_cloud, int *point_count);

#endif