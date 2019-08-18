#ifndef KINECT_BT_FRAME
#define KINECT_BT_FRAME

#include <k4abt.h>

class KinectTrackerFrame
{

private:
  k4abt_frame_t _frame;

public:
  KinectTrackerFrame(k4abt_frame_t bodyFrame);
  ~KinectTrackerFrame();

  int get_body_id(int index);
  k4a_image_t get_body_index_map();
  k4a_result_t get_body_skeleton(int index, k4abt_skeleton_t *skeleton);
  k4a_capture_t get_capture();
  int get_num_bodies();
  uint64_t get_timestamp_usec();
};

#endif