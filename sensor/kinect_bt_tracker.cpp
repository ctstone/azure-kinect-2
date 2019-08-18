#include <kinect_bt_tracker.h>

KinectTracker::KinectTracker()
{
  _tracker = NULL;
}

KinectTracker::~KinectTracker()
{
  if (_tracker != NULL)
  {
    k4abt_tracker_destroy(_tracker);
  }
}

k4a_result_t KinectTracker::calibrate(k4a_calibration_t *calibration)
{
  return k4abt_tracker_create(calibration, &_tracker);
}

k4a_wait_result_t KinectTracker::enqueue_capture(k4a_capture_t capture, int timeout_ms)
{
  return k4abt_tracker_enqueue_capture(_tracker, capture, timeout_ms);
}

k4a_wait_result_t KinectTracker::pop_result(k4abt_frame_t *frame, int timeout_ms)
{
  return k4abt_tracker_pop_result(_tracker, frame, timeout_ms);
}
