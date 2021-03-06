#include <windows.h>
#include <iostream>
#include <vector>
#include <string>
#include <signal.h>

#include <k4a/k4a.h>
#include <k4abt.h>

using namespace std;

enum MessageType
{
  image_rgb = 1,
  image_point_cloud = 2,
  body = 3,
  json = 4,
};

k4a_device_t
open_device(uint32_t index)
{
  k4a_device_t device = NULL;
  if (K4A_FAILED(k4a_device_open(index, &device)))
  {
    printf("Failed to open the device\n");
    exit(1);
  }
  return device;
}

void print_device_serialnum(k4a_device_t device)
{
  size_t serial_size = 0;
  k4a_device_get_serialnum(device, NULL, &serial_size);
  char *serial = (char *)(malloc(serial_size));
  k4a_device_get_serialnum(device, serial, &serial_size);
  printf("Device Serial: %s\n", serial);
  free(serial);
}

k4a_device_configuration_t get_device_configuration1()
{
  k4a_device_configuration_t config = K4A_DEVICE_CONFIG_INIT_DISABLE_ALL;
  config.color_format = K4A_IMAGE_FORMAT_COLOR_MJPG;
  config.color_resolution = K4A_COLOR_RESOLUTION_720P;
  config.depth_mode = K4A_DEPTH_MODE_WFOV_2X2BINNED;
  // config.camera_fps = K4A_FRAMES_PER_SECOND_5;
  return config;
}

k4a_calibration_t get_device_calibration(k4a_device_t device, k4a_device_configuration_t config)
{
  k4a_calibration_t calibration;
  if (K4A_RESULT_SUCCEEDED !=
      k4a_device_get_calibration(device, config.depth_mode, config.color_resolution, &calibration))
  {
    printf("Failed to get calibration\n");
    exit(1);
  }
  return calibration;
}

void start_cameras(k4a_device_t device, k4a_device_configuration_t *config)
{
  if (K4A_FAILED(k4a_device_start_cameras(device, config)))
  {
    printf("Failed to start cameras\n");
    exit(1);
  }
}

void write_image(char *filename, uint8_t *bytes, DWORD size)
{
  FILE *f = fopen(filename, "wb");
  if (f == NULL)
  {
    printf("Failed to create file\n");
    exit(1);
  }
  fwrite(&size, sizeof(DWORD), 1, f);
  fwrite(bytes, size, 1, f);
}

BOOL write_image_to_pipe(HANDLE pipe, k4a_image_t image, MessageType type)
{
  uint8_t *image_data = k4a_image_get_buffer(image);
  size_t image_size = k4a_image_get_size(image);
  DWORD n_wrote_total = 0;
  DWORD n_wrote;

  WriteFile(pipe, &type, sizeof(MessageType), &n_wrote, NULL);
  WriteFile(pipe, &image_size, sizeof(DWORD), &n_wrote, NULL);

  // printf("[ IMAGE ] Writing %d bytes\n", (int)image_size);

  do
  {
    if (!WriteFile(pipe, image_data, image_size, &n_wrote, NULL))
    {
      break;
    }
    n_wrote_total += n_wrote;
  } while (n_wrote_total < image_size);

  return n_wrote_total == image_size;
}

BOOL write_body_to_pipe(HANDLE pipe, k4abt_body_t body)
{
  DWORD n_wrote_total = 0;
  DWORD n_wrote;
  int size = sizeof(k4abt_body_t);

  MessageType type = MessageType::body;

  WriteFile(pipe, &type, sizeof(MessageType), &n_wrote, NULL);
  WriteFile(pipe, &size, sizeof(DWORD), &n_wrote, NULL);

  do
  {
    if (!WriteFile(pipe, &body, size, &n_wrote, NULL))
    {
      break;
    }
    n_wrote_total += n_wrote;
  } while (n_wrote_total < size);

  return n_wrote_total == size;
}

BOOL write_point_cloud_to_pipe(HANDLE pipe, k4a_image_t point_cloud, int point_count)
{
  int width = k4a_image_get_width_pixels(point_cloud);
  int height = k4a_image_get_height_pixels(point_cloud);
  k4a_float3_t *point_cloud_data = (k4a_float3_t *)(void *)k4a_image_get_buffer(point_cloud);
  MessageType type = MessageType::image_point_cloud;
  DWORD n_wrote;
  float x, y, z;
  int total_size = 0;
  BOOL status;

  int compress = 3;

  for (int i = 0; i < width * height; i += compress)
  {
    if (isnan(point_cloud_data[i].xyz.x) || isnan(point_cloud_data[i].xyz.y) || isnan(point_cloud_data[i].xyz.z))
    {
      continue;
    }
    total_size += sizeof(float) * 3;
  }

  // printf("[ CLOUD ] Writing %d bytes\n", (int)total_size);

  status = WriteFile(pipe, &type, sizeof(MessageType), &n_wrote, NULL);
  status = WriteFile(pipe, &total_size, sizeof(int), &n_wrote, NULL);
  for (int i = 0; i < width * height; i += compress)
  {
    if (isnan(point_cloud_data[i].xyz.x) || isnan(point_cloud_data[i].xyz.y) || isnan(point_cloud_data[i].xyz.z))
    {
      continue;
    }

    float points[] = {
        point_cloud_data[i].xyz.x,
        point_cloud_data[i].xyz.y,
        point_cloud_data[i].xyz.z,
    };

    status = WriteFile(pipe, &points, sizeof(float) * 3, &n_wrote, NULL);
  }

  return status;
}

HANDLE create_pipe()
{
  return CreateNamedPipe(TEXT("\\\\.\\pipe\\Pipe"),
                         PIPE_ACCESS_DUPLEX,
                         PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT, // FILE_FLAG_FIRST_PIPE_INSTANCE is not needed but forces CreateNamedPipe(..) to fail if the pipe already exists...
                         1,
                         2097152,
                         1024 * 16,
                         NMPWAIT_USE_DEFAULT_WAIT,
                         NULL);
}

BOOL interrupted = FALSE;

void sig_handler(int signo)
{
  printf("SIGINT\n");
  interrupted = TRUE;
}

void create_xy_table(const k4a_calibration_t *calibration, k4a_image_t xy_table)
{
  k4a_float2_t *table_data = (k4a_float2_t *)(void *)k4a_image_get_buffer(xy_table);

  int width = calibration->depth_camera_calibration.resolution_width;
  int height = calibration->depth_camera_calibration.resolution_height;

  k4a_float2_t p;
  k4a_float3_t ray;
  int valid;

  for (int y = 0, idx = 0; y < height; y++)
  {
    p.xy.y = (float)y;
    for (int x = 0; x < width; x++, idx++)
    {
      p.xy.x = (float)x;

      k4a_calibration_2d_to_3d(
          calibration, &p, 1.f, K4A_CALIBRATION_TYPE_DEPTH, K4A_CALIBRATION_TYPE_DEPTH, &ray, &valid);

      if (valid)
      {
        table_data[idx].xy.x = ray.xyz.x;
        table_data[idx].xy.y = ray.xyz.y;
      }
      else
      {
        table_data[idx].xy.x = nanf("");
        table_data[idx].xy.y = nanf("");
      }
    }
  }
}

void generate_point_cloud(const k4a_image_t depth_image,
                          const k4a_image_t xy_table,
                          k4a_image_t point_cloud,
                          int *point_count)
{
  int width = k4a_image_get_width_pixels(depth_image);
  int height = k4a_image_get_height_pixels(depth_image);

  uint16_t *depth_data = (uint16_t *)(void *)k4a_image_get_buffer(depth_image);
  k4a_float2_t *xy_table_data = (k4a_float2_t *)(void *)k4a_image_get_buffer(xy_table);
  k4a_float3_t *point_cloud_data = (k4a_float3_t *)(void *)k4a_image_get_buffer(point_cloud);

  *point_count = 0;
  for (int i = 0; i < width * height; i++)
  {
    if (depth_data[i] != 0 && !isnan(xy_table_data[i].xy.x) && !isnan(xy_table_data[i].xy.y))
    {
      point_cloud_data[i].xyz.x = xy_table_data[i].xy.x * (float)depth_data[i];
      point_cloud_data[i].xyz.y = xy_table_data[i].xy.y * (float)depth_data[i];
      point_cloud_data[i].xyz.z = (float)depth_data[i];
      (*point_count)++;
    }
    else
    {
      point_cloud_data[i].xyz.x = nanf("");
      point_cloud_data[i].xyz.y = nanf("");
      point_cloud_data[i].xyz.z = nanf("");
    }
  }
}

int main(void)
{
  signal(SIGINT, sig_handler);
  const int32_t TIMEOUT_IN_MS = 2000;

  const k4a_device_t device = open_device(K4A_DEVICE_DEFAULT);
  print_device_serialnum(device);

  // make sure device is stopped
  k4a_device_stop_cameras(device);

  k4a_image_t xy_table = NULL;
  k4a_image_t point_cloud = NULL;
  k4a_device_configuration_t config = get_device_configuration1();
  k4a_calibration_t calibration = get_device_calibration(device, config);

  k4a_image_create(K4A_IMAGE_FORMAT_CUSTOM,
                   calibration.depth_camera_calibration.resolution_width,
                   calibration.depth_camera_calibration.resolution_height,
                   calibration.depth_camera_calibration.resolution_width * (int)sizeof(k4a_float2_t),
                   &xy_table);

  create_xy_table(&calibration, xy_table);

  k4a_image_create(K4A_IMAGE_FORMAT_CUSTOM,
                   calibration.depth_camera_calibration.resolution_width,
                   calibration.depth_camera_calibration.resolution_height,
                   calibration.depth_camera_calibration.resolution_width * (int)sizeof(k4a_float3_t),
                   &point_cloud);

  BOOL use_gpu = TRUE;
  BOOL capture_depth = FALSE;
  k4abt_tracker_t tracker = nullptr;

  if (use_gpu)
  {
    printf("Creating tracker...\n");
    k4a_result_t create_tracker_res = k4abt_tracker_create(&calibration, &tracker);
  }

  HANDLE hPipe = create_pipe();
  while (!interrupted)
  {
    printf("Waiting for client...\n");
    if (ConnectNamedPipe(hPipe, NULL))
    {
      printf("Client Connected\n");

      start_cameras(device, &config);

      k4a_image_t color_image;
      k4a_image_t depth_image;
      int point_count = 0;
      BOOL status1 = TRUE;
      BOOL status2 = TRUE;
      BOOL status3 = TRUE;

      while (true)
      {
        if (interrupted)
        {
          printf("Interrupted\n");
          break;
        }
        if (hPipe == INVALID_HANDLE_VALUE)
        {
          printf("Disconnected\n");
          break;
        }

        // printf("Getting capture");
        k4a_capture_t sensorCapture = nullptr;
        k4a_wait_result_t captureRes = k4a_device_get_capture(device, &sensorCapture, 0);
        // printf(" %d\n", captureRes);

        if (captureRes == K4A_WAIT_RESULT_SUCCEEDED)
        {
          k4a_wait_result_t trackerQueueRes;
          if (use_gpu)
          {
            // printf("Enequeing tracker capture");
            trackerQueueRes = k4abt_tracker_enqueue_capture(tracker, sensorCapture, 2000);
            // printf(" %d\n", trackerQueueRes);
          }

          // get RGB image
          k4a_image_t color_image = k4a_capture_get_color_image(sensorCapture);
          if (color_image != NULL)
          {
            status1 = write_image_to_pipe(hPipe, color_image, MessageType::image_rgb);
            k4a_image_release(color_image);
          }

          // get Depth
          k4a_image_t depth_image;
          if (capture_depth)
          {
            depth_image = k4a_capture_get_depth_image(sensorCapture);
            if (depth_image != NULL)
            {
              generate_point_cloud(depth_image, xy_table, point_cloud, &point_count);
              status2 = write_point_cloud_to_pipe(hPipe, point_cloud, point_count);
              k4a_image_release(depth_image);
            }
          }

          k4a_capture_release(sensorCapture);

          // get bodies
          if (use_gpu)
          {
            if (trackerQueueRes == K4A_WAIT_RESULT_SUCCEEDED)
            {
              // printf("Getting body frame");
              k4abt_frame_t bodyFrame = nullptr;
              k4a_wait_result_t popFrameResult = k4abt_tracker_pop_result(tracker, &bodyFrame, 2000);
              // printf(" %d\n", popFrameResult);

              if (popFrameResult == K4A_WAIT_RESULT_SUCCEEDED)
              {
                // printf("Getting body count");
                int numBodies = k4abt_frame_get_num_bodies(bodyFrame);
                // printf(" %d\n", numBodies);

                k4abt_body_t body;
                for (int i = 0; i < numBodies; i += 1)
                {
                  // printf("Getting skeleton\n");
                  k4abt_frame_get_body_skeleton(bodyFrame, i, &body.skeleton);
                  body.id = k4abt_frame_get_body_id(bodyFrame, i);
                  status3 = write_body_to_pipe(hPipe, body);
                }

                k4abt_frame_release(bodyFrame);
              }
              else
              {
                printf("Tracker could not pop result\n");
              }
            }
            else
            {
              printf("Tracker could not enqueue capture\n");
            }
          }
        }
        else if (captureRes != K4A_WAIT_RESULT_TIMEOUT)
        {
          printf("Could not obtain capture\n");
          break;
        }

        if (!status1 || !status2 || !status3)
        {
          break;
        }
      }

      printf("Disconnecting..\n");

      DisconnectNamedPipe(hPipe);
      k4a_device_stop_cameras(device);
    }
  }

  k4a_image_release(xy_table);
  k4a_image_release(point_cloud);

  k4abt_tracker_shutdown(tracker);
  k4abt_tracker_destroy(tracker);
  k4a_device_close(device);
  printf("Done\n");
  return 0;
}
