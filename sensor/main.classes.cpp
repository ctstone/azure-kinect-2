#include <iostream>
#include <kinect_device.h>
#include <kinect_image.h>
#include <kinect_point_cloud.h>

#define ERROR_OPEN 1
#define ERROR_START_CAMERAS 2
#define ERROR_CAPTURE 3
#define ERROR_CALIBRATION 4

int main()
{
  KinectDevice device;
  KinectPointCloud point_cloud;
  k4a_result_t result;
  k4a_wait_result_t wait_result;
  k4a_capture_t hCapture;
  k4a_image_t hImage;
  k4a_image_t hPointCloudImage;
  int point_count;
  k4a_device_configuration_t *config = device.get_configuration();
  k4a_calibration_t calibration;
  int image_w, image_h, image_size;
  uint8_t *image_buffer;
  int returnCode = 0;
  int i;

  if (!device.is_open())
  {
    returnCode = ERROR_OPEN;
    goto Exit;
  }

  device.print_serial();

  (*config).color_format = K4A_IMAGE_FORMAT_COLOR_MJPG;
  (*config).color_resolution = K4A_COLOR_RESOLUTION_720P;
  (*config).depth_mode = K4A_DEPTH_MODE_WFOV_2X2BINNED;

  if (device.get_calibration(&calibration) != K4A_RESULT_SUCCEEDED)
  {
    returnCode = ERROR_CALIBRATION;
    goto Exit;
  }

  point_cloud.calibrate(calibration);

  if (device.start_cameras() != K4A_RESULT_SUCCEEDED)
  {
    returnCode = ERROR_START_CAMERAS;
    goto Exit;
  }

  for (i = 0; i < 10; i += 1)
  {
    wait_result = device.get_capture(&hCapture, 2000);

    if (wait_result == K4A_WAIT_RESULT_FAILED)
    {
      returnCode = ERROR_CAPTURE;
      goto Exit;
    }
    else if (wait_result != K4A_WAIT_RESULT_SUCCEEDED)
    {
      continue;
    }

    KinectCapture capture(hCapture);
    hImage = capture.get_color_image();
    if (hImage != NULL)
    {
      KinectImage image(hImage);
      image_size = image.get_size();
      image_w = image.get_width_pixels();
      image_h = image.get_height_pixels();
      image_buffer = image.get_buffer();
      printf("Color Image (%d bytes, %d x %dpx)\n", image_size, image_w, image_h);
    }

    hImage = capture.get_depth_image();
    if (hImage != NULL)
    {
      KinectImage image(hImage);
      point_cloud.generate(hImage, &hPointCloudImage, &point_count);

      if (hPointCloudImage != NULL)
      {
        KinectImage pointCloudImage(hPointCloudImage);
        printf("Depth Image (%d points, %d x %d)\n",
               point_count,
               pointCloudImage.get_width_pixels(),
               pointCloudImage.get_height_pixels());
      }
    }
  }

Exit:
  printf("Done (%d)\n", returnCode);
  return returnCode;
}