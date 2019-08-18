// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include <k4a/k4a.h>
#include <math.h>
#include <string>
#include <iostream>
#include <fstream>
#include <sstream>

// #include <fast_point_cloud.h>
#include <kinect_point_cloud.h>

static void write_point_cloud(const char *file_name, const k4a_image_t point_cloud, int point_count)
{
  int width = k4a_image_get_width_pixels(point_cloud);
  int height = k4a_image_get_height_pixels(point_cloud);

  k4a_float3_t *point_cloud_data = (k4a_float3_t *)(void *)k4a_image_get_buffer(point_cloud);

  // save to the ply file
  std::ofstream ofs(file_name); // text mode first
  ofs << "ply" << std::endl;
  ofs << "format ascii 1.0" << std::endl;
  ofs << "element vertex"
      << " " << point_count << std::endl;
  ofs << "property float x" << std::endl;
  ofs << "property float y" << std::endl;
  ofs << "property float z" << std::endl;
  ofs << "end_header" << std::endl;
  ofs.close();

  std::stringstream ss;
  for (int i = 0; i < width * height; i++)
  {
    if (isnan(point_cloud_data[i].xyz.x) || isnan(point_cloud_data[i].xyz.y) || isnan(point_cloud_data[i].xyz.z))
    {
      continue;
    }

    ss << (float)point_cloud_data[i].xyz.x << " " << (float)point_cloud_data[i].xyz.y << " "
       << (float)point_cloud_data[i].xyz.z << std::endl;
  }

  std::ofstream ofs_text(file_name, std::ios::out | std::ios::app);
  ofs_text.write(ss.str().c_str(), (std::streamsize)ss.str().length());
}

int main(int argc, char **argv)
{
  int returnCode = 1;
  k4a_device_t device = NULL;
  const int32_t TIMEOUT_IN_MS = 1000;
  k4a_capture_t capture = NULL;
  std::string file_name;
  uint32_t device_count = 0;
  k4a_device_configuration_t config = K4A_DEVICE_CONFIG_INIT_DISABLE_ALL;
  k4a_image_t depth_image = NULL;
  // k4a_image_t xy_table = NULL;
  k4a_image_t point_cloud = NULL;
  int point_count = 0;
  KinectPointCloud pc;

  if (argc != 2)
  {
    printf("fastpointcloud.exe <output file>\n");
    returnCode = 2;
    goto Exit;
  }

  file_name = argv[1];

  device_count = k4a_device_get_installed_count();

  if (device_count == 0)
  {
    printf("No K4A devices found\n");
    return 0;
  }

  if (K4A_RESULT_SUCCEEDED != k4a_device_open(K4A_DEVICE_DEFAULT, &device))
  {
    printf("Failed to open device\n");
    goto Exit;
  }

  config.depth_mode = K4A_DEPTH_MODE_WFOV_2X2BINNED;
  config.camera_fps = K4A_FRAMES_PER_SECOND_30;

  k4a_calibration_t calibration;
  if (K4A_RESULT_SUCCEEDED !=
      k4a_device_get_calibration(device, config.depth_mode, config.color_resolution, &calibration))
  {
    printf("Failed to get calibration\n");
    goto Exit;
  }

  // k4a_result_t res;
  // printf("Creating image xy_table\n");
  // res = fp_image_create(&calibration, &xy_table, sizeof(k4a_float2_t));
  // printf("Done %d\n", res);

  // printf("Creating xy table\n");
  // fp_create_xy_table(&calibration, xy_table);
  // printf("Done\n");

  // printf("Creating image xy_table\n");
  // res = fp_image_create(&calibration, &point_cloud, sizeof(k4a_float3_t));
  // printf("Done %d\n", res);

  pc.calibrate(&calibration);

  if (K4A_RESULT_SUCCEEDED != k4a_device_start_cameras(device, &config))
  {
    printf("Failed to start cameras\n");
    goto Exit;
  }

  // Get a capture
  switch (k4a_device_get_capture(device, &capture, TIMEOUT_IN_MS))
  {
  case K4A_WAIT_RESULT_SUCCEEDED:
    break;
  case K4A_WAIT_RESULT_TIMEOUT:
    printf("Timed out waiting for a capture\n");
    goto Exit;
  case K4A_WAIT_RESULT_FAILED:
    printf("Failed to read a capture\n");
    goto Exit;
  }

  // Get a depth image
  depth_image = k4a_capture_get_depth_image(capture);
  if (depth_image == 0)
  {
    printf("Failed to get depth image from capture\n");
    goto Exit;
  }

  // fp_generate_point_cloud(depth_image, xy_table, point_cloud, &point_count);
  pc.generate(depth_image, &point_cloud, &point_count);

  write_point_cloud(file_name.c_str(), point_cloud, point_count);

  k4a_image_release(depth_image);
  k4a_capture_release(capture);
  // k4a_image_release(xy_table);
  k4a_image_release(point_cloud);

  returnCode = 0;
Exit:
  if (device != NULL)
  {
    k4a_device_close(device);
  }

  return returnCode;
}