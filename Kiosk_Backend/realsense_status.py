import pyrealsense2 as rs
import json

def get_realsense_status():
    try:
        ctx_rs = rs.context()
        devices = ctx_rs.query_devices()

        if len(devices) == 0:
            return {
                "camera_name": "Intel RealSense D435i",
                "status": "Offline ❌",
                "serial_number": "N/A",
                "firmware_version": "N/A",
                "connected": False
            }
        else:
            dev = devices[0]
            return {
                "camera_name": dev.get_info(rs.camera_info.name),
                "status": "Online ✅",
                "serial_number": dev.get_info(rs.camera_info.serial_number),
                "firmware_version": dev.get_info(rs.camera_info.firmware_version),
                "connected": True
            }

    except Exception as e:
        return {
            "camera_name": "Intel RealSense D435i",
            "status": f"Error ⚠️: {str(e)}",
            "serial_number": "N/A",
            "firmware_version": "N/A",
            "connected": False
        }

if __name__ == "__main__":
    status = get_realsense_status()
    print(json.dumps(status))
