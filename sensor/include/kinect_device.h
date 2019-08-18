#ifndef KINECT_DEVICE_H
#define KINECT_DEVICE_H

#include <k4a/k4a.h>
#include <kinect_capture.h>

class KinectDevice
{
private:
  int _device_num;
  bool _cameras_started;
  k4a_device_t _device;
  k4a_device_configuration_t _config;
  k4a_result_t _open_result;

public:
  KinectDevice(int device_num = K4A_DEVICE_DEFAULT);
  ~KinectDevice();

  static int get_device_count();

  int get_serial_size();
  void get_serial(char *serial, size_t size);
  void print_serial();
  k4a_result_t get_calibration(k4a_calibration_t *calibration);
  k4a_result_t start_cameras();
  k4a_wait_result_t get_capture(k4a_capture_t *capture, int timeout_ms);
  void stop_cameras();
  void close();

  k4a_result_t get_open_result() { return _open_result; }
  bool is_open() { return _open_result == K4A_RESULT_SUCCEEDED; }
  k4a_device_configuration_t *get_configuration() { return &_config; }
};

#endif