#ifndef KINECT_BT_TRACKER_H
#define KINECT_BT_TRACKER_H

#include <k4abt.h>

class KinectTracker
{
private:
  k4abt_tracker_t _tracker;

public:
  KinectTracker();
  ~KinectTracker();

  k4a_result_t calibrate(k4a_calibration_t *calibration);
  k4a_wait_result_t enqueue_capture(k4a_capture_t capture, int timeout_ms);
  k4a_wait_result_t pop_result(k4abt_frame_t *frame, int timeout_ms);
};

#endif