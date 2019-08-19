#ifndef PIPE_SERVER_H
#define PIPE_SERVER_H

#include <windows.h>
#include <stdint.h>

class PipeServer
{
private:
  HANDLE _pipe;
  int _error;
  int *_interrupted;

public:
  PipeServer();
  ~PipeServer();

  bool start(LPTSTR name, int buffer_size);
  bool connect();
  bool disconnect();
  bool write(void *buffer, int size, DWORD *wrote);
  bool write_message(int type, void *buffer, int size, DWORD *wrote);
  bool read(uint8_t *buffer, int size, DWORD *read);
  void set_interrupt(int *interrupted);

  int get_error() { return _error; }
};

#endif