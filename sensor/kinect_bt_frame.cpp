#include <kinect_bt_frame.h>

KinectTrackerFrame::KinectTrackerFrame(k4abt_frame_t frame)
{
  _frame = frame;
}

KinectTrackerFrame::~KinectTrackerFrame()
{
  k4abt_frame_release(_frame);
}

int KinectTrackerFrame::get_body_id(int index)
{
  return k4abt_frame_get_body_id(_frame, index);
}

k4a_image_t KinectTrackerFrame::get_body_index_map()
{
  return k4abt_frame_get_body_index_map(_frame);
}

k4a_result_t KinectTrackerFrame::get_body_skeleton(int index, k4abt_skeleton_t *skeleton)
{
  return k4abt_frame_get_body_skeleton(_frame, index, skeleton);
}

k4a_capture_t KinectTrackerFrame::get_capture()
{
  return k4abt_frame_get_capture(_frame);
}

int KinectTrackerFrame::get_num_bodies()
{
  return k4abt_frame_get_num_bodies(_frame);
}

uint64_t KinectTrackerFrame::get_timestamp_usec()
{
  return k4abt_frame_get_timestamp_usec(_frame);
}