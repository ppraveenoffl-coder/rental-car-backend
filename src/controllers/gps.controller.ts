import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from '../schemas/vehicle.schema';
import { Auth } from '../Auth/guards/auth.decorator';
import { TenantId } from '../Auth/guards/tenant.decorator';

@Controller('gps')
export class GpsController {
  constructor(
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<Vehicle>,
  ) {}

  // Webhook for Wheelseye integration
  // Exposes POST /api/gps/webhook/wheelseye
  @Post('webhook/wheelseye')
  async handleWebhook(@Body() payload: any) {
    const { deviceId, lat, lng, speed, ignition } = payload;
    if (!deviceId) {
      return { success: false, message: 'Missing deviceId' };
    }

    // Update vehicle having this deviceId across any tenant
    const vehicle = await this.vehicleModel.findOneAndUpdate(
      { gpsDeviceId: deviceId },
      {
        liveLocation: {
          lat: Number(lat),
          lng: Number(lng),
          speed: Number(speed || 0),
          ignition: Boolean(ignition),
          lastUpdate: new Date().toISOString(),
        },
      },
      { new: true },
    );

    if (!vehicle) {
      return { success: false, message: `Vehicle with device ID ${deviceId} not found` };
    }

    return { success: true };
  }

  // Get live tracking details for a vehicle (supports simulation fallback)
  // Exposes GET /api/gps/track/:id
  @Get('track/:id')
  @Auth()
  async trackVehicle(@Param('id') id: string, @TenantId() tenantId: string) {
    const vehicle = await this.vehicleModel.findOne({ _id: id, tenantId });
    if (!vehicle) {
      throw new NotFoundException({ message: 'Vehicle not found' });
    }

    // If a real GPS device has recently updated, return the real coordinates.
    // Otherwise (or if running simulation), fallback to an elegant dynamic simulation path around Bangalore center.
    if (vehicle.liveLocation && (Date.now() - new Date(vehicle.liveLocation.lastUpdate).getTime()) < 120000) {
      return {
        vehicleId: vehicle._id,
        name: vehicle.name,
        vehicleNo: vehicle.vehicleNo,
        status: vehicle.status,
        gpsProvider: vehicle.gpsProvider || 'Wheelseye',
        gpsDeviceId: vehicle.gpsDeviceId,
        liveLocation: vehicle.liveLocation,
        isSimulated: false,
      };
    }

    // Determine simulation behavior based on status
    const isRunning = vehicle.status === 'Running';
    
    // Generate a moving coordinate sequence using sine/cosine seeded by current time
    // Base center: Bangalore (12.9716, 77.5946)
    const seed = vehicle.vehicleNo ? vehicle.vehicleNo.charCodeAt(0) + vehicle.vehicleNo.charCodeAt(1) : 0;
    const time = Date.now() / 60000; // 1 cycle per minute
    const radius = isRunning ? 0.015 : 0.0; // static if not running
    
    const lat = 12.9716 + (seed % 100) * 0.001 + radius * Math.sin(time + seed);
    const lng = 77.5946 + (seed % 80) * 0.001 + radius * Math.cos(time * 0.8 + seed);
    const speed = isRunning ? Math.round(45 + Math.sin(time * 5) * 15) : 0;
    const ignition = isRunning;

    return {
      vehicleId: vehicle._id,
      name: vehicle.name,
      vehicleNo: vehicle.vehicleNo,
      status: vehicle.status,
      gpsProvider: vehicle.gpsProvider || 'Wheelseye (Simulated)',
      gpsDeviceId: vehicle.gpsDeviceId || 'SIM-WE-1029',
      liveLocation: {
        lat,
        lng,
        speed,
        ignition,
        lastUpdate: new Date().toISOString(),
      },
      isSimulated: true,
    };
  }
}
