#include <string>
#include <k4a/k4a.h>
#include <k4abt.h>

int main()
{
  k4a_device_configuration_t deviceConfig = K4A_DEVICE_CONFIG_INIT_DISABLE_ALL;
  deviceConfig.depth_mode = K4A_DEPTH_MODE_WFOV_2X2BINNED;
  deviceConfig.color_resolution = K4A_COLOR_RESOLUTION_OFF;

  printf("Opening device\n");
  k4a_device_t device = nullptr;
  k4a_device_open(0, &device);

  printf("Starting cameras\n");
  k4a_device_start_cameras(device, &deviceConfig);

  printf("Getting calibration\n");
  k4a_calibration_t sensorCalibration;
  k4a_device_get_calibration(device, deviceConfig.depth_mode, deviceConfig.color_resolution, &sensorCalibration);

  printf("Creating tracker\n");
  k4abt_tracker_t tracker = nullptr;
  k4abt_tracker_create(&sensorCalibration, &tracker);

  printf("Getting capture");
  k4a_capture_t sensorCapture = nullptr;
  k4a_wait_result_t captureRes = k4a_device_get_capture(device, &sensorCapture, 0);
  printf("  %d\n", captureRes);

  if (captureRes == K4A_WAIT_RESULT_SUCCEEDED)
  {
    printf("Enequeing tracker capture");
    k4a_wait_result_t trackerQueueRes = k4abt_tracker_enqueue_capture(tracker, sensorCapture, 0);
    printf("  %d\n", trackerQueueRes);
    k4a_capture_release(sensorCapture);

    if (trackerQueueRes == K4A_WAIT_RESULT_SUCCEEDED)
    {
      printf("Getting body frame");
      k4abt_frame_t bodyFrame = nullptr;
      k4a_wait_result_t popFrameResult = k4abt_tracker_pop_result(tracker, &bodyFrame, 0);
      printf("  %d\n", popFrameResult);

      if (popFrameResult == K4A_WAIT_RESULT_SUCCEEDED)
      {
        printf("Getting original capture\n");
        k4a_capture_t originalCapture = k4abt_frame_get_capture(bodyFrame);

        printf("Getting body count\n");
        int num_bodies = k4abt_frame_get_num_bodies(bodyFrame);
        printf("Bodies = %d", num_bodies);
        if (num_bodies > 0)
        {
          printf("Getting skeleton\n");
          const int bodyIndex = 0;
          k4abt_body_t body;
          k4abt_frame_get_body_skeleton(bodyFrame, bodyIndex, &body.skeleton); // TODO loop?
          body.id = k4abt_frame_get_body_id(bodyFrame, bodyIndex);
          printf("BODY # %d", body.id);
        }

        k4a_capture_release(originalCapture);
        k4abt_frame_release(bodyFrame);
      }
    }
  }

  k4abt_tracker_destroy(tracker);
  k4a_device_close(device);
}
