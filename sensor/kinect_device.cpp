#include <kinect_device.h>
#include <iostream>

KinectDevice::KinectDevice(int device_num)
{
  _device = nullptr;
  _config = K4A_DEVICE_CONFIG_INIT_DISABLE_ALL;
  _device_num = device_num;
  _open_result = k4a_device_open(_device_num, &_device);
}

KinectDevice::~KinectDevice()
{
  if (_cameras_started)
  {
    stop_cameras();
  }
  close();
}

int KinectDevice::get_serial_size()
{
  size_t serial_size = 0;
  if (is_open())
  {
    k4a_device_get_serialnum(_device, NULL, &serial_size);
  }
  return serial_size;
}

void KinectDevice::get_serial(char *serial, size_t size)
{
  if (is_open())
  {
    k4a_device_get_serialnum(_device, serial, &size);
  }
}

void KinectDevice::print_serial()
{
  if (is_open())
  {
    size_t size = get_serial_size();
    char *serial = (char *)(malloc(size));
    get_serial(serial, size);
    printf("Device Serial: %s\n", serial);
    free(serial);
  }
}

k4a_result_t KinectDevice::get_calibration(k4a_calibration_t *calibration)
{
  return is_open()
             ? k4a_device_get_calibration(_device, _config.depth_mode, _config.color_resolution, calibration)
             : _open_result;
}

k4a_result_t KinectDevice::start_cameras()
{
  k4a_result_t res;
  res = is_open()
            ? k4a_device_start_cameras(_device, &_config)
            : _open_result;
  if (res == K4A_RESULT_SUCCEEDED)
  {
    _cameras_started = true;
  }
  return res;
}

k4a_wait_result_t KinectDevice::get_capture(k4a_capture_t *capture, int timeout_ms)
{
  return k4a_device_get_capture(_device, capture, timeout_ms);
}

void KinectDevice::stop_cameras()
{
  if (is_open())
  {
    k4a_device_stop_cameras(_device);
    _cameras_started = false;
  }
}

void KinectDevice::close()
{
  if (_device != nullptr && is_open())
  {
    k4a_device_close(_device);
  }
}