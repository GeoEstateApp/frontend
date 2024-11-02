import { useEffect, useState } from "react"

enum Device {
  mobile = 'mobile',
  tablet = 'tablet',
  desktop = 'desktop',
  unknown = 'unknown',
}

export const useDevice = () => {
  const [device, setDevice] = useState<Device>(Device.unknown);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setDevice(Device.mobile);
      else if (window.innerWidth < 1024) setDevice(Device.tablet);
      else setDevice(Device.desktop);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return device;
}