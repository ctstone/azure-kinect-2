#include <windows.h>
#include <signal.h>
#include <iostream>

#define ERROR_CREATE_EVENT 1
#define ERROR_CREATE_PIPE 2
#define ERROR_CONNECT 3
#define ERROR_WAIT 4
#define BUFFER_SIZE (1024 * 4)
#define PIPE_TIMEOUT NMPWAIT_USE_DEFAULT_WAIT

BOOL interrupted = FALSE;

void sig_handler(int signo)
{
  interrupted = TRUE;
}

int main()
{
  int returnCode = 0;
  HANDLE hEvent = CreateEvent(
      NULL,  // default security attribute
      TRUE,  // manual-reset event
      TRUE,  // initial state = signaled
      NULL); // unnamed event object
  HANDLE hPipe;
  OVERLAPPED overlapped;
  BOOL connect_result;
  LPTSTR pipe_name = TEXT("\\\\.\\pipe\\mynamedpipe");
  BOOL connected = FALSE;
  DWORD wait;

  signal(SIGINT, sig_handler);

  if (hEvent == NULL)
  {
    returnCode = ERROR_CREATE_EVENT;
    goto Exit;
  }

  overlapped.hEvent = hEvent;

  hPipe = CreateNamedPipe(
      pipe_name,                // pipe name
      PIPE_ACCESS_DUPLEX |      // read/write access
          FILE_FLAG_OVERLAPPED, // overlapped mode
      PIPE_TYPE_BYTE |          // message-type pipe
          PIPE_READMODE_BYTE |  // message-read mode
          PIPE_WAIT,            // blocking mode
      1,                        // number of instances
      BUFFER_SIZE,              // output buffer size
      BUFFER_SIZE,              // input buffer size
      PIPE_TIMEOUT,             // client time-out
      NULL);                    // default security attributes

  if (hPipe == INVALID_HANDLE_VALUE)
  {
    returnCode = ERROR_CREATE_PIPE;
    goto Exit;
  }

  connect_result = ConnectNamedPipe(hPipe, &overlapped);

  printf("Connect result %d", connect_result);

  if (connect_result != 0)
  {
    returnCode = ERROR_CONNECT;
    goto Exit;
  }

  printf("Last error: %d", GetLastError());

  switch (GetLastError())
  {
    // The overlapped connection in progress.
  case ERROR_IO_PENDING:
    break;

    // Client is already connected, so signal an event.
  case ERROR_PIPE_CONNECTED:
    if (SetEvent(overlapped.hEvent))
      break;

    // If an error occurs during the connect operation...
  default:
    returnCode = GetLastError();
    goto Exit;
  }

  while (!interrupted)
  {

    printf("Waiting for client...\n");
    while (!interrupted && !connected)
    {
      wait = WaitForSingleObject(hPipe, 2000);
      printf("WAIT: %d\n", wait);

      DWORD bytes_returned;
      int success = GetOverlappedResult(hPipe, &overlapped, &bytes_returned, FALSE);
      printf("Result: %d -> %d", success, bytes_returned);

      switch (wait)
      {
        // success
      case WAIT_OBJECT_0:
        break;

        // timeout
      case WAIT_TIMEOUT:
        continue;

        // unknown error
      default:
        returnCode = GetLastError();
        goto Exit;
      }
    }

    if (interrupted)
    {
      break;
    }

    connected = TRUE;

    printf("CONNECTED\n");
  }

Exit:
  printf("Done (%d)\n", returnCode);
  return returnCode;
}