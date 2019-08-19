#include <windows.h>
#include <signal.h>
#include <iostream>

#include <pipe_server.h>
#include <kinect_device.h>
#include <kinect_point_cloud.h>
// #include <fast_point_cloud.h>
#include <kinect_image.h>
#include <kinect_bt_tracker.h>
#include <kinect_bt_frame.h>

#define BUFFER_SIZE (3145728 * 2)
#define ERROR_SERVER_START 1
#define ERROR_OPEN 2
#define ERROR_START_CAMERAS 3
#define ERROR_CAPTURE 4
#define ERROR_CALIBRATION 5
#define ERROR_TRACKER 6
#define MESSAGE_TYPE_RGB 1
#define MESSAGE_TYPE_POINT_CLOUD 2
#define MESSAGE_TYPE_BODY 3

BOOL interrupted = FALSE;
void sig_handler(int signo)
{
  interrupted = true;
}

int main()
{
  int return_code = 0;
  k4a_device_configuration_t *config;
  k4a_calibration_t calibration;
  k4a_wait_result_t wait_result;
  k4a_capture_t hCapture;
  k4a_image_t hImage;
  uint8_t *image_buffer;
  uint8_t *point_cloud_buffer;
  k4abt_frame_t hBodyFrame;
  k4abt_body_t body;
  k4a_image_t hPointCloudImage;
  k4a_image_t hXyTable;
  bool write_result;
  int image_size;
  int point_count;
  int body_count;
  int i;

  signal(SIGINT, sig_handler);

  PipeServer server;
  KinectDevice device;
  KinectPointCloud pointCloud;
  KinectTracker tracker;

  server.set_interrupt(&interrupted);

  if (!device.is_open())
  {
    return_code = ERROR_OPEN;
    goto Exit;
  }

  device.print_serial();
  config = device.get_configuration();
  config->color_format = K4A_IMAGE_FORMAT_COLOR_MJPG;
  config->color_resolution = K4A_COLOR_RESOLUTION_720P;
  config->depth_mode = K4A_DEPTH_MODE_WFOV_2X2BINNED;
  config->camera_fps = K4A_FRAMES_PER_SECOND_5;

  if (device.get_calibration(&calibration) != K4A_RESULT_SUCCEEDED)
  {
    return_code = ERROR_CALIBRATION;
    goto Exit;
  }

  pointCloud.calibrate(&calibration);

  // if (tracker.calibrate(&calibration) != K4A_RESULT_SUCCEEDED)
  // {
  //   return_code = ERROR_TRACKER;
  //   goto Exit;
  // }

  if (!server.start(TEXT("\\\\.\\pipe\\Pipe"), BUFFER_SIZE))
  {
    return_code = ERROR_SERVER_START;
    goto Exit;
  }

  while (!interrupted && !return_code)
  {
    printf("Waiting for client...\n");

    if (server.connect())
    {
      printf("Connected!\n");
      printf("Create buffer size %d\n", (int)(calibration.depth_camera_calibration.resolution_width * calibration.depth_camera_calibration.resolution_height * sizeof(k4a_float3_t)));
      point_cloud_buffer = (uint8_t *)malloc(calibration.depth_camera_calibration.resolution_width * calibration.depth_camera_calibration.resolution_height * sizeof(k4a_float3_t)); // 3 = xyz

      if (device.start_cameras() != K4A_RESULT_SUCCEEDED)
      {
        return_code = ERROR_START_CAMERAS;
        goto Exit;
      }
      while (!interrupted)
      {
        wait_result = device.get_capture(&hCapture, 2000);
        if (wait_result == K4A_WAIT_RESULT_FAILED)
        {
          return_code = ERROR_CAPTURE;
          goto Exit;
        }
        else if (wait_result != K4A_WAIT_RESULT_SUCCEEDED)
        {
          continue;
        }

        KinectCapture capture(hCapture);

        // // RGB image
        // hImage = capture.get_color_image();
        // if (hImage != NULL)
        // {
        //   KinectImage image(hImage);
        //   image_size = image.get_size();
        //   image_buffer = image.get_buffer();
        //   if (!server.write_message(MESSAGE_TYPE_RGB, image_buffer, image_size, NULL))
        //   {
        //     break;
        //   }
        // }

        // Point cloud
        hImage = capture.get_depth_image();
        if (hImage != NULL)
        {
          pointCloud.generate(hImage, &hPointCloudImage, &point_count);
          KinectImage image(hImage);
          KinectImage pointCloudImage(hPointCloudImage);
          int width = pointCloudImage.get_width_pixels();
          int height = pointCloudImage.get_height_pixels();
          k4a_float3_t *point_cloud_data = (k4a_float3_t *)(void *)pointCloudImage.get_buffer();
          int total_size = 0;
          int sizeof_point = sizeof(float) * 3;
          int type = MESSAGE_TYPE_POINT_CLOUD;
          DWORD wrote;
          int i;
          int offset = 0;

          for (i = 0; i < width * height; i += 1)
          {
            if (isnan(point_cloud_data[i].xyz.x) || isnan(point_cloud_data[i].xyz.y) || isnan(point_cloud_data[i].xyz.z))
            {
              continue;
            }
            total_size += sizeof_point;

            memcpy(&point_cloud_buffer[offset], &point_cloud_data[i].v, sizeof_point);
            offset += sizeof_point;
          }

          if (!server.write_message(type, point_cloud_buffer, total_size, &wrote))
          {
            printf("%d\n", wrote);
            break;
          }
        }

        // Body Skeleton
        // write_result = true;
        // if (tracker.enqueue_capture(hCapture, 2000) == K4A_WAIT_RESULT_SUCCEEDED)
        // {
        //   if (tracker.pop_result(&hBodyFrame, 2000) == K4A_WAIT_RESULT_SUCCEEDED)
        //   {
        //     KinectTrackerFrame bodyFrame(hBodyFrame);
        //     body_count = bodyFrame.get_num_bodies();
        //     for (i = 0; i < body_count; i += 1)
        //     {
        //       body.id = bodyFrame.get_body_id(i);
        //       bodyFrame.get_body_skeleton(i, &body.skeleton);
        //       write_result = server.write_message(MESSAGE_TYPE_BODY, &body, sizeof(k4abt_body_t), NULL);
        //       if (!write_result)
        //       {
        //         break;
        //       }
        //     }
        //   }
        //   else
        //   {
        //     printf("Could not pop tracker result\n");
        //   }
        // }
        // else
        // {
        //   printf("Could not pop tracker result\n");
        // }
        // if (!write_result)
        // {
        //   break;
        // }
      }
      printf("Disconnecting\n");
      device.stop_cameras();
      server.disconnect();
      free(point_cloud_buffer);
    }
    else
    {
      return_code = server.get_error();
    }
  }

Exit:
  printf("Done (%d)\n", return_code);
  return return_code;
}
