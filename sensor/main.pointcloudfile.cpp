#include <iostream>
#include <kinect_device.h>
#include <kinect_point_cloud.h>
#include <kinect_capture.h>
#include <kinect_image.h>
#include <time.h>

int main()
{
  k4a_device_configuration_t *config;
  k4a_calibration_t calibration;
  k4a_capture_t hCapture;
  k4a_image_t hImage;
  k4a_image_t hPointCloudImage;
  uint8_t *point_cloud_buffer;
  int point_count;

  KinectDevice device;
  KinectPointCloud pointCloud;

  config = device.get_configuration();
  config->color_format = K4A_IMAGE_FORMAT_COLOR_MJPG;
  config->color_resolution = K4A_COLOR_RESOLUTION_720P;
  config->depth_mode = K4A_DEPTH_MODE_WFOV_2X2BINNED;
  config->camera_fps = K4A_FRAMES_PER_SECOND_5;

  device.get_calibration(&calibration);
  pointCloud.calibrate(&calibration);
  point_cloud_buffer = (uint8_t *)malloc(calibration.depth_camera_calibration.resolution_width * calibration.depth_camera_calibration.resolution_height * sizeof(k4a_float3_t) + sizeof(int) + sizeof(int)); // 3 = xyz

  device.print_serial();
  device.start_cameras();
  device.get_capture(&hCapture, 2000);

  KinectCapture capture(hCapture);

  do
  {
    printf("Getting capture...\n");
    hImage = capture.get_depth_image();
    pointCloud.generate(hImage, &hPointCloudImage, &point_count);
    KinectImage image(hImage);
    KinectImage pointCloudImage(hPointCloudImage);
    int width = pointCloudImage.get_width_pixels();
    int height = pointCloudImage.get_height_pixels();
    k4a_float3_t *point_cloud_data = (k4a_float3_t *)(void *)pointCloudImage.get_buffer();
    int total_size = 0;
    int sizeof_point = sizeof(float) * 3;
    int type = 2;
    int i;
    int offset = 0;
    int offset_for_size;

    memcpy(&point_cloud_buffer[offset], &type, sizeof(int));
    offset += sizeof(int);

    offset_for_size = offset;
    offset += sizeof(int);

    for (i = 0; i < width * height; i += 1)
    {
      if (isnan(point_cloud_data[i].xyz.x) || isnan(point_cloud_data[i].xyz.y) || isnan(point_cloud_data[i].xyz.z))
      {
        continue;
      }

      memcpy(&point_cloud_buffer[offset], &point_cloud_data[i].v, sizeof_point);
      offset += sizeof_point;
      total_size += sizeof_point;
    }

    memcpy(&point_cloud_buffer[offset_for_size], &total_size, sizeof(int));

    FILE *f = fopen("temp.bin", "wb");
    fwrite(point_cloud_buffer, total_size + sizeof(int) + sizeof(int), 1, f);
    fclose(f);

    break;

  } while (hImage == NULL);

  device.stop_cameras();
  device.close();
  printf("Done\n");
}