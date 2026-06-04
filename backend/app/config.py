import os

PYSERIAL_AVAILABLE = False
try:
    import serial
    PYSERIAL_AVAILABLE = True
except ImportError:
    pass

SERIAL_PORT = os.environ.get("SERIAL_PORT", "COM4")
BAUD_RATE = 115200
BUFFER_SIZE = 1000

SIMULATED_MODE = not PYSERIAL_AVAILABLE
