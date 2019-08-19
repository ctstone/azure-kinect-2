#include <iostream>
#include <k4a/k4a.h>

int main()
{
  uint8_t *buffer;
  int type;
  int size;
  k4a_float3_t points[3];
  int i;
  int total_size;
  int offset = 0;

  type = 1;
  size = 3 * sizeof(k4a_float3_t);
  total_size = sizeof(int) + sizeof(int) + size;
  buffer = (uint8_t *)malloc(total_size);

  // write data
  points[0] = {1000, 1100, 1200};
  points[1] = {2000, 2100, 2200};
  points[2] = {3000, 3100, 3200};

  // clear buffer bytes
  for (i = 0; i < total_size; i += 1)
  {
    buffer[i] = 0;
  }

  // show buffer
  for (i = 0; i < total_size; i += 1)
  {
    printf("%d:", buffer[i]);
  }
  printf("\n");

  // write type
  memcpy(&buffer[offset], &type, sizeof(int));
  offset += sizeof(int);
  for (i = 0; i < total_size; i += 1)
  {
    printf("%d:", buffer[i]);
  }
  printf("\n");

  // write size
  memcpy(&buffer[offset], &size, sizeof(int));
  offset += sizeof(int);
  for (i = 0; i < total_size; i += 1)
  {
    printf("%d:", buffer[i]);
  }
  printf("\n");

  // write data
  for (i = 0; i < 3; i += 1)
  {
    memcpy(&buffer[offset], &points[i], sizeof(k4a_float3_t));
    offset += sizeof(k4a_float3_t);
  }
  for (i = 0; i < total_size; i += 1)
  {
    printf("%d:", buffer[i]);
  }
  printf("\n");

  FILE *f = fopen("temp.bin", "wb");
  fwrite(buffer, total_size, 1, f);

  free(buffer);
  return 0;
}