#include <pipe_server.h>
#include <iostream>
#include <windows.h>

#define ERROR_CREATE_EVENT 1
#define ERROR_CREATE_PIPE 2
#define ERROR_CONNECT 3
#define ERROR_WAIT 4

#define PIPE_TIMEOUT NMPWAIT_USE_DEFAULT_WAIT

PipeServer::PipeServer()
{
}

PipeServer::~PipeServer()
{
  disconnect();
}

bool PipeServer::start(LPTSTR name, int buffer_size)
{
  _error = 0;
  _pipe = CreateNamedPipe(
      name,                    // pipe name
      PIPE_ACCESS_OUTBOUND,    // read/write access
      PIPE_TYPE_BYTE |         // message-type pipe
          PIPE_READMODE_BYTE | // message-read mode
          PIPE_WAIT,           // blocking mode
      1,                       // number of instances
      buffer_size,             // output buffer size
      buffer_size,             // input buffer size
      PIPE_TIMEOUT,            // client time-out
      NULL);                   // default security attributes

  if (_pipe == INVALID_HANDLE_VALUE)
  {
    _error = ERROR_CREATE_PIPE;
    return false;
  }

  return true;
}

bool PipeServer::connect()
{
  return ConnectNamedPipe(_pipe, NULL);
}

bool PipeServer::write_message(int type, void *buffer, int size, DWORD *wrote)
{
  DWORD _wrote;

  *wrote = 0;
  if (!write((uint8_t *)&type, sizeof(int), &_wrote))
  {
    return false;
  }
  *wrote += _wrote;
  if (!write((uint8_t *)&size, sizeof(int), &_wrote))
  {
    return false;
  }
  *wrote += _wrote;
  if (!write(buffer, size, &_wrote))
  {
    return false;
  }
  *wrote += _wrote;
  return true;
}

bool PipeServer::write(void *data, int size, DWORD *wrote)
{
  DWORD result_size;
  DWORD wrote_bytes;
  uint8_t *buffer = (uint8_t *)data;

  *wrote = 0;

  do
  {
    if (!WriteFile(_pipe, &buffer[*wrote], size, &wrote_bytes, NULL) || *_interrupted)
    {
      return false;
    }
    *wrote += wrote_bytes;

  } while (*wrote < size);

  return true;
}

bool PipeServer::read(uint8_t *buffer, int size, DWORD *read)
{
  DWORD result_size;
  DWORD read_bytes;

  *read = 0;

  do
  {
    if (!ReadFile(_pipe, buffer, size, &read_bytes, NULL))
    {
      return false;
    }
    *read += read_bytes;

  } while (*read < size);

  return true;
}

void PipeServer::set_interrupt(int *interrupted)
{
  _interrupted = interrupted;
}

bool PipeServer::disconnect()
{
  return _pipe == NULL
             ? false
             : DisconnectNamedPipe(_pipe);
}
