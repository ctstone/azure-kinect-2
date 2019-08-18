// #include <pipe_server.h>
// #include <iostream>
// #include <windows.h>

// #define ERROR_CREATE_EVENT 1
// #define ERROR_CREATE_PIPE 2
// #define ERROR_CONNECT 3
// #define ERROR_WAIT 4

// #define BUFFER_SIZE (1024 * 4)
// #define PIPE_TIMEOUT NMPWAIT_USE_DEFAULT_WAIT

// PipeServer::~PipeServer()
// {
//   disconnect();
// }

// bool PipeServer::start(LPTSTR name, int buffer_size)
// {
//   _error = 0;
//   _overlapped.hEvent = CreateEvent(
//       NULL,  // default security attribute
//       TRUE,  // manual-reset event
//       TRUE,  // initial state = signaled
//       NULL); // unnamed event object

//   if (_overlapped.hEvent == NULL)
//   {
//     _error = ERROR_CREATE_EVENT;
//     return false;
//   }

//   _pipe = CreateNamedPipe(
//       name,                     // pipe name
//       PIPE_ACCESS_DUPLEX |      // read/write access
//           FILE_FLAG_OVERLAPPED, // overlapped mode
//       PIPE_TYPE_BYTE |          // message-type pipe
//           PIPE_READMODE_BYTE |  // message-read mode
//           PIPE_WAIT,            // blocking mode
//       1,                        // number of instances
//       buffer_size,              // output buffer size
//       buffer_size,              // input buffer size
//       PIPE_TIMEOUT,             // client time-out
//       NULL);                    // default security attributes

//   if (_pipe == INVALID_HANDLE_VALUE)
//   {
//     _error = ERROR_CREATE_PIPE;
//     return false;
//   }

//   return true;
// }

// bool PipeServer::connect()
// {
//   int connect_result;
//   bool server_result;
//   DWORD result_size;

//   connect_result = ConnectNamedPipe(_pipe, &_overlapped);

//   // overlapped IO should return 0
//   if (connect_result != 0)
//   {
//     _error = ERROR_CONNECT;
//     return false;
//   }

//   // additional IO result is stored in error
//   connect_result = GetLastError();
//   switch (connect_result)
//   {
//     // The overlapped connection in progress.
//   case ERROR_IO_PENDING:
//     break;

//     // Client is already connected, so signal an event.
//   case ERROR_PIPE_CONNECTED:
//     if (SetEvent(_overlapped.hEvent))
//     {
//       return true;
//       break;
//     }
//     // If an error occurs during the connect operation...
//   default:
//     _error = connect_result;
//     return false;
//   }

//   // wait for connection or cancel
//   while (!_error && !*_interrupted)
//   {
//     server_result = _next(&result_size);
//     if (server_result)
//     {

//       return true;
//     }
//   }

//   return false;
// }

// bool PipeServer::write_message(int type, void *buffer, int size, DWORD *wrote)
// {
//   DWORD _wrote;
//   wrote = 0;
//   if (!write((uint8_t *)&type, sizeof(int), &_wrote))
//   {
//     return false;
//   }
//   wrote += _wrote;
//   if (!write((uint8_t *)&size, sizeof(int), &_wrote))
//   {
//     return false;
//   }
//   wrote += _wrote;
//   if (!write(buffer, size, &_wrote))
//   {
//     return false;
//   }
//   wrote += _wrote;
//   return true;
// }

// bool PipeServer::write(void *buffer, int size, DWORD *wrote)
// {
//   DWORD result_size;
//   DWORD wrote_bytes;
//   bool server_result;
//   bool write_result;

//   *wrote = 0;

//   do
//   {
//     write_result = WriteFile(_pipe, buffer, size, &wrote_bytes, &_overlapped);

//     if (!write_result || *_interrupted)
//     {
//       return false;
//     }

//     // wait for write or canceled
//     while (!*_interrupted)
//     {
//       server_result = _next(&result_size);

//       if (server_result)
//       {
//         if (result_size == wrote_bytes)
//         {
//           *wrote += wrote_bytes;
//           break;
//         }
//         return false;
//       }
//     }
//     // printf("Write %d of %d\n", *wrote, size);
//   } while (*wrote < size);

//   // printf("Size=%d; Wrote=%d\n", size, *wrote);

//   return true;
// }

// bool PipeServer::read(uint8_t *buffer, int size, DWORD *read)
// {
//   DWORD result_size;
//   DWORD read_bytes;
//   bool server_result;
//   bool read_result;

//   *read = 0;

//   do
//   {
//     read_result = ReadFile(_pipe, buffer, size, &read_bytes, &_overlapped);

//     if (!read_result || *_interrupted)
//     {
//       return false;
//     }

//     // wait for read or canceled
//     while (!*_interrupted)
//     {
//       server_result = _next(&result_size);
//       if (server_result)
//       {
//         if (result_size == read_bytes)
//         {
//           *read += read_bytes;
//           break;
//         }
//         return false;
//       }
//     }
//   } while (*read < size);

//   return true;
// }

// void PipeServer::set_interrupt(int *interrupted)
// {
//   _interrupted = interrupted;
// }

// bool PipeServer::disconnect()
// {
//   return _pipe == NULL
//              ? false
//              : DisconnectNamedPipe(_pipe);
// }

// bool PipeServer::_next(DWORD *size)
// {
//   int wait_result;
//   int overlapped_result;

//   wait_result = WaitForSingleObject(_pipe, 20);

//   // printf("Wait: %d\n", wait_result);

//   switch (wait_result)
//   {
//     // success
//   case WAIT_OBJECT_0:
//     // timeout
//   case WAIT_TIMEOUT:
//     overlapped_result = GetOverlappedResult(_pipe, &_overlapped, size, false);
//     // printf("Overlapped: %d\n", overlapped_result);
//     if (overlapped_result)
//     {
//       return true;
//     }
//     break;

//     // unknown error
//   default:
//     _error = GetLastError();
//     break;
//   }

//   return false;
// }
